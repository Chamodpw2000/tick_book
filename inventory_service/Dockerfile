# FROM node:20-alpine

# WORKDIR /app

# COPY package*.json ./
# COPY prisma ./prisma/
# RUN npm ci
# RUN npx prisma generate

# COPY . .
# COPY entrypoint.sh ./
# RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# EXPOSE 3007

# CMD ["sh", "./entrypoint.sh"]

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# 👇 add this (important)
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000

RUN npm ci

RUN npx prisma generate

COPY . .
COPY entrypoint.sh ./

RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 3007

CMD ["sh", "./entrypoint.sh"]