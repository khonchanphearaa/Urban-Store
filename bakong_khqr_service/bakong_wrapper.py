import os
import requests
from bakong_khqr import KHQR
from dotenv import load_dotenv

load_dotenv()

class ProxyKHQR(KHQR):
    def __init__(self, token, proxy_url, secret):
        super().__init__(token)
        # Remove trailing slash to prevent URL errors
        self.proxy_url = proxy_url.rstrip('/')
        self.secret = secret

    def _KHQR__post_request(self, endpoint, payload):
        # Construct the URL: https://your-worker.dev/bakong/v1/check_...
        url = f"{self.proxy_url}{endpoint}"
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Proxy-Auth": self.secret,
            "Content-Type": "application/json"
        }
        
        print(f"📡 Routing via Proxy: {url}")
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        return response.json()

# Create a single instance to be used by all routes
khqr_instance = ProxyKHQR(
    token=os.getenv("BAKONG_TOKEN"),
    proxy_url=os.getenv("HONO_PROXY_URL"),
    secret=os.getenv("PROXY_SECRET")
)