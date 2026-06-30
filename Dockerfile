FROM node:18-slim

# Install OpenSSL for Prisma compatibility
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /usr/src/app

# Copy package info
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source, prisma schema, and public frontend assets
COPY src ./src
COPY prisma ./prisma
COPY public ./public

# Build project, push DB, and seed
RUN npm run build

# Set port and start command
EXPOSE 3000
CMD ["npm", "start"]
