FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@7 || true
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["pnpm", "run", "dev"]
