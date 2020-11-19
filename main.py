
import argparse

from AudioReactiveLEDStrip import visualization
from AudioReactiveLEDStrip import led
from AudioReactiveLEDStrip import microphone


def valid_argument(val):
    if not val:
        return val
    else:
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Audio Reactive LED Tester')
    
    parser.add_argument('--n_pixels', type=valid_argument, dest='n_pixels')

    args = parser.parse_args()

    print(args)

    kv = {}

    for key in vars(args).keys():
        if args[key] != None and args[key] != '':
            kv[key] = args[key]

    print(kv)


    leds = led.LED(
        **kv
    )
    leds.update()
    audio = visualization.AudioLEDVisualization(leds, effect="scroll")
    microphone.start_stream(audio.microphone_update)
