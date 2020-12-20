# Cloud (or any WS2812B) LED Websocket Controller

Raspberry Pi Websocket controller for WS2812b LED strip. Used for a light up cloud build, hence the name, but will work anything using that LED strip

* [cloud-leds](https://github.com/drakeapps/cloud-leds) - for solid color and off modes
* [audio-reactive-led-strip](https://github.com/drakeapps/audio-reactive-led-strip) - for sound mode

Been tested on Model B+ and 4B, but has targets for all and _should_ work on any.

## Installation

### Docker

On a Raspberry Pi with docker and docker-compose installed.

```bash
git clone https://github.com/drakeapps/cloud-led-controller
cd cloud-led-controller
cp .env-sample .env ;# edit as needed
make rpi ;# change based on your version: rpi|rpi2|rpi3|rpi4|rpi4-64
docker-compose up -d server
```

If you're wanting to be able to still play sound from the pi, the docker version will not work. It will take over control of `/dev/snd`

### Not Docker

From a clean Rasberry Pi OS install

```bash
sudo apt-get update && apt-get install -y \
	python3 python3-pip python3-dev python3-setuptools build-essential git python3-pyaudio python3-numpy python3-scipy python3-venv
sudo cp build/asound.conf /etc/asound.conf
sudo sed -i "s|defaults.ctl.card 0|defaults.ctl.card 1|g" /usr/share/alsa/alsa.conf
sudo sed -i "s|defaults.pcm.card 0|defaults.pcm.card 1|g" /usr/share/alsa/alsa.conf
# uncomment next two lines if wanting to use venv 
# python3 -m venv venv
# source venv/bin/activate
sudo pip3 install -r requirements.txt
sudo python3 server.py ;# plus whatever command line options
```

## Configuration

[List of the command line options](https://github.com/drakeapps/cloud-led-controller/blob/master/main.py#L62)

The important one `n_pixels` representing the length of LED strip. Most of these options are passed to the respective [audio](https://github.com/drakeapps/audio-reactive-led-strip) or [solid](https://github.com/drakeapps/cloud-leds) led classes.

If using docker, edit the `.env` file to match these options, but in uppercase as shown  in [`.env-sample`](https://github.com/drakeapps/cloud-led-controller/blob/master/.env-sample)

## SSL

The Websocket server was not written to support SSL. In order to use SSL, we place an nginx reverse proxy in front of it. 

Place your `fullchain.pem` and `privkey.pem` in `/var/opt/ssl` or whatever mount point you put in `docker-compose.yml`

Start the docker container:

```
docker-compose up -d ssl
```

## Web UI

Included is a small react web interface. This doesn't need to be run on the same device as the websocket server.

Visit `ip-address/config` first to setup the websocket server location and port.

### Building/Running

**Docker**

```
docker-compose up -d webui
```

**Building**

```
cd web-ui
npm i
npm run build
```

This builds the html and js files. You'll then need to serve them via your preferred web server.

