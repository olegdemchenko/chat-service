FROM node:20-alpine as base
EXPOSE ${PORT}

FROM base as dev
WORKDIR /app
RUN corepack enable && corepack prepare yarn@latest
COPY . .
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=cache,target=/root/.yarn \
    yarn install
RUN yarn add global @nestjs/cli
CMD yarn run start:dev