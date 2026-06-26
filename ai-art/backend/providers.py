PROVIDERS = {
    "openai": {
        "name": "OpenAI",
        "url": "https://api.openai.com/v1/images/generations",
        "models": [
            {"id": "gpt-image-2", "name": "gpt-image-2 (最新)"},
            {"id": "gpt-image-1", "name": "gpt-image-1"},
            {"id": "dall-e-3", "name": "DALL-E 3"},
            {"id": "dall-e-2", "name": "DALL-E 2"},
        ],
    },
    "nonabanana": {
        "name": "Nonabanana (Stability)",
        "url": "https://api.stability.ai/v2beta/stable-image/generate",
        "models": [
            {"id": "stable-diffusion-3.5-large", "name": "SD 3.5 Large"},
            {"id": "stable-diffusion-3.5-medium", "name": "SD 3.5 Medium"},
            {"id": "stable-diffusion-xl-1024-v1-0", "name": "SDXL 1.0"},
            {"id": "stable-diffusion-xl-1024-v0-9", "name": "SDXL 0.9"},
            {"id": "stable-image-ultra", "name": "Stable Image Ultra"},
            {"id": "stable-image-core", "name": "Stable Image Core"},
        ],
    },
    "flux": {
        "name": "Flux (Black Forest Labs)",
        "url": "https://api.bfl.ml/v1",
        "models": [
            {"id": "flux-pro-1.1-ultra", "name": "Flux 1.1 Pro Ultra"},
            {"id": "flux-pro-1.1", "name": "Flux 1.1 Pro"},
            {"id": "flux-pro", "name": "Flux 1 Pro"},
            {"id": "flux-dev", "name": "Flux 1 Dev"},
            {"id": "flux-schnell", "name": "Flux 1 Schnell"},
        ],
    },
    "google": {
        "name": "Google Imagen",
        "url": "https://generativelanguage.googleapis.com",
        "models": [
            {"id": "imagen-3.0-generate-001", "name": "Imagen 3"},
            {"id": "imagen-2.0-generate-001", "name": "Imagen 2"},
        ],
    },
    "ideogram": {
        "name": "Ideogram",
        "url": "https://api.ideogram.ai/generate",
        "models": [
            {"id": "V_2", "name": "Ideogram V2"},
            {"id": "V_2_TURBO", "name": "Ideogram V2 Turbo"},
            {"id": "V_1", "name": "Ideogram V1"},
        ],
    },
    "recraft": {
        "name": "Recraft",
        "url": "https://api.recraft.ai/v1/images/generations",
        "models": [
            {"id": "recraft-v3", "name": "Recraft V3"},
            {"id": "recraft-v3-svg", "name": "Recraft V3 (SVG)"},
        ],
    },
    "midjourney": {
        "name": "Midjourney (via GoAPI)",
        "url": "https://api.goapi.ai/mj/v2",
        "models": [
            {"id": "midjourney-v6.1", "name": "MJ V6.1"},
            {"id": "midjourney-v6", "name": "MJ V6"},
            {"id": "midjourney-niji-6", "name": "Niji V6"},
            {"id": "midjourney-v5.2", "name": "MJ V5.2"},
        ],
    },
    "leonardo": {
        "name": "Leonardo AI",
        "url": "https://cloud.leonardo.ai/api/rest/v1/generations",
        "models": [
            {"id": "phoenix", "name": "Phoenix"},
            {"id": "lightning-xl", "name": "Lightning XL"},
            {"id": "anime-xl", "name": "Anime XL"},
            {"id": "vision-xl", "name": "Vision XL"},
        ],
    },
    "together": {
        "name": "Together AI",
        "url": "https://api.together.xyz/v1/images/generations",
        "models": [
            {"id": "black-forest-labs/FLUX.1-schnell", "name": "FLUX.1 Schnell"},
            {"id": "black-forest-labs/FLUX.1-pro", "name": "FLUX.1 Pro"},
            {"id": "stabilityai/stable-diffusion-xl-base-1.0", "name": "SDXL 1.0"},
        ],
    },
    "custom": {
        "name": "自定义 OpenAI 兼容",
        "url": "https://api.openai.com/v1/images/generations",
        "models": [{"id": "", "name": "手动输入模型"}],
    },
}


def list_provider_defs():
    return [
        {
            "id": provider_id,
            "name": provider["name"],
            "url": provider["url"],
            "models": provider["models"],
        }
        for provider_id, provider in PROVIDERS.items()
    ]
