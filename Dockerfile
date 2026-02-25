# --- Stage 1: Build ---
FROM node:22-slim AS builder

WORKDIR /app

# Copy root config and package files
COPY package.json package-lock.json tsconfig.json ./
# Copy server and client source code (client needed for Satori SSR)
COPY server/ ./server/
COPY client/ ./client/

# Install all dependencies (including devDeps like tsc)
RUN npm ci

# Build the server (generates /app/dist)
RUN npm run build:server

# --- Stage 2: Runtime ---
FROM node:22-slim

WORKDIR /app

# Copy production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy compiled code from builder stage
COPY --from=builder /app/dist/ ./dist/
# Copy prompts
COPY --from=builder /app/server/agents/prompts/ ./server/agents/prompts/
# Copy Satori SSR Assets (Fonts & Backgrounds)
COPY --from=builder /app/server/assets/ ./server/assets/
COPY --from=builder /app/client/public/cards/ ./client/public/cards/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server/main.js"]
