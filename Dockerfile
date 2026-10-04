FROM node:20-bookworm-slim
WORKDIR /app
COPY backend/express-server.js ./backend/express-server.js
RUN npm init -y   && npm install --omit=dev express@5.1.0 better-sqlite3@11.10.0 bcrypt@5.1.1 jsonwebtoken@9.0.2
ENV PORT=3001
ENV DB_FILE=/data/epicerie.sqlite
EXPOSE 3001
CMD ["node", "backend/express-server.js"]
