// On/Off MQTT<->Websocket proxy


// CONFIG
const mqqtHost = 'o.xrho.com';
const mqttLightName = 'soundLight';

const wsProtocol = 'wss';
const wsHost = 'cloud.xrho.com';
const wsPort = '443';
// key the light represents. {"$key": { power: true|false } }
const wsKey = 'soundLight';
const wsOnAction = 'sound';



const mqtt = require('mqtt');
const client = mqtt.connect(`mqtt://${mqqtHost}`);
const WebSocket = require('ws');
const ws = new WebSocket(`${wsProtocol}://${wsHost}:${wsPort}`);


client.on('connect', () => {
	// Inform controllers that garage is connected
	client.publish(`${mqttLightName}/connected`, 'true');
	client.subscribe(`${mqttLightName}/setOn`);
});

client.on('message', (topic, message) => {
	if (topic === `${wsKey}/setOn`) {
		console.log(`mqtt: ${message.toString()}`);
		if (message.toString() === 'true') {
			ws.send(JSON.stringify({
				'action': wsOnAction
			}));
		} else {
			ws.send(JSON.stringify({
				'action': 'off'
			}));
		}
	}
  });


ws.onopen = () => {
	console.log('webocket connection opened');
};

ws.onerror = (error) => {
	console.error(`websocket error: ${error}`);
};

ws.onclose = (event) => {
	console.log('websocket connection closed');
	process.exit();
};

ws.onmessage = (event) => {
	let json = JSON.parse(event.data);
	console.log(`ws: ${json[wsKey]['power'].toString()}`);
	// publish the light status
	client.publish(`${mqttLightName}/getOn`, json[wsKey]['power'].toString());
};

