FROM node

# install the required packages
COPY package.json package-lock.json /build/
WORKDIR /build/
RUN npm i

COPY sound.js color.js /build/

CMD [ node, sound.js ]
