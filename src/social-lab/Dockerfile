FROM node:22-bookworm-slim AS client
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npm run build && npm run build:engine

FROM python:3.12-slim-bookworm
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 && rm -rf /var/lib/apt/lists/*
COPY --from=client /usr/local/bin/node /usr/local/bin/node
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY src/server ./src/server
COPY --from=client /app/dist ./dist
COPY --from=client /app/build ./build
RUN mkdir -p /app/data && useradd -r -u 10001 researcher && chown -R researcher /app
USER researcher
EXPOSE 8000
CMD ["uvicorn", "src.server.main:app", "--host", "0.0.0.0", "--port", "8000"]
