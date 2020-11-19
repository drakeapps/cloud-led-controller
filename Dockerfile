FROM balenalib/raspberry-pi:buster

# we should probably base this on the balena python image
# i've had issues with it, so we can do it manually
RUN apt-get update && apt-get install -y \
	python3 python3-pip python3-dev python3-setuptools build-essential git python3-pyaudio python3-numpy python3-scipy


COPY build/asound.conf /etc/asound.conf

RUN sed -i "s|defaults.ctl.card 0|defaults.ctl.card 1|g" /usr/share/alsa/alsa.conf
RUN sed -i "s|defaults.pcm.card 0|defaults.pcm.card 1|g" /usr/share/alsa/alsa.conf

# copy requirements and install
COPY requirements.txt /code/requirements.txt
WORKDIR /code
RUN pip3 install -r requirements.txt

# # copy scripts
# # separate from requirements to not rebuild on code changes
# COPY . /code/


COPY main.py /code/main.py

ENV N_PIXELS=""

CMD python3 main.py --n_pixels "${N_PIXELS}"
