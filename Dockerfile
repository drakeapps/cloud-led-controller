FROM balenalib/raspberry-pi:buster

# we should probably base this on the balena python image
# i've had issues with it, so we can do it manually
RUN apt-get update && apt-get install -y \
	python3 python3-pip python3-dev build-essential

# copy requirements and install
COPY pyhon/requirements.txt /code/requirements.txt
WORKDIR /code
RUN pip3 install -r requirements.txt

# # copy scripts
# # separate from requirements to not rebuild on code changes
# COPY . /code/


CMD python3 test.py

