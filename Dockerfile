# RequestWeaver (Node 20, Alpine)
FROM node:20-alpine

#USER root
RUN apk add --no-cache curl ca-certificates && update-ca-certificates
#USER node

WORKDIR /app
ENV NODE_ENV=production

# Install deps first for better cache hits
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Extensions are provided by consumers via a read-only mount
ENV EXTENSIONS_DIR=/workspace/extensions

EXPOSE 8000
CMD ["node", "src/server.js"]
