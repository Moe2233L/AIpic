import json

from .errors import UpstreamAPIError


def auth_headers(key, header="Authorization"):
    token = f"Bearer {key}" if header == "Authorization" else key
    return {header: token, "Content-Type": "application/json"}


async def post_json(client, url, *, headers=None, **kwargs):
    response = await client.post(url, headers=headers, **kwargs)
    if not response.is_success:
        raise UpstreamAPIError(f"API 返回 {response.status_code}: {response.text[:200]}")
    try:
        data = response.json()
    except Exception:
        raise UpstreamAPIError(f"API 返回非 JSON: {response.text[:150]}")
    if isinstance(data, dict) and data.get("error"):
        err = data["error"]
        raise UpstreamAPIError(err.get("message") if isinstance(err, dict) else str(err))
    return data


def extract_model_text(data):
    if not isinstance(data, dict):
        return str(data)
    if isinstance(data.get("output_text"), str):
        return data["output_text"]

    choices = data.get("choices") or []
    if choices:
        first = choices[0] or {}
        message = first.get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return "".join(part.get("text", "") for part in content if isinstance(part, dict))
        if isinstance(first.get("text"), str):
            return first["text"]

    output = data.get("output") or []
    for item in output:
        for content in item.get("content", []) if isinstance(item, dict) else []:
            if isinstance(content, dict) and isinstance(content.get("text"), str):
                return content["text"]
    return ""


def parse_enhance_text(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    try:
        data = json.loads(cleaned)
        return {
            "prompt": str(data.get("prompt") or data.get("positive_prompt") or "").strip(),
            "negative_prompt": str(data.get("negative_prompt") or "").strip(),
        }
    except Exception:
        return {"prompt": cleaned, "negative_prompt": ""}
