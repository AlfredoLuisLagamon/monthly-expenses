FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/index.js /app/constants.js /app/routes.js /app/sheets.js ./
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "index.js"]
