FROM node:22-bookworm

WORKDIR /app
ENV NODE_ENV=development

# -------------------------------
# Copy everything (source + scripts)
# -------------------------------
COPY package*.json ./
COPY packages ./packages
COPY dc-dashboard ./dc-dashboard
COPY data-experience ./data-experience

# -------------------------------
# Install dependencies
# -------------------------------
WORKDIR /app/packages
RUN npm ci

WORKDIR /app/dc-dashboard
RUN npm ci

WORKDIR /app/data-experience
RUN npm ci

# -------------------------------
# Build shared packages
# -------------------------------
WORKDIR /app/packages
RUN npm run build && npm run prepare

WORKDIR /app/dc-dashboard
RUN npm run build

WORKDIR /app/data-experience

EXPOSE 8080
CMD ["npm", "run", "dev:app"]
