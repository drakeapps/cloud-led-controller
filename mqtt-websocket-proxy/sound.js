// On/Off MQTT<->Websocket proxy

const yargs = require('yargs');
const mqtt = require('mqtt');
const WebSocket = require('ws');

const argv = yargs
	.option('mqttHost', {
		description: 'Hostname of MQTT broker',
		alias: 'mqtt',
		type: 'string'
	})
	.option('wsURL', {
		description: 'URL for WebSocket server. Full URL include wss://',
		alias: 'ws',
		type: 'string'
	})
	.option('mqttLightName', {
		description: 'Name of the light that will precede / commands',
		type: 'string'
	})
	.option('wsKey', {
		description: 'In websocket message, the key the light represents. Ex: {"$key": { power: true|false } }',
		type: 'string'
	})
	.option('wsOnAction', {
		description: 'In websocket message, the key that will be sent as the action. ex: {"action": "$wsOnAction"}',
		type: 'string'
	})
	.help()
	.alias('help', 'h')
	.argv;


// CONFIG
const mqqtHost = (argv.mqttHost) ? argv.mqttHost : 'o.xrho.com';
const mqttLightName = (argv.mqttLightName) ? argv.mqttLightName : 'soundLight';

const wsURL = (argv.wsURL) ? argv.wsURL : 'wss://cloud.xrho.com:443';
// key the light represents. {"$key": { power: true|false } }
const wsKey = (argv.wsKey) ? argv.wsKey : 'soundLight';
const wsOnAction = (argv.wsOnAction) ? argv.wsOnAction : 'sound';


const client = mqtt.connect(`mqtt://${mqqtHost}`);
const ws = new WebSocket(`${wsURL}`);

console.log('sound led proxy starting');

client.on('connect', () => {
	console.log('mqtt connected');
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

