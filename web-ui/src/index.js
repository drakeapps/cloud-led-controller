import React, { useState, useEffect, useRef}  from 'react';
import ReactDOM from 'react-dom';

import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link,
	useHistory
} from "react-router-dom";

import { ChromePicker } from 'react-color';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';

import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import RefreshIcon from '@material-ui/icons/Refresh';

import './index.scss';

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
	const hex = x.toString(16)
	return hex.length === 1 ? '0' + hex : hex
}).join('');


const App = props => {
	let [host, port] = useState();
	const history = useHistory();

	host = localStorage.getItem('host');
	port = localStorage.getItem('port');

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
			<Config host={host} port={port} />
		</Route>
		<Route path="/">
			<Home host={host} port={port} />
		</Route>
		</Switch>
	</Router>
	);
}

const Config = props => {
	return (<Box>
		<Grid container spacing={3}>
			<Grid item xs={12}><TextField id="host" label="Host" onChange={(event) => {localStorage.setItem('host', event.target.value)}} defaultValue={props.host} /></Grid>
			<Grid item xs={12}><TextField id="port" label="Port" type="number" onChange={(event) => {localStorage.setItem('port', event.target.value)}} defaultValue={props.port}  /></Grid>
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
		
		try {			
			ws.current = new WebSocket(`ws://${host}:${port}`);
	
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
		console.log(ws);
		setPending(true);
		ws.current.send(JSON.stringify({
			'action': mode
		}));
		// setStatus(mode);
	}

	const changeColor = (color) => {
		setPending(true);
		ws.current.send(JSON.stringify({
			action: 'color',
			color: color
		}));
	}


	return (<Box>
		<ProgressBar pending={pending}></ProgressBar>
		<ConnectionStatus connected={connected} lastmessage={lastmessage}></ConnectionStatus>
		<ModeSelector status={status} changeMode={changeMode}></ModeSelector>
		<ColorSelector status={status} color={color} handleOnChangeComplete={changeColor}></ColorSelector>
	</Box>);
}


const ConnectionStatus = props => {
	console.log(props);
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
				<Button variant={(props.status === 'on') ? 'contained': ''} onClick={() => props.changeMode('on')}>Color</Button>
			</ButtonGroup>
		</Grid>
	</Grid>);
}

const ColorSelector = props => {
	// only enable for on status
	if (props.status !== 'on') {
		return <></>;
	}

	return <ChromePicker color={rgbToHex(...props.color.rgb)} onChangeComplete={props.handleOnChangeComplete} ></ChromePicker>;

}

const ProgressBar = props => {
	return <>{(props.pending) ? <LinearProgress /> : <></>}</>;
}


ReactDOM.render(<App />, document.querySelector('#app'));

