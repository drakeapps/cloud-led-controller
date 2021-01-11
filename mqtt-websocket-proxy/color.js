// Color MQTT<->Websocket proxy


// CONFIG
// TODO: pass in as command line arguments
const mqqtHost = 'o.xrho.com';
const mqttLightName = 'rgbLight';

const wsURL = 'wss://cloud.xrho.com:443';
// key the light represents. {"$key": { power: true|false } }
const wsKey = 'normalLight';
// {"action": $wsXXXXAction}
// this can and probably should be abstracted more
// the rest of the json payload is still hardcoded and specific
const wsOnAction = 'on';
const wsColorAction = 'color';

console.log('color led proxy starting');

const mqtt = require('mqtt');
const client = mqtt.connect(`mqtt://${mqqtHost}`);
const WebSocket = require('ws');
const ws = new WebSocket(`${wsURL}`);


client.on('connect', () => {
	console.log('mqtt connected');
	client.publish(`${mqttLightName}/connected`, 'true');
	client.subscribe(`${mqttLightName}/setOn`);
	client.subscribe(`${mqttLightName}/setRGB`);
});

client.on('message', (topic, message) => {
	console.log(`${topic.toString()} :: ${message.toString()}`);
	if (topic === `${mqttLightName}/setOn`) {
		console.log(`mqtt setOn: ${message.toString()}`);
		if (message.toString() === 'true') {
			ws.send(JSON.stringify({
				'action': wsOnAction
			}));
		} else {
			ws.send(JSON.stringify({
				'action': 'off'
			}));
		}
	} else if (topic === `${mqttLightName}/setRGB`) {
		console.log(`mqtt setRGB: ${message.toString()}`);
		// color comes down as a comma separated list
		let color = message.toString().split(',');
		if (color.length > 2) {
			console.log(JSON.stringify({
				'action': wsColorAction,
				'color': {
					'rgb': {
						'r': color[0],
						'g': color[1],
						'b': color[2]
					}
				}
			}));
			ws.send(JSON.stringify({
				'action': wsColorAction,
				'color': {
					'rgb': {
						'r': parseInt(color[0]),
						'g': parseInt(color[1]),
						'b': parseInt(color[2])
					}
				}
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
	console.log(`ws power: ${json[wsKey]['power'].toString()}`);
	// publish the light status
	client.publish(`${mqttLightName}/getOn`, json[wsKey]['power'].toString());

	console.log(`ws color: ${json[wsKey]['color']['rgb']}`);
	// publish the color
	client.publish(`${mqttLightName}/getRGB`, json[wsKey]['color']['rgb'].join(','));
};

