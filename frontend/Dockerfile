FROM node:14.17.4-alpine AS builder

ADD . /app/react
WORKDIR /app/react

ARG GENERATE_SOURCEMAP="${GENERATE_SOURCEMAP}"
ARG REACT_APP_MUI_KEY="${REACT_APP_MUI_KEY}"
ARG REACT_APP_OPENREPLAY_KEY="${REACT_APP_OPENREPLAY_KEY}"
ARG REACT_APP_PUBLIC_POSTHOG_HOST="${REACT_APP_PUBLIC_POSTHOG_HOST}"
ARG REACT_APP_PUBLIC_POSTHOG_KEY="${REACT_APP_PUBLIC_POSTHOG_KEY}"

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