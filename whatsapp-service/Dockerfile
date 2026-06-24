# WhatsApp microservice — deploy as a separate Railway service with root
# directory "whatsapp-service". Needs a Railway Volume mounted at /app/session
# so the linked WhatsApp session survives restarts/redeploys (otherwise you'd
# have to rescan the QR code from the deploy logs every time). See
# ../deploy/RAILWAY.md.

FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
