import React, { useEffect, useMemo, useRef } from "react";
import * as anyAuth from "any-auth";
import "./App.css";

const frontendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_CLIENT_URL
		: process.env.REACT_APP_DEV_CLIENT_URL;
const backendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_SERVER_URL
		: process.env.REACT_APP_DEV_SERVER_URL;

export default function App() {
	const configObject = useMemo(() => {
		return {
			serverUrl: backendUrl,
			providers: {
				google: {
					clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
					clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
					redirectUri:
						frontendUrl + (frontendUrl.endsWith("/") ? "" : "/"),
					scope: "email profile openid",
					serverEndPoint: "auth",
				},
			},
		};
	}, []);

	const username = useRef("");
	const password = useRef("");

	useEffect(() => {
		anyAuth.setConfig(configObject, {});
		(async () => {
			const response = await anyAuth.handleOAuthRedirect();
			console.log(response);
		})();
	}, [configObject]);

	return (
		<div
			className="w100vw h100vh flex justify align"
			style={{ "--gap": "20px", "--bg": "#ffffff" }}
		>
			<div
				className="login-container fx-col flex justify align gap bg padding b-r br pa w h"
				style={{
					"--gap": "40px",
					"--bg": "#ffffff70",
					"--padding": "30px",
					"--b-r": "20px",
					"--br-c": "#dddddd",
					"--br-w": "2px",
					"--pa-l": "50vw",
					"--w": "40vw",
					"--h": "50vh",
				}}
			>
				<div
					className="inputs-container fx-col flex justify align gap"
					style={{ "--gap": "20px" }}
				>
					<InputBox
						num="0"
						labelText="Username:"
						componentRef={username}
					/>
					<InputBox
						type="password"
						num="1"
						labelText="Password:"
						componentRef={password}
					/>
				</div>
				<button
					className="login-button flex justify align padding b-r bg font-color"
					style={{
						"--padding": "10px 25px",
						"--b-r": "10px",
						"--bg": "#7d7",
						"--color": "#000",
					}}
					onClick={(e) => {
						console.log("in!");
						(async (e) => {
							console.log("in2!");

							if (!e.isTrusted) {
								alert("Script Attack!");
								return;
							}

							console.log("in3!");

							const credentials = [
								username.current.value,
								password.current.value,
								// sha512
								// 	.create()
								// 	.update(password.current.value)
								// 	.hex(),
							];
							console.log(process.env.REACT_APP_PUBLIC_KEY);
							console.log("in4!");
							const base64Key =
								process.env.REACT_APP_PUBLIC_KEY.replace(
									/-----BEGIN PUBLIC KEY-----/,
									""
								)
									.replace(/-----END PUBLIC KEY-----/, "")
									.replace(/\n/g, "");
							console.log(base64Key);
							const publicKeyBinary = Uint8Array.from(
								atob(base64Key),
								(c) => c.charCodeAt(0)
							).buffer;
							console.log("in5!", publicKeyBinary.byteLength);
							const publicKey =
								await window.crypto.subtle.importKey(
									"spki",
									publicKeyBinary,
									{ name: "RSA-OAEP", hash: "SHA-256" },
									false,
									["encrypt"]
								);
							let encryptedData = "";
							console.log("in6!", publicKey);
							console.log(
								new TextEncoder().encode(
									JSON.stringify(credentials)
								).length
							);
							try {
								encryptedData =
									await window.crypto.subtle.encrypt(
										{ name: "RSA-OAEP" },
										publicKey,
										new TextEncoder().encode(
											JSON.stringify(credentials)
										)
									);
								console.log(encryptedData);
							} catch (error) {
								console.error(error);
								return;
							}
							console.log("in7!");
							const base64EncryptedData = btoa(
								String.fromCharCode(
									...new Uint8Array(encryptedData)
								)
							);
							console.log("base64:", base64EncryptedData);
							console.log("in8!");
							const result = await fetch(
								backendUrl +
									(backendUrl.endsWith("/") ? "" : "/") +
									"get-user",
								{
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										data: encodeURIComponent(
											base64EncryptedData
										),
									}),
								}
							)
								.then((data) => {
									if (data.ok) return data;
									else throw Error("Server Error!");
								})
								.then((data) => data.json())
								.catch((err) =>
									console.error(
										"Error while checking user in server: ",
										err
									)
								);
							console.log("result: ", result);
						})(e);
					}}
				>
					Login
				</button>
				<div className="w100 pr">
					<hr
						noShade
						className="w100 br"
						style={{
							"--br-c": "#333333",
							"--br-w": "2px",
						}}
					/>
					<p
						className="pa w h padding b-r tr-x bg font-color"
						style={{
							"--w": "fit-content",
							"--h": "fit-content",
							"--pa-t": "-100%",
							"--pa-l": "50%",
							"--tr-x": "-50%",
							"--bg": "#444",
							"--color": "#fff",
							"--padding": "0px 10px",
						}}
					>
						OR
					</p>
				</div>
				<button
					className="flex padding b-r bg"
					style={{
						"--padding": "10px 20px",
						"--b-r": "10px",
						"--bg": "#4c7dff",
					}}
					onClick={(e) => {
						if (!e.isTrusted) {
							alert("Script Attack!");
							return;
						}
						anyAuth.handleLoginButtonClick("google", document.body);
					}}
				>
					Login Using Google!
				</button>
			</div>
		</div>
	);
}

export function InputBox({ type, num, labelText, componentRef }) {
	return (
		<div
			className="input-box flex justify align gap-col fs bg padding b-r"
			style={{
				"--gap": "100px",
				"--fs": "larger",
				"--bg": "#ddddddd",
				"--padding": "20px 40px",
				"--b-r": "10px",
			}}
		>
			<label htmlFor={"input-box" + (num ?? "0")}>
				{labelText ?? type ?? "text"}
			</label>
			<input
				id={"input-box" + (num ?? "0")}
				type={type ?? "text"}
				ref={componentRef}
			/>
		</div>
	);
}
