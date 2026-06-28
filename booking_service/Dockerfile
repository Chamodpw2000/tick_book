# FROM node:20-alpine

# WORKDIR /app

# COPY package*.json ./
# # RUN npm install --production
# # NEW
# RUN npm install --omit=dev

# COPY prisma ./prisma/
# RUN npx prisma generate

# COPY . .
# COPY entrypoint.sh ./
# RUN chmod +x entrypoint.sh

# EXPOSE 3003

# CMD ["node", "index.js"]


FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
COPY entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 3003

CMD ["sh", "./entrypoint.sh"]