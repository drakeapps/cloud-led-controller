import asyncio
import json
import websockets

class Server:
    def __init__(self, host="localhost", port=6789):
        self.STATE = {
            'status': 'off'
        }

        self.CONNS = set()

        print(f"Starting websocket server on {host}:{port}")

        self.start_server = websockets.serve(self.change_status, host, port)

        asyncio.get_event_loop().run_until_complete(self.start_server)
        asyncio.get_event_loop().run_forever()
    
    # TODO
    def status_json(self):
        return json.dumps(self.STATE)

    def toggle_sound(self, action):
        if action == "on" or True:
            self.STATE["status"] = "sound"
        else:
            self.STATE["status"] = "off"
        
    def turn_off(self):
        self.STATE["status"] = "off"



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
                    self.toggle_sound("on")
                    await self.notify_status()
                elif data["action"] == "off":
                    self.turn_off()
                    await self.notify_status()
                else:
                    print(f"unsupported event: {data}")
        finally:
            await self.unregister(websocket)                
