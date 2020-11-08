FROM balenalib/raspberrypi3:buster

# we should probably base this on the balena python image
# i've had issues with it, so we can do it manually
RUN apt-get update && apt-get install -y \
	python3 python3-pip python3-dev python3-setuptools build-essential git portaudio19-dev libatlas-base-dev

# copy requirements and install
COPY requirements.txt /code/requirements.txt
WORKDIR /code
RUN pip3 install -r requirements.txt

# # copy scripts
# # separate from requirements to not rebuild on code changes
# COPY . /code/


CMD python3 test.py

