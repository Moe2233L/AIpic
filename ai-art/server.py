"""AI Art 文生图后端代理 (FastAPI)"""

from backend import create_app

app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
