import asyncio
import json
import websockets

# TODO remove
# i think we can drop this and just rely on the cloudlights module for giving us color
# but for testing purposes, we're going to use it to convert to hsv
import colorsys

class Server:
    def __init__(self, host="localhost", port=6789):
        # this will maintain a status of off/on/sound
        # for homebridge, sound and normal light will be separate lights
        # homekit
        self._state = {
            'status': 'off',
            'brightness': 0,
            'color': {
                'rgb': [0,0,0],
                'hsv': [0,0,0]
            }
        }

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

    async def toggle_sound(self, action):
        state = self.state
        if action == "on" or True:
            state["status"] = "sound"
        else:
            state["status"] = "off"
        await self.set_state(state)
    
    async def turn_on(self):
        state = self.state
        print("on")
        state["status"] = "on"
        print(self.state)
        await self.set_state(state)

    async def turn_off(self):
        state = self.state
        print("off")
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
        
        
        state["color"] = {
            'rgb': rgb,
            'hsv': hsv
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
            # im not sure if we need this
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
