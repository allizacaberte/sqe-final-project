FROM node:24.22.1-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY .next/standalone/ ./
COPY .next/static/ ./.next/static/
COPY public/ ./public/

EXPOSE 3000

USER node

CMD ["node", "server.js"]