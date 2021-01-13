FROM node:12-alpine

RUN apk add --no-cache git musl-dev go imagemagick

ENV GOPATH /go
RUN go get -u github.com/fogleman/primitive

RUN addgroup sqip-server && adduser -D -G sqip-server sqip-server

WORKDIR /sqip-server

RUN mkdir uploads && chown sqip-server:sqip-server uploads

COPY package*.json ./
RUN npm ci

COPY server.js .

USER sqip-server

EXPOSE 3000
CMD node server
