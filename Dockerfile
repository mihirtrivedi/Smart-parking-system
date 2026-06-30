FROM node:18-alpine

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

# Generate Prisma Client
RUN npx prisma generate

# Build typescript code
RUN npx tsc

# Set port and start command
EXPOSE 3000
CMD ["node", "dist/server.js"]
