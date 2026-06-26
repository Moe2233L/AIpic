import base64
import binascii
from urllib.parse import urljoin

from .errors import BadRequestError, InternalAppError, UpstreamAPIError

IMAGE_FIELD_NAMES = {
    "url",
    "image_url",
    "b64_json",
    "base64",
    "base64_json",
    "image_base64",
    "bytesBase64Encoded",
}


def image_response(value):
    if not value:
        raise InternalAppError("API 未返回图片", code="empty_image_response")
    values = value if isinstance(value, list) else [value]
    return {"image_url": values[0], "image_urls": values}


def decode_data_url(value):
    try:
        if "," not in value:
            return "image/png", base64.b64decode(value)
        header, b64 = value.split(",", 1)
        mime = header.split(";")[0].replace("data:", "") or "image/png"
        return mime, base64.b64decode(b64)
    except (binascii.Error, ValueError):
        raise BadRequestError("参考图格式无效", code="invalid_reference_image")


def image_mode_prompt(prompt, mode):
    modes = {
        "style": "Use the reference image as visual guidance and change its style.",
        "redraw": "Redraw the reference image while preserving the main subject and composition.",
        "product": "Transform the reference image into a polished commercial product visual.",
        "poster": "Transform the reference image into a dramatic poster-style key visual.",
    }
    return f"{prompt}. {modes.get(mode, modes['style'])}"


def extract_image_values(payload):
    values = []
    if isinstance(payload, dict):
        data = payload.get("data")
        if isinstance(data, list):
            for item in data:
                values.extend(extract_image_values(item))
        for key in IMAGE_FIELD_NAMES:
            value = payload.get(key)
            if looks_like_image_value(value):
                values.append(value.strip())
        for value in payload.values():
            if isinstance(value, (dict, list)):
                values.extend(extract_image_values(value))
    elif isinstance(payload, list):
        for item in payload:
            values.extend(extract_image_values(item))
    elif looks_like_image_value(payload):
        values.append(payload.strip())

    result = []
    for value in values:
        if value not in result:
            result.append(value)
    return result


def looks_like_image_value(value):
    if not isinstance(value, str):
        return False
    text = value.strip()
    if text.startswith(("data:image/", "http://", "https://", "/")):
        return True
    if len(text) > 100 and not any(ch.isspace() for ch in text):
        return True
    return False


async def to_data_url(client, api_url, raw):
    raw = raw.strip()
    if raw.startswith("data:image/"):
        return raw
    if raw.startswith("/") and not raw.startswith("//"):
        raw = urljoin(api_url, raw)
    if raw.startswith(("http://", "https://")):
        img = await client.get(raw)
        if not img.is_success:
            raise UpstreamAPIError(f"图片下载失败 ({img.status_code})", code="image_download_failed")
        mime = img.headers.get("content-type", "image/png").split(";")[0]
        if not mime.startswith("image/"):
            mime = "image/png"
        b64 = base64.b64encode(img.content).decode()
        return f"data:{mime};base64,{b64}"
    return f"data:image/png;base64,{raw}"
