
import argparse
import inspect

from AudioReactiveLEDStrip import visualization
from AudioReactiveLEDStrip import led
from AudioReactiveLEDStrip import microphone


def valid_int(val):
    return valid_argument(val, typ=int)

def valid_boolean(val):
    return valid_argument(val, typ=bool)

def valid_float(val):
    return valid_argument(val, typ=float)

def valid_argument(val, typ=None):
    if val:
        if typ:
            try:
                return typ(val)
            except:
                return None
        else:
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
    
    parser.add_argument('--n_pixels', type=valid_int, dest='n_pixels')
    parser.add_argument('--effect', type=valid_argument, dest='effect')
    parser.add_argument('--n_fft_bins', type=valid_int, dest='n_fft_bins')
    parser.add_argument('--fps', type=valid_int, dest='fps')
    parser.add_argument('--min_volume_threshold', type=valid_float, dest='min_volume_threshold')
    parser.add_argument('--display_fps', type=valid_bool, dest='display_fps')
    parser.add_argument('--led_pin', type=valid_int, dest='led_pin')
    parser.add_argument('--led_freq_hz', type=valid_int, dest='led_freq_hz')
    parser.add_argument('--led_dma', type=valid_int, dest='led_dma')
    parser.add_argument('--brightness', type=valid_int, dest='brightness')
    parser.add_argument('--led_invert', type=valid_bool, dest='led_invert')
    parser.add_argument('--software_gamma_correction', type=valid_bool, dest='software_gamma_correction')
    parser.add_argument('--mic_rate', type=valid_int, dest='mic_rate')
    parser.add_argument('--min_frequency', type=valid_int, dest='min_frequency')
    parser.add_argument('--max_frequency', type=valid_int, dest='max_frequency')
    parser.add_argument('--n_rolling_history', type=valid_int, dest='n_rolling_history')


    args = vars(parser.parse_args())

    print(args)

    led_kv = build_arguments(led.LED, args)

    reactive_kv = build_arguments(visualization.AudioLEDVisualization, args)

    mic_kv = build_arguments(microphone.start_stream, args)

    leds = led.LED(**led_kv)
    leds.update()

    audio = visualization.AudioLEDVisualization(leds, **reactive_kv)

    microphone.start_stream(audio.microphone_update, **mic_kv)
