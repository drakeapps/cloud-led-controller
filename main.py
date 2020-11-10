

from AudioReactiveLEDStrip import visualization
from AudioReactiveLEDStrip import led
from AudioReactiveLEDStrip import microphone


leds = led.LED()
leds.update()
audio = visualization.AudioLEDVisualization(leds, effect="scroll")
microphone.start_stream(audio.microphone_update)
