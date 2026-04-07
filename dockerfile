FROM node:25-bookworm-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Build the React frontend
WORKDIR /app/site
RUN npm ci && npm run build

WORKDIR /app
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node","dist/server.js"]
