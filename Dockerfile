FROM node:20-slim

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------- NODE ----------
COPY production-api/package*.json ./production-api/
RUN cd production-api && npm install --production

# ---------- PYTHON ----------
COPY bakong_khqr_service/requirements.txt ./bakong_khqr_service/
RUN pip3 install --no-cache-dir --break-system-packages \
  -r bakong_khqr_service/requirements.txt

# ---------- SOURCE ----------
COPY production-api ./production-api
COPY bakong_khqr_service ./bakong_khqr_service

EXPOSE 3000

CMD sh -c "\
  uvicorn bakong_khqr_service.main:app --host 0.0.0.0 --port 8000 & \
  node production-api/server.js \
"
