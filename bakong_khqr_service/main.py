from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from bakong_khqr_service.routes.qr_routes import router

app = FastAPI(title="Bakong KHQR Service")

app.include_router(router)

@app.get("/")
def health():
    return {"status": "Bakong service running"}
