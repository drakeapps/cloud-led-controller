FROM node AS build


# install the required packages
COPY package.json package-lock.json webpack.config.js postcss.config.js .babelrc .browserslistrc /build/
WORKDIR /build/
RUN npm i

# build the app
COPY src/ /build/src
RUN npm run build

COPY nginx.conf /nginx.conf

FROM nginx
COPY --from=build /build/dist /usr/share/nginx/html

COPY --from=build /nginx.conf /etc/nginx/conf.d/default.conf