# Bakong-khqr-Service

This service is a dedicated Bakong KHQR payment microservice used to generate Dynamic KHQR codes for e-commerce payments in Cambodia.
It is designed to work together with a main backend (e.g. ecommerce-api) and follows NBC Bakong KHQR standards.

## Setup Enviroment 

```bash
BAKONG_TOKEN=eyJhbGey.....xhcNnPLWRtTOrn
MERCHANT_NAME=YOUR_BRAND_STORE
MERCHANT_CITY=ADDRESS_CITY
BANK_ACCOUNT=YOUR_MERCHANT_ID
BANK_PHONE_NUMBER=855123456  #Phone number contact with Bakong account app

NODE_API_BASE_URL=http://localhost:{{PORT}}/api/v1

# {{PORT}} GET PORT Form production-api EXAMPLE: PORT=5052
```

1. Navigate to your project
- Open the Terminal and use the cd (change directory) 

```bash
cd path/to/your/project_folder
```

2. Create the Virtual Environment
- Run the following command. This creates a new subfolder (commonly named .venv or venv) that contains a self-contained Python installation.

```bash
python3 -m venv .venv
```

3. Activate the Environment
- To start using this isolated environment, you must "activate" it so your terminal knows to use the local Python version and not the system-wide one. 

```bash
source .venv/bin/activate
```

4. Run Python bakong-khqr

```bash
uvicorn main:app --host 0.0.0.0 --port 5001
```

*Note when run project again just command ```source .venv/bin/activate``` make sure in ```vue```
and runing port ```uvicorn main:app --host 0.0.0.0 --port 5001``` For this port can choice your own.

