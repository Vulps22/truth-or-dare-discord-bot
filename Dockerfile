FROM node:22-alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc-dev \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    ttf-freefont

RUN fc-cache -f

USER node

WORKDIR /usr/src/bot

COPY package.json ./
RUN npm install

COPY . .

HEALTHCHECK --interval=30s CMD netstat -lnt | grep :3000

LABEL name="truth-or-dare-bot"

CMD ["npm", "start"]