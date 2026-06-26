from pydantic import BaseModel


class GenerateReq(BaseModel):
    provider_id: str
    model: str
    prompt: str
    key: str
    url: str | None = None
    size: str = "1024x1024"
    n: int = 1
    reference_image: str | None = None
    image_mode: str = "style"


class EnhanceReq(BaseModel):
    prompt: str
    theme: str = ""
    style: str = ""
    negative: str = ""
    key: str
    url: str
    model: str
