FROM node:16-alpine 

USER node 

WORKDIR /usr/src/bot

COPY package.json .
RUN npm install

COPY . .

HEALTHCHECK --interval=30s CMD netstat -lnt | grep :3000

LABEL name="discord-bot"

CMD ["node", "index.js"]