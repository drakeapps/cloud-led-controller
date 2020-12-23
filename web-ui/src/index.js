import "@babel/polyfill";

import React, { useState, useEffect, useRef}  from 'react';
import ReactDOM from 'react-dom';

import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link,
	useHistory
} from "react-router-dom";

import { CirclePicker } from 'react-color';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Slider from '@material-ui/core/Slider';

import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import RefreshIcon from '@material-ui/icons/Refresh';

import './index.scss';

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
	const hex = x.toString(16)
	return hex.length === 1 ? '0' + hex : hex
}).join('');


const App = props => {
	let [host, setHost] = useState(localStorage.getItem('host'));
	let [port, setPort] = useState(localStorage.getItem('port'));
	let [ssl, setSSL] = useState(localStorage.getItem('ssl') ? true : false);
	
	const history = useHistory();

	let changeSSL = (value) => {
		value = value ? true: false;
		localStorage.setItem('ssl', value);
		setSSL(value);
	};

	let changeHost = (value) => {
		localStorage.setItem('host', value);
		setHost(value);
	};

	let changePort = (value) => {
		localStorage.setItem('port', value);
		setPort(value);
	};

	return (
	<Router>
		<AppBar position="static" className="header">
			<Toolbar>
				<Typography variant="h6" component={Link} to="/" className="title">
					Cloud LED Controller
				</Typography>
				<Button color="inherit" component={Link} to="/config">Config</Button>
			</Toolbar>
		</AppBar>
		<Switch>
		<Route path="/config">
			<Config host={host} port={port} ssl={ssl} changeSSL={changeSSL} changeHost={changeHost} changePort={changePort} />
		</Route>
		<Route path="/">
			<Home host={host} port={port} ssl={ssl} />
		</Route>
		</Switch>
	</Router>
	);
}

const Config = props => {
	return (<Box>
		<Grid container spacing={3} style={{padding: "10px"}}>
			<Grid item xs={12}><TextField id="host" label="Host" type="url" onChange={(event) => {props.changeHost(event.target.value)}} defaultValue={props.host} /></Grid>
			<Grid item xs={12}><TextField id="port" label="Port" type="number" onChange={(event) => {props.changePort(event.target.value)}} defaultValue={props.port}  /></Grid>
			<Grid item xs={12}>
				<FormControlLabel
					control={<Checkbox checked={props.ssl} onChange={(event) => {props.changeSSL(event.target.checked)}} name="ssl" />}
					label="SSL"
				/>
			</Grid>
			<Grid item xs={12}><Button component={Link} to="/">Save</Button></Grid>
		</Grid>
	</Box>);
}

const Home = props => {

	const [status, setStatus] = useState('off');
	const [connected, setConnected] = useState(false);
	const [lastmessage, setLastMessage] = useState(null);
	const [color, setColor] = useState({rgb:[0,0,0,]});
	const [brightness, setBrightness] = useState(0);
	const [pending, setPending] = useState(false);

	const ws = useRef(null);



	useEffect(() => {
		const host = localStorage.getItem('host');
		const port = localStorage.getItem('port');
		const protocol = (localStorage.getItem('ssl')) ? 'wss' : 'ws';
		
		try {			
			ws.current = new WebSocket(`${protocol}://${host}:${port}`);
	
			ws.current.onopen = () => {
				console.log('webocket connection opened');
				setConnected(true);
			};
		
			ws.current.onerror = (error) => {
				console.error(`websocket error: ${error}`);
			};

			ws.current.onclose = (event) => {
				console.log('websocket connection closed');
				setConnected(false);
			};

			ws.current.onmessage = (event) => {
				setLastMessage(new Date());

				console.log(event);

				setPending(false);

				let json = JSON.parse(event.data);

				if (json.normalLight.power) {
					setStatus('on');
				} else if (json.soundLight.power) {
					setStatus('sound');
				} else {
					setStatus('off');
				}

				if (json.normalLight.color) {
					setColor(json.normalLight.color);
				}

				if (json.normalLight.brightness) {
					setBrightness(json.normalLight.brightness);
				}
			};


		} catch {
			const history = useHistory();
			history.push("/config");
			return (<div>Error creating websocket connection</div>);
		}

		return () => {
			ws.current.close();
		}
	}, []);

	const changeMode = (mode) => {
		setPending(true);
		ws.current.send(JSON.stringify({
			'action': mode
		}));
		// setStatus(mode);
	};

	const changeColor = (color) => {
		setPending(true);
		ws.current.send(JSON.stringify({
			action: 'color',
			color: color
		}));
	};

	const changeBrightness = (event, brightness) => {
		setPending(true);
		ws.current.send(JSON.stringify({
			action: 'brightness',
			brightness: brightness
		}));
	};


	return (<Box>
		<ProgressBar pending={pending}></ProgressBar>
		<ConnectionStatus connected={connected} lastmessage={lastmessage}></ConnectionStatus>
		<ModeSelector status={status} changeMode={changeMode} color={color}></ModeSelector>
		<ColorSelector status={status} color={color} handleOnChangeComplete={changeColor} brightness={brightness} handleBrightnessChange={changeBrightness}></ColorSelector>
	</Box>);
}


