FROM node:current-alpine3.14

# Create storage-discord-bot directory
WORKDIR /usr/src/storage-discord-bot

# Move source files to docker image
COPY . .

# Install dependencies
RUN yarn && yarn build

# Run
ENTRYPOINT yarn start