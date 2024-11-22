FROM node:14.17.4-alpine AS builder

ADD . /app/react
WORKDIR /app/react
RUN npm install
RUN npm run build

FROM node:14.17.4-alpine AS runner
ENV NODE_ENV=production

ADD ./express /app/express
COPY --from=builder /app/react/build /app/express/build

WORKDIR /app/express
RUN npm install

EXPOSE 5051
CMD ["node", "server.js"]