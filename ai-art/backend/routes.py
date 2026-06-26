import json
from pathlib import Path

import httpx
from fastapi import APIRouter
from fastapi.responses import FileResponse

from .client_utils import auth_headers, extract_model_text, parse_enhance_text, post_json
from .errors import BadRequestError, InternalAppError
from .handlers import PROVIDER_HANDLERS, openai_handler
from .image_utils import image_response
from .providers import PROVIDERS, list_provider_defs
from .schemas import EnhanceReq, GenerateReq


def create_router(static_dir: Path):
    router = APIRouter()

    @router.get("/api/providers")
    def list_providers():
        return list_provider_defs()

    @router.post("/api/generate")
    async def generate_image(req: GenerateReq):
        provider = PROVIDERS.get(req.provider_id)
        if not provider:
            raise BadRequestError("未知厂商", code="unknown_provider")

        url = req.url or provider["url"]
        model = req.model or provider["models"][0]["id"]
        handler = PROVIDER_HANDLERS.get(req.provider_id, openai_handler)
        count = max(1, min(int(req.n or 1), 4))
        supports_reference_image = req.provider_id in {"openai", "custom", "together", "recraft"}

        if req.reference_image and not supports_reference_image:
            raise BadRequestError(
                "当前厂商暂未接入参考图，请切换到 OpenAI 兼容接口或支持 /images/edits 的中转站",
                code="reference_image_unsupported",
            )

        async def single_call(call_count):
            return await handler(
                req.key,
                url,
                model,
                req.prompt,
                req.size,
                call_count,
                req.reference_image if supports_reference_image else None,
                req.image_mode,
            )

        if count == 1:
            result = await single_call(1)
            urls = [value for value in (result.get("image_urls") or [result.get("image_url")]) if value]
            return image_response(urls)

        urls = []
        try:
            result = await single_call(count)
            urls = [value for value in (result.get("image_urls") or [result.get("image_url")]) if value]
        except Exception:
            urls = []

        while len(urls) < count:
            extra = await single_call(1)
            extra_urls = [value for value in (extra.get("image_urls") or [extra.get("image_url")]) if value]
            if not extra_urls:
                break
            urls.extend(extra_urls[:1])

        return image_response(urls[:count])

    @router.post("/api/enhance")
    async def enhance_prompt(req: EnhanceReq):
        if not req.prompt.strip():
            raise BadRequestError("请输入提示词", code="missing_prompt")
        if not req.key.strip() or not req.url.strip() or not req.model.strip():
            raise BadRequestError("请先配置提示词优化 API", code="missing_enhance_settings")

        system = (
            "You are a senior prompt engineer for text-to-image generation. "
            "Rewrite the user's idea into one concise, high-quality English image prompt. "
            "Preserve the user's intent. Add concrete visual details, composition, lighting, camera, "
            "materials, mood, and quality terms when useful. Do not mention policies or explanations. "
            "Return JSON only with keys: prompt, negative_prompt."
        )
        user = {
            "idea": req.prompt,
            "theme": req.theme,
            "style": req.style,
            "current_negative_prompt": req.negative,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            data = await post_json(
                client,
                req.url,
                headers=auth_headers(req.key),
                json={
                    "model": req.model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
                    ],
                    "temperature": 0.7,
                },
            )

        text = extract_model_text(data).strip()
        result = parse_enhance_text(text)
        if not result.get("prompt"):
            raise InternalAppError("优化模型未返回有效提示词", code="empty_enhance_prompt")
        return result

    @router.get("/")
    async def index():
        return FileResponse(static_dir / "index.html")

    return router
