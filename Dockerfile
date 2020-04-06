FROM node:12

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

# Bundle app source
COPY . .

EXPOSE 3000
ENV NODE_ENV=prod

CMD ["node", "./bin/www"]