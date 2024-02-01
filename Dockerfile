FROM node:20

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

# Bundle app source
COPY . .

RUN yarn build

EXPOSE 3000

CMD ["node", "./built/bin/www.js"]