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

COPY server /code/server

COPY main.py /code/main.py

ENV N_PIXELS=""

ENV EFFECT=""
ENV N_FFT_BINS=""
ENV FPS=""
ENV MIN_VOLUME_THRESHOLD=""
ENV DISPLAY_FPS=""
ENV LED_PIN=""
ENV LED_FREQ_HZ=""
ENV LED_DMA=""
ENV BRIGHTNESS=""
ENV SELF_BRIGHTNESS=""
ENV LED_INVERT=""
ENV SOFTWARE_GAMMA_CORRECTION=""
ENV MIC_RATE=""
ENV MIN_FREQUENCY=""
ENV MAX_FREQUENCY=""
ENV N_ROLLING_HISTORY=""

ENV SERVER_HOST=""
ENV SERVER_PORT=""


CMD python3 main.py \
	--n_pixels "${N_PIXELS}" \
	--effect "${EFFECT}" \
	--n_fft_bins "${N_FFT_BINS}" \
	--fps "${FPS}" \
	--min_volume_threshold "${MIN_VOLUME_THRESHOLD}" \
	--display_fps "${DISPLAY_FPS}" \
	--led_pin "${LED_PIN}" \
	--led_freq_hz "${LED_FREQ_HZ}" \
	--led_dma "${LED_DMA}" \
	--brightness "${BRIGHTNESS}" \
	--self_brightness "${SELF_BRIGHTNESS}" \
	--led_invert "${LED_INVERT}" \
	--software_gamma_correction "${SOFTWARE_GAMMA_CORRECTION}" \
	--mic_rate "${MIC_RATE}" \
	--min_frequency "${MIN_FREQUENCY}" \
	--max_frequency "${MAX_FREQUENCY}" \
	--n_rolling_history "${N_ROLLING_HISTORY}" \
	--host "${SERVER_HOST}" \
	--port "${SERVER_PORT}"

