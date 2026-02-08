import os
import time
import requests
import hashlib
from io import BytesIO
from pathlib import Path
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
BAKONG_TOKEN = os.getenv("BAKONG_TOKEN")
BAKONG_API_BASE = os.getenv("BAKONG_API_BASE_URL", "https://api-bakong.nbc.gov.kh")
BAKONG_CHECK_PATH = "/v1/check_transaction_by_md5"


def fetch_payment_info(order_id: str):
    url = f"{NODE_API}/payments/{order_id}/info"
    r = requests.get(url, timeout=5)
    if r.status_code != 200:
        raise Exception("Failed to fetch payment info")
    return r.json()


class QRRequest(BaseModel):
    order_id: str
    amount: int

@router.get("/debug/token-check")
def debug_token():
    """Debug endpoint to check if token is valid"""
    return {
        "token_exists": bool(BAKONG_TOKEN),
        "token_length": len(BAKONG_TOKEN) if BAKONG_TOKEN else 0,
        "token_preview": f"{BAKONG_TOKEN[:20]}...{BAKONG_TOKEN[-10:]}" if BAKONG_TOKEN else "NO TOKEN",
        "is_jwt": BAKONG_TOKEN.startswith("eyJ") if BAKONG_TOKEN else False,
        "message": "If is_jwt=True, this is a JWT token, not a Bakong API token!"
    }


@router.post("/create-qr")
def create_qr(payload: QRRequest):
    qr_string = generate_khqr(payload.amount, payload.order_id)
    return { "qr_string": qr_string }


@router.post("/check-payment")
def check_payment_bakong(payload: dict):
    """Check payment status with Bakong API"""
    try:
        qr_string = payload.get("qr_string")
        provided_md5 = payload.get("md5_hash")
        
        if not qr_string:
            return {"success": False, "message": "QR string required"}
        
        # Generate MD5 hash of QR string (or use provided hash)
        bakong_md5 = provided_md5 or hashlib.md5(qr_string.encode()).hexdigest()
        
        print(f" Checking payment with Bakong: md5={bakong_md5}")
        print(f" Using token: {BAKONG_TOKEN[:20]}...{BAKONG_TOKEN[-10:]}")
        
        ## Call Bakong API to check payment status
        response = requests.post(
            f"{BAKONG_API_BASE}{BAKONG_CHECK_PATH}",
            json={"md5": bakong_md5},
            headers={
                "Authorization": f"Bearer {BAKONG_TOKEN}",
                "Content-Type": "application/json"
            },
            timeout=10
        )

        print(f" Bakong Response Status: {response.status_code}")
        print(f" Bakong Response Body: {response.text}")

        # Try to parse JSON safely
        try:
            response_data = response.json()
        except Exception:
            response_data = {"raw": response.text}

        print(f" Parsed Response: {response_data}")

        # Normalize response shape for Node consumer
        normalized = {
            "responseCode": None,
            "responseMessage": None,
            "data": None
        }

        if isinstance(response_data, dict):
            # common field names
            normalized["responseCode"] = response_data.get("responseCode") if response_data.get("responseCode") is not None else response_data.get("code")
            normalized["responseMessage"] = response_data.get("responseMessage") or response_data.get("message") or response_data.get("response_msg")
            normalized["data"] = response_data.get("data") or response_data.get("result") or response_data
        else:
            normalized["responseCode"] = -1
            normalized["responseMessage"] = "Invalid response from Bakong"
            normalized["data"] = {"raw": response.text}

        # If unauthorized, log more details
        if response.status_code == 401:
            print(" UNAUTHORIZED - Token might be invalid or expired")
            print(f"Response Message: {normalized.get('responseMessage')}")

        # Ensure responseCode is numeric or default to -1
        if normalized["responseCode"] is None:
            normalized["responseCode"] = -1

        return normalized
        
    except Exception as e:
        print(f"Payment check error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "responseMessage": str(e),
            "responseCode": -1,
            "error_type": type(e).__name__
        }

