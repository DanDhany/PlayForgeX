FROM node:22-alpine

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./

RUN npm install

# Copy source code
COPY src/ ./src/
COPY electron/ ./electron/

# Build client bundle
RUN npm run build

# Create data directory for persistent volume mount
RUN mkdir -p /app/data

EXPOSE 3080

CMD ["npm", "run", "start"]
