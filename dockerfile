FROM node:25-bookworm-slim as builder
WORKDIR /app

# Install backend dependencies
COPY package*.json ./
RUN npm ci

# Install frontend dependencies
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci && cd ..

# Copy all source files
COPY . .

# Build backend
RUN npm run build

# Build frontend
RUN cd frontend && npm run build && cd ..

# Production stage
FROM node:25-bookworm-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built backend
COPY --from=builder /app/dist ./dist

# Copy built frontend
COPY --from=builder /app/frontend/build ./frontend/build

EXPOSE 3000

# Enable serving frontend from backend
# ENV SERVE_FRONTEND=true

CMD ["node","dist/server.js"] 