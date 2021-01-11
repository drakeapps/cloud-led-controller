// controller.js
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://o.xrho.com')

var connected = false

client.on('connect', () => {
  client.subscribe('soundLight/connected');
  client.subscribe('soundLight/getOn');
})

client.on('message', (topic, message) => {
  if(topic === 'soundLight/connected') {
	connected = (message.toString() === 'true');
	console.log('connected');
  } else if (topic === 'soundLight/getOn') {
	let soundLight = (message.toString() === 'true');
	console.log(`lightStatus: ${soundLight}`);
  }
});