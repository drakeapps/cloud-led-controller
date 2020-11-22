
import argparse
import inspect

from AudioReactiveLEDStrip import visualization
from AudioReactiveLEDStrip import led
from AudioReactiveLEDStrip import microphone


def valid_argument(val):
    print(val)
    if val:
        return val
    else:
        return None

# take in the class/function 
def build_arguments(klass, ags):
    kv = {}
    for arg in inspect.getfullargspec(klass).args:
        if arg in ags and ags[arg]:
            kv[arg] = ags[arg]
    return kv

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Audio Reactive LED Tester')
    
    parser.add_argument('--n_pixels', type=valid_argument, dest='n_pixels')
    

    args = parser.parse_args()

    print(args)

    led_kv = build_arguments(led.LED, args)

    reactive_kv = build_arguments(visualization.AudioLEDVisualization, args)

    leds = led.LED(**led_kv)
    leds.update()

    audio = visualization.AudioLEDVisualization(leds, **reactive_kv)

    microphone.start_stream(audio.microphone_update)
