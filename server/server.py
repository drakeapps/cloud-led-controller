import asyncio
import json
import websockets


from AudioReactiveLEDStrip import visualization
from AudioReactiveLEDStrip import led
from AudioReactiveLEDStrip import microphone

from CloudLights import lights


# TODO remove
# i think we can drop this and just rely on the cloudlights module for giving us color
# but for testing purposes, we're going to use it to convert to hsv
import colorsys

class Server:
    def __init__(self, host="localhost", port=6789, cloud_lights=None, audio_lights=None, mic_kv=None):
        # this will maintain a status of off/on/sound
        # for homebridge, sound and normal light will be separate lights
        # homekit
        self._state = {
            'status': 'off',
            'brightness': 0,
            'color': {
                'rgb': [10,10,10],
                'hsv': [0,0,0]
            }
        }

        self.audio_lights = audio_lights
        self.cloud_lights = cloud_lights
        self.mic_kv = mic_kv

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
    
    # TODO
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
        microphone.start_stream(self.audio_lights.microphone_update, **self.mic_kv)
    
    def stop_mic_streaming(self):
        microphone.stop_stream()

    async def start_sound(self):
        print('starting sound')
        loop = asyncio.get_event_loop()
        tasks = []
        task = loop.run_in_executor(None, self.start_mic_streaming)
        tasks.append(task)
        return await asyncio.gather(*tasks)
    
    async def stop_sound(self):
        print('stopping sound')
        loop = asyncio.get_event_loop()
        tasks = []
        task = loop.run_in_executor(None, self.stop_mic_streaming)
        tasks.append(task)
        return await asyncio.gather(*tasks)


    async def toggle_sound(self, action):
        state = self.state
        if action == "on" or True:
            # await self.start_sound()
            # this needs to just run in the background
            asyncio.create_task(self.start_sound)
            state["status"] = "sound"
        else:
            # this is just setting a variable to false
            await self.stop_sound()
            # asyncio.create_task(self.stop_sound)
            state["status"] = "off"
        await self.set_state(state)
    

    def start_color(self):
        self.cloud_lights.transition(color=self.state['color']['rgb'], length=0.05, interval=0.05)
    
    def stop_color(self):
        self.cloud_lights.off()
    
    def set_cloud_color(self, color):
        print(f"transitioning to {color}")
        self.cloud_lights.transition(color=color, length=0.05, interval=0.05)
    
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
                    # TODO actually do the thing
                    await self.toggle_sound("on")
                elif data["action"] == "on":
                    await self.turn_on()
                elif data["action"] == "off":
                    await self.turn_off()
                elif data["action"] == "color" and "color" in data:
                    print(data["color"])
                    await self.set_color(data["color"])
                else:
                    print(f"unsupported event: {data}")
        finally:
            await self.unregister(websocket)                
