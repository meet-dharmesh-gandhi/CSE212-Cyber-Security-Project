import React, { useEffect, useMemo } from "react";
import * as anyAuth from "any-auth";
import "./App.css";

const frontendUrl = process.env.REACT_APP_ENV === "Production" ? process.env.REACT_APP_CLIENT_URL : process.env.REACT_APP_DEV_CLIENT_URL;
const backendUrl = process.env.REACT_APP_ENV === "Production" ? process.env.REACT_APP_SERVER_URL : process.env.REACT_APP_DEV_SERVER_URL;

export default function App() {
	const configObject = useMemo(() => {
		return {
			serverUrl: backendUrl,
			providers: {
				google: {
					clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
					clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
					redirectUri: frontendUrl,
					scope: "email profile openid",
					serverEndPoint: "auth",
				},
			}
		}
	}, []);

	useEffect(() => {
		console.log(frontendUrl, backendUrl);
		anyAuth.setConfig(configObject, {});
		(async () => {
			const response = await anyAuth.handleOAuthRedirect();
			console.log(response);
		})();
	}, [configObject]);

	return (
		<div className="w100vw h100vh flex justify align" style={{ "--gap": "20px", "--bg": "#8888ff" }}>
			<div className="login-container fx-col flex justify align gap bg padding b-r" style={{ "--gap": "20px", "--bg": "#8888ff", "--padding": "30px", "--b-r": "20px" }}>
				<div className="inputs-container fx-col flex justify align gap" style={{ "--gap": "15px" }}>
					<InputBox num="0" labelText="Username:" />
					<InputBox type="password" num="1" labelText="Password:" />
				</div>
				<button className="login-button flex justify align padding b-r bg font-color" style={{ "--padding": "10px 25px", "--b-r": "10px", "--bg": "#7d7", "--color": "#000" }}>
					Login
				</button>
				<button onClick={() => anyAuth.handleLoginButtonClick("google", document.body)}>Login Using Google!</button>
			</div>
		</div>
	)
}

export function InputBox({ type, num, labelText }) {
	return (
		<div className="input-box flex justify align gap-col" style={{ "--gap": "20px" }}>
			<label htmlFor={"input-box" + (num ?? "0")}>{labelText ?? type ?? "text"}</label>
			<input id={"input-box" + (num ?? "0")} type={type ?? "text"} />
		</div>
	)
}