const ConnectionStatus = props => {
	return (<Grid container alignItems='flex-end' justify='flex-end' alignContent='flex-end' style={{padding: '5px'}}>
		<Grid item xs={12} style={{textAlign: 'right'}} className="status-line" >
			<Grid container alignItems='flex-end' justify='flex-end' alignContent='flex-end'>
				<Grid item>
					<FiberManualRecordIcon style={{ color: (props.connected) ? 'green': 'red'} } fontSize="small"></FiberManualRecordIcon>
				</Grid>
				<Grid item>
					<Typography variant="caption" component="div">
						{(props.connected) ? 
							<>{(props.lastmessage) ? `Last Message: ${props.lastmessage.toLocaleString()}` : ''}</>
							:
							<>No Connection</>
						}
					</Typography>
				</Grid>
				{(props.connected) ? 
					<></>
					: 
					<Grid item>
						<RefreshIcon style={{color: 'blue', cursor: 'pointer'}} fontSize="small" onClick={() => { location.reload() }}></RefreshIcon>
					</Grid>
				}
			</Grid>
		</Grid>
	</Grid>)
}

const ModeSelector = props => {
	return (<Grid container justify="center">
		<Grid item>
			<ButtonGroup size="large" color="primary" aria-label="large outlined primary button group">
				<Button variant={(props.status === 'off') ? 'contained': ''} onClick={() => props.changeMode('off')}>Off</Button>
				<Button variant={(props.status === 'sound') ? 'contained': ''} onClick={() => props.changeMode('sound')}>Sound</Button>
				<Button variant={(props.status === 'on') ? 'contained': ''} onClick={() => props.changeMode('on')} style={{backgroundColor: (props.status === "on") ? rgbToHex(...props.color.rgb) : null}}>Color</Button>
			</ButtonGroup>
		</Grid>
	</Grid>);
}

const ColorSelector = props => {
	// only enable for on status
	if (props.status !== 'on') {
		return <></>;
	}

	return (<><Grid container justify="center" style={{paddingTop: '10px'}}>
		<Grid item>
			<CirclePicker color={rgbToHex(...props.color.rgb)} onChangeComplete={props.handleOnChangeComplete}></CirclePicker>
		</Grid>
	</Grid>
	<Grid container justify="center" style={{paddingTop: '10px'}}>
		<Grid item style={{minWidth: '250px'}}>
			<Typography id="discrete-slider" gutterBottom>
				Brightness
			</Typography>
			<Slider
				defaultValue={props.brightness}
				aria-labelledby="discrete-slider"
				valueLabelDisplay="auto"
				value={props.brightness}
				step={5}
				marks
				min={0}
				max={100}
				onChange={props.handleBrightnessChange}
			/>
		</Grid>
	</Grid></>);

}

const ProgressBar = props => {
	return <>{(props.pending) ? <LinearProgress /> : <></>}</>;
}


ReactDOM.render(<App />, document.querySelector('#app'));

