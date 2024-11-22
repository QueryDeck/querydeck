FROM node:16.16.0-alpine

ADD . /app/backend
WORKDIR /app/backend
RUN npm install

# ENV PORT=3000
# ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "server.js"]