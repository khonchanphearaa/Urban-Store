import os
import time
import requests
from io import BytesIO
from pathlib import Path
import base64
import qrcode
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.templating import Jinja2Templates
from dotenv import load_dotenv
from pydantic import BaseModel

from bakong import generate_khqr

load_dotenv()
router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

NODE_API = os.getenv("NODE_API_BASE_URL")
QR_EXPIRE_SECONDS = 300


def fetch_payment_info(order_id: str):
    url = f"{NODE_API}/payments/{order_id}/info"
    r = requests.get(url, timeout=5)
    if r.status_code != 200:
        raise Exception("Failed to fetch payment info")
    return r.json()


# @router.get("/ui/{order_id}", response_class=HTMLResponse)
# def show_qr_ui(request: Request, order_id: str):

#     # ✅ GET REAL AMOUNT FROM NODE
#     payment_info = fetch_payment_info(order_id)
#     amount = payment_info["amount"]

#     # Generate KHQR
#     qr_string = generate_khqr(amount, order_id)

#     qr_img = qrcode.make(qr_string)
#     buffer = BytesIO()
#     qr_img.save(buffer, format="PNG")
#     qr_base64 = base64.b64encode(buffer.getvalue()).decode()

#     expires_at = int(time.time()) + QR_EXPIRE_SECONDS

#     return templates.TemplateResponse(
#         "qr.html",
#         {
#             "request": request,
#             "order_id": order_id,
#             "amount": amount,              # ✅ REAL AMOUNT
#             "qr_base64": qr_base64,
#             "expires_at": expires_at
#         }
#     )
class QRRequest(BaseModel):
    order_id: str
    amount: int

@router.post("/create-qr")
def create_qr(payload: QRRequest):
    qr_string = generate_khqr(payload.amount, payload.order_id)
    return { "qr_string": qr_string }
