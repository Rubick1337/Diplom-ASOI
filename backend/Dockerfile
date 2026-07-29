FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Docker CLI нужен для запуска пользовательского кода в изолированных контейнерах
RUN apk add --no-cache curl docker-cli \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p public/achievements \
    && chown -R appuser:appgroup /app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

USER appuser

CMD ["npm", "run", "start"]
