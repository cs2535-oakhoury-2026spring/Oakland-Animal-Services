FROM node:25-bookworm-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN  npm prune --omit=dev

EXPOSE 3000

CMD ["node","dist/server.js"] 