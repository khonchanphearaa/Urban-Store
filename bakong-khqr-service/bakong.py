import os
from dotenv import load_dotenv
from bakong_khqr import KHQR

load_dotenv()

khqr = KHQR(os.getenv("BAKONG_TOKEN"))

def generate_khqr(amount: int, order_id: str):
    return khqr.create_qr(
        bank_account=os.getenv("BANK_ACCOUNT"),
        merchant_name=os.getenv("MERCHANT_NAME"),
        merchant_city=os.getenv("MERCHANT_CITY"),

        amount=int(amount),           
        currency="KHR",

        store_label="UrbanStore",     # Brand name store
        phone_number="855977071227",  # Your phone number contact with Bakong Account
        terminal_label="T1",          

        bill_number=order_id,
        static=False
    )
