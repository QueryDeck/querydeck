FROM node:14.17.4-alpine AS builder

WORKDIR /app/react

# copy important files used for npm install 
COPY ./package.json /app/react/package.json
COPY ./package-lock.json /app/react/package-lock.json
COPY ./gulpfile.js /app/react/gulpfile.js
 
RUN npm install

# copy the rest of the code
ADD . /app/react

RUN npm run build




FROM node:14.17.4-alpine AS runner

WORKDIR /app/express

ENV NODE_ENV=production

COPY ./express/package.json /app/express/package.json
RUN npm install

ADD ./express /app/express
COPY --from=builder /app/react/build /app/express/build


EXPOSE 5051
CMD ["node", "server.js"]