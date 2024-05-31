FROM node:20-alpine as base
WORKDIR /app
EXPOSE ${PORT}

FROM base as dev
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=cache,target=/root/.yarn \
    corepack enable yarn
USER node
COPY . .
CMD yarn run dev