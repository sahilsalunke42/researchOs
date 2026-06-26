from fastapi import FastAPI
import uvicorn
from app.api.routes import router

app = FastAPI(
    title="AI API"
)

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)