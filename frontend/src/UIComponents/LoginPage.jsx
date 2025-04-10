import React, { useEffect, useMemo, useRef } from "react";
import * as anyAuth from "any-auth";
import { useNavigate } from "react-router-dom";
import {
	loginOrSignUp,
	loginOrSignUpUsingEmail,
} from "../Functions/loginFunctions";
import "../Styles/LoginPage.css";

const frontendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_CLIENT_URL
		: process.env.REACT_APP_DEV_CLIENT_URL;
const backendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_SERVER_URL
		: process.env.REACT_APP_DEV_SERVER_URL;
const debug = !(process.env.REACT_APP_ENV === "Production");
// const debug = false;

export default function LoginPage({ mode = "login" }) {
	const configObject = useMemo(() => {
		return {
			serverUrl: backendUrl + (backendUrl.endsWith("/") ? "" : "/"),
			providers: {
				google: {
					clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
					clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
					redirectUri:
						frontendUrl +
						(frontendUrl.endsWith("/") ? "" : "/") +
						mode +
						"/",
					scope: "email profile openid",
					serverEndPoint: "auth",
				},
			},
		};
	}, [mode]);

	const username = useRef("");
	const password = useRef("");
	const email = useRef("");
	const navigate = useNavigate();

	useEffect(() => {
		anyAuth.setConfig(configObject, {});
		(async () => {
			const response = await anyAuth.handleOAuthRedirect();
			if (debug) console.log(response);
			if (!response?.data?.response?.data?.data) {
				if (debug) console.log("incorrect response");
			} else {
				const details = response.data.response.data.data;
				if (debug) console.log(details);
				const [result, status] = await loginOrSignUpUsingEmail(
					details.email,
					backendUrl,
					mode
				);
				if (debug)
					console.log("result after email auth:", result, status);
				if (status !== 200) navigate("/signup");
				else navigate("/home");
			}
		})();
	}, [configObject, mode, navigate]);

	return (
		<div
			className="w100vw h100vh flex justify align login-page-bg"
			style={{ "--gap": "20px", "--bg": "#ffffff" }}
		>
			<div
				className="login-container fx-col flex justify align gap bg padding b-r br pa w h margin"
				style={{
					"--gap": "40px",
					"--bg": "#ffffff70",
					"--padding": "30px",
					"--b-r": "20px",
					"--br-c": "#dddddd",
					"--br-w": "2px",
					"--pa-l": "50vw",
					"--w": "40vw",
					"--h": "auto",
					"--margin": "2rem 2rem 2rem 0rem",
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
					{mode === "login" ? (
						<></>
					) : (
						<InputBox
							num="2"
							labelText="Email:"
							componentRef={email}
						/>
					)}
				</div>
				{debug ? (
					<div>
						<button
							onClick={() => {
								if (debug)
									fetch(
										backendUrl +
											(backendUrl.endsWith("/")
												? ""
												: "/") +
											"view-cookies",
										{
											method: "GET",
											credentials: "include",
										}
									).then(() =>
										console.log(
											"Check for cookies printed in your console"
										)
									);
							}}
						>
							Check Cookies
						</button>
						<button
							onClick={() => {
								if (debug)
									fetch(
										backendUrl +
											(backendUrl.endsWith("/")
												? ""
												: "/") +
											"set-cookies",
										{
											method: "POST",
											headers: {
												"Content-Type":
													"application/json",
											},
											credentials: "include",
											body: JSON.stringify({
												value: "cookie-value-2",
											}),
										}
									).then(() =>
										console.log(
											"Check for cookies printed in your console"
										)
									);
							}}
						>
							Set Cookies
						</button>
					</div>
				) : (
					<></>
				)}
				<button
					className="login-button flex justify align padding b-r bg font-color"
					style={{
						"--padding": "10px 25px",
						"--b-r": "10px",
						"--bg": "#7d7",
						"--color": "#000",
					}}
					onClick={(e) => {
						if (debug) console.log("in!");
						(async (e) => {
							if (debug) console.log("in2!");

							if (!e.isTrusted) {
								alert("Script Attack!");
								return;
							}

							if (debug) console.log("in3!");

							const credentials = [
								username.current.value,
								password.current.value,
								...(mode === "login"
									? []
									: [email.current.value]),
							];
							if (debug)
								console.log(process.env.REACT_APP_PUBLIC_KEY);
							if (debug) console.log("in4!");
							const result = await loginOrSignUp(
								credentials,
								backendUrl,
								mode
							);
							if (debug) console.log("result: ");
							if (debug) console.table(result);
							if (result.status === "error" && mode === "login") {
								navigate("/signup");
							} else if (result.status !== "error") {
								navigate("/home");
							} else {
								alert("Invalid Username or Password");
							}
						})(e);
					}}
				>
					{mode === "login" ? "Login" : "Sign Up"}
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
					{mode === "login" ? "Login" : "Sign Up"} Using Google!
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
				className="bg padding font-color"
				style={{
					"--bg": "#ffffff",
					"--padding": "3px 5px",
					"--color": "#000000",
				}}
			/>
		</div>
	);
}
