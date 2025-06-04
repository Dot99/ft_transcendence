# Frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build with TypeScript
RUN npm run build

# Just keep the container alive (you won’t expose this directly)
CMD ["tail", "-f", "/dev/null"]
