from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .errors import AppError
from .routes import create_router


def create_app():
    app = FastAPI(title="AI Art")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def handle_app_error(_, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": "请求参数无效", "code": "validation_error", "errors": exc.errors()},
        )

    static_dir = Path(__file__).resolve().parent.parent / "static"
    app.include_router(create_router(static_dir))
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    return app
