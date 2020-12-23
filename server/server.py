import asyncio
import json
import threading
import websockets
import colorsys

from concurrent.futures import ThreadPoolExecutor


from AudioReactiveLEDStrip import visualization
from AudioReactiveLEDStrip import led
from AudioReactiveLEDStrip import microphone

from CloudLights import lights

class Server:
    def __init__(self, host="localhost", port=6789, cloud_lights=None, audio_lights=None, mic_kv=None):
        # this will maintain a status of off/on/sound
        # for homebridge, sound and normal light will be separate lights
        # homekit
        self._state = {
            'status': 'off',
            'brightness': 100,
            'color': {
                'rgb': [0,0, 0],
                'hsv': [0,0,0]
            }
        }

        self.audio_lights = audio_lights
        self.cloud_lights = cloud_lights
        self.mic_kv = mic_kv

        self.mic = microphone.Microphone()

        # set the max brightness to the self brightness value
        # we probably want to make this an argurement instead
        self.max_brightness = self.cloud_lights.self_brightness

        self.sound_loop = None

        self.sound_task = None

        self.executor = ThreadPoolExecutor()

        self.CONNS = set()

        print(f"Starting websocket server on {host}:{port}")

        self.start_server = websockets.serve(self.change_status, host, port)

        asyncio.get_event_loop().run_until_complete(self.start_server)
        asyncio.get_event_loop().run_forever()
    
    @property
    def state(self):
        print('fetching state')
        return self._state
    
    # i failed at making this a @state.setter
    async def set_state(self, value):
        print("setting state")
        self._state = value
        await self.notify_status()
    
    def status_json(self):
        return json.dumps({
            'normalLight': {
                'power': (self.state['status'] == "on"),
                'brightness': self.state['brightness'],
                'color': self.state['color']
            },
            'soundLight': {
                'power': (self.state['status'] == "sound")
            }
        })
    
    def start_mic_streaming(self):
        self.mic.start_stream(self.audio_lights.microphone_update, **self.mic_kv)
    
    def stop_mic_streaming(self):
        self.mic.stop_stream()

    async def start_sound(self):
        print('starting sound')
        loop = asyncio.get_event_loop()
        loop.run_in_executor(self.executor, self.start_mic_streaming)
        return
    
    async def stop_sound(self):
        print('stopping sound')
        loop = asyncio.get_event_loop()
        loop.run_in_executor(self.executor, self.stop_mic_streaming)
        # wait a little bit to ensure the mic streaming is stopped
        # we probably can monitor it, but i don't have enough time to figure it out
        await asyncio.sleep(0.25)

    async def toggle_sound(self, action):
        state = self.state
        if action == "on" and state["status"] != "sound":
            # await self.start_sound()
            # this needs to just run in the background
            loop = asyncio.get_event_loop()
            loop.create_task(self.start_sound())
            state["status"] = "sound"
        else:
            # this is just setting a variable to false
            await self.stop_sound()
            # asyncio.create_task(self.stop_sound)
            state["status"] = "off"
        await self.set_state(state)
    

    def start_color(self):
        self.cloud_lights.transition(color=self.state['color']['rgb'], length=0.2, interval=0.2)
    
    def stop_color(self):
        self.cloud_lights.off()
    
    def set_cloud_color(self, color):
        print(f"transitioning to {color}")
        self.cloud_lights.transition(color=color, length=0.2, interval=0.2)
    
    async def turn_on(self):
        print("turning on")
        state = self.state
        if state["status"] == "sound":
            print("stopping sound")
            await self.stop_sound()
        loop = asyncio.get_event_loop()
        tasks = []
        task = loop.run_in_executor(None, self.start_color)
        tasks.append(task)
        await asyncio.gather(*tasks)
        state["status"] = "on"
        print(self.state)
        await self.set_state(state)

    async def turn_off(self):
        print("turning off")
        state = self.state
        # if sound is running, we need to stop it
        if state["status"] == "sound":
            await self.stop_sound()
        # we always want to blank out the LEDs
        loop = asyncio.get_event_loop()
        tasks = []
        task = loop.run_in_executor(None, self.stop_color)
        tasks.append(task)
        await asyncio.gather(*tasks)
        state["status"] = "off"
        print(self.state)
        await self.set_state(state)

    async def set_color(self, color):
        state = self.state
        if 'rgb' in color:
            rgb = [color['rgb']['r'], color['rgb']['g'], color['rgb']['b']]
            hsv = colorsys.rgb_to_hsv(*rgb)
        elif 'hsv' in color:
            hsv = color['hsv']
            rgb = colorsys.hsv_to_rgb(*hsv)
        else:
            return
        
        loop = asyncio.get_event_loop()
        tasks = []
        task = loop.run_in_executor(None, self.set_cloud_color, rgb)
        tasks.append(task)
        await asyncio.gather(*tasks)
        
        # state["color"] = {
        #     'rgb': rgb,
        #     'hsv': hsv
        # }
        state["color"] = {
            'rgb': self.cloud_lights.get_rgb(),
            'hsv': self.cloud_lights.get_hsv()
        }

        await self.set_state(state)
    
    def set_light_brightness(self, brightness):
        self.cloud_lights.set_self_brightness(brightness)

        
    async def set_brightness(self, brightness):
        # turn off lights if brightness is 0
        if brightness == 0:
            await self.turn_off()
            state = self.state
            state['brightness'] = 0
            self.set_state(state)
        else:
            if state["status"] == "sound":
                await self.stop_sound()
                await self.turn_on()
            elif state["status"] == "off":
                await self.turn_on()
            
            # convert 75% brightness to a fraction of max brightness
            self_brightness = brightness / 100 * self.max_brightness

            loop = asyncio.get_event_loop()
            tasks = []
            task = loop.run_in_executor(None, self.set_light_brightness, self_brightness)
            tasks.append(task)
            await asyncio.gather(*tasks)
            state = self.state
            state['brightness'] = brightness
            self.set_state(state)
            
            

            

    async def notify_status(self):
        if self.CONNS:
            message = self.status_json()
            await asyncio.wait([conn.send(message) for conn in self.CONNS])

    async def register(self, websocket):
        self.CONNS.add(websocket)
    
    async def unregister(self, websocket):
        self.CONNS.remove(websocket)

    
    async def change_status(self, websocket, path):
        await self.register(websocket)
        try:
            await websocket.send(self.status_json())
            async for message in websocket:
                data = json.loads(message)
                if data["action"] == "sound":
                    await self.toggle_sound("on")
                elif data["action"] == "on":
                    await self.turn_on()
                elif data["action"] == "off":
                    await self.turn_off()
                elif data["action"] == "color" and "color" in data:
                    await self.set_color(data["color"])
                elif data["action"] == "brightness" and "brightness" in data:
                    await self.set_brightness(data["brightness"])
                else:
                    print(f"unsupported event: {data}")
        finally:
            await self.unregister(websocket)                
