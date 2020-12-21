

rpi:
	sed -i "s|^FROM .*|FROM balenalib/raspberry-pi:buster|" Dockerfile
	sed -i "s|^    image: ghcr.io/drakeapps/cloud-led-controller/server-rpi.*|    image: ghcr.io/drakeapps/cloud-led-controller/server-rpi|g" docker-compose.yml

rpi2:
	sed -i "s|^FROM .*|FROM balenalib/raspberry-pi2:buster|" Dockerfile
	sed -i "s|^    image: ghcr.io/drakeapps/cloud-led-controller/server-rpi.*|    image: ghcr.io/drakeapps/cloud-led-controller/server-rpi2|g" docker-compose.yml

rpi3:
	sed -i "s|^FROM .*|FROM balenalib/raspberrypi3:buster|" Dockerfile
	sed -i "s|^    image: ghcr.io/drakeapps/cloud-led-controller/server-rpi.*|    image: ghcr.io/drakeapps/cloud-led-controller/server-rpi3|g" docker-compose.yml

# rpi4 is just the rpi3 32 bit
rpi4: rpi3

rpi4-64:
	sed -i "s|^FROM .*|FROM balenalib/raspberrypi4-64:buster|" Dockerfile
	sed -i "s|^    image: ghcr.io/drakeapps/cloud-led-controller/server-rpi.*|    image: ghcr.io/drakeapps/cloud-led-controller/server-rpi4-64|g" docker-compose.yml

