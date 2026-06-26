import base64

import httpx

from .client_utils import auth_headers, post_json
from .errors import InternalAppError, UpstreamAPIError
from .image_utils import decode_data_url, extract_image_values, image_mode_prompt, image_response, to_data_url


async def openai_handler(key, url, model, prompt, size, n=1, reference_image=None, image_mode="style"):
    async with httpx.AsyncClient(timeout=60) as client:
        count = max(1, min(int(n or 1), 4))
        if reference_image:
            data = await openai_image_edit(client, key, url, model, prompt, size, count, reference_image, image_mode)
        else:
            data = await post_json(
                client,
                url,
                headers=auth_headers(key),
                json={"model": model, "prompt": prompt, "n": count, "size": size},
            )

        raw_values = extract_image_values(data)
        if not raw_values:
            raise UpstreamAPIError(
                f"API 已调用成功，但未找到图片字段。返回字段: {', '.join(data.keys())}",
                code="missing_image_field",
            )

        urls = [await to_data_url(client, url, raw) for raw in raw_values[:count]]
        return image_response(urls)


async def openai_image_edit(client, key, url, model, prompt, size, n, reference_image, image_mode):
    edit_url = url.replace("/generations", "/edits")
    mime, image_bytes = decode_data_url(reference_image)
    response = await client.post(
        edit_url,
        headers={"Authorization": f"Bearer {key}"},
        data={"model": model, "prompt": image_mode_prompt(prompt, image_mode), "n": str(n), "size": size},
        files={"image": ("reference.png", image_bytes, mime)},
    )
    if not response.is_success:
        raise UpstreamAPIError(
            f"图生图 API 返回 {response.status_code}: {response.text[:200]}",
            code="image_edit_failed",
        )
    try:
        return response.json()
    except Exception:
        raise UpstreamAPIError(
            f"图生图 API 返回非 JSON: {response.text[:150]}",
            code="image_edit_non_json",
        )


async def stability_handler(key, url, model, prompt, size=None, n=1, reference_image=None, image_mode="style"):
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            url,
            headers={"Authorization": f"Bearer {key}"},
            files={"prompt": (None, prompt), "output_format": (None, "png")},
            data={"model": model},
        )
        if not response.is_success:
            raise UpstreamAPIError(response.text, code="stability_generate_failed")
        b64 = base64.b64encode(response.content).decode()
        return image_response(f"data:image/png;base64,{b64}")


async def flux_handler(key, url, model, prompt, size=None, n=1, reference_image=None, image_mode="style"):
    async with httpx.AsyncClient(timeout=60) as client:
        data = await post_json(
            client,
            f"{url}/{model}",
            headers=auth_headers(key, "x-key"),
            json={"prompt": prompt, "width": 1024, "height": 1024},
        )
        if data.get("status") == "error":
            raise UpstreamAPIError(str(data), code="flux_generate_failed")
        return image_response(data.get("result", {}).get("sample") or data.get("image", {}).get("url"))


async def google_handler(key, url, model, prompt, size=None, n=1, reference_image=None, image_mode="style"):
    async with httpx.AsyncClient(timeout=60) as client:
        data = await post_json(
            client,
            f"{url}/v1beta/models/{model}:predict",
            params={"key": key},
            json={"instances": [{"prompt": prompt}], "parameters": {"sampleCount": 1}},
        )
        b64 = data.get("predictions", [{}])[0].get("bytesBase64Encoded")
        if not b64:
            raise InternalAppError("无返回图片", code="google_missing_image")
        return image_response(f"data:image/png;base64,{b64}")


async def ideogram_handler(key, url, model, prompt, size=None, n=1, reference_image=None, image_mode="style"):
    async with httpx.AsyncClient(timeout=60) as client:
        data = await post_json(
            client,
            url,
            headers=auth_headers(key, "Api-Key"),
            json={"image_request": {"model": model, "prompt": prompt, "width": 1024, "height": 1024}},
        )
        return image_response(data["data"][0]["url"])


async def midjourney_handler(key, url, model, prompt, size=None, n=1, reference_image=None, image_mode="style"):
    async with httpx.AsyncClient(timeout=120) as client:
        data = await post_json(
            client,
            f"{url}/imagine",
            headers=auth_headers(key, "X-API-Key"),
            json={"model": model, "prompt": prompt},
        )
        return image_response(data.get("image_url") or data.get("task_id"))


async def leonardo_handler(key, url, model, prompt, size=None, n=1, reference_image=None, image_mode="style"):
    async with httpx.AsyncClient(timeout=60) as client:
        data = await post_json(
            client,
            url,
            headers=auth_headers(key),
            json={"modelId": model, "prompt": prompt, "width": 1024, "height": 1024},
        )
        return image_response(data["sdGenerationJob"]["generated_images"][0]["url"])


PROVIDER_HANDLERS = {
    "openai": openai_handler,
    "custom": openai_handler,
    "together": openai_handler,
    "recraft": openai_handler,
    "nonabanana": stability_handler,
    "flux": flux_handler,
    "google": google_handler,
    "ideogram": ideogram_handler,
    "midjourney": midjourney_handler,
    "leonardo": leonardo_handler,
}
