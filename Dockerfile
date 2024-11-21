FROM node:20-alpine as base
WORKDIR /app
ENV SKIP_YARN_COREPACK_CHECK 0
EXPOSE ${PORT}

FROM base as dev
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=cache,target=/root/.yarn \
    yarn
USER node
COPY . .
CMD yarn run start:dev