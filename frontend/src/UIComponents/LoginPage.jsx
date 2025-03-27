import React, { useEffect, useMemo, useRef } from "react";
import * as anyAuth from "any-auth";
import { useNavigate } from "react-router-dom";
import { loginOrSignUp, loginOrSignUpUsingEmail } from "../Functions/loginFunctions";
import Google from "../Images/google.png";
import Background from "../Images/background.jpg";

const frontendUrl =
  process.env.REACT_APP_ENV === "Production"
    ? process.env.REACT_APP_CLIENT_URL
    : process.env.REACT_APP_DEV_CLIENT_URL;
const backendUrl =
  process.env.REACT_APP_ENV === "Production"
    ? process.env.REACT_APP_SERVER_URL
    : process.env.REACT_APP_DEV_SERVER_URL;
const debug = !(process.env.REACT_APP_ENV === "Production");

export default function LoginPage({ mode = "login" }) {
  const configObject = useMemo(() => ({
    serverUrl: backendUrl + (backendUrl.endsWith("/") ? "" : "/"),
    providers: {
      google: {
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
        redirectUri: `${frontendUrl}${frontendUrl.endsWith("/") ? "" : "/"}${mode}/`,
        scope: "email profile openid",
        serverEndPoint: "auth",
      },
    },
  }), []);

  const username = useRef("");
  const password = useRef("");
  const email = useRef("");
  const navigate = useNavigate();

  useEffect(() => {
    anyAuth.setConfig(configObject, {});
    (async () => {
      const response = await anyAuth.handleOAuthRedirect();
      if (debug) console.log(response);
      if (response?.data?.response?.data?.data) {
        const details = response.data.response.data.data;
        const [result, status] = await loginOrSignUpUsingEmail(details.email, backendUrl, mode);
        if (status !== 200) navigate("/signup");
        else navigate("/home");
      }
    })();
  }, [configObject]);

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-black relative overflow-hidden">
		<img src={Background} alt="Background Image" className="absolute top-0 right-0 z-0 opacity-50"/>
		{/* <h1 className="heading text-white text-2xl mb-10 z-10">Cyber Security Project</h1> */}
		<div className="inner-box w-1/4 rounded-lg shadow-md bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 p-3 z-10 animate-gradient">
			<div className="box h-full w-full px-5 pt-4 pb-8 bg-white rounded-lg">
				<h2 className="text-2xl font-bold text-center text-black">{mode === "login" ? "Login" : "Sign Up"}</h2>
				<div className="space-y-4">
					<InputBox labelText="Username:" componentRef={username} placeholder="John Doe"/>
					<InputBox type="password" labelText="Password:" componentRef={password} placeholder="******"/>
					{mode !== "login" && <InputBox labelText="Email:" componentRef={email} />}
				</div>

				<div className="login w-full flex justify-center">
					<button
						className="w-2/4 mt-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
						onClick={(e) => {
							if (debug) console.log("in!");
							(async (e) => {
							if (!e.isTrusted) return alert("Script Attack!");

							const credentials = [username.current.value, password.current.value];
							if (mode !== "login") credentials.push(email.current.value);

							const result = await loginOrSignUp(credentials, backendUrl, mode);
							if (result.status === "error" && mode === "login") navigate("/signup");
							else if (result.status !== "error") navigate("/home");
							else alert("Invalid Username or Password");
							})(e);
						}}
					>
						{mode === "login" ? "Login" : "Sign Up"}
					</button>
				</div>

				<div className="text-center my-4 text-gray-500 flex justify-center items-center gap-3">
					<div className="line h-[1px] w-1/3 bg-gray-500"></div>
					<p>OR</p>
					<div className="line h-[1px] w-1/3 bg-gray-500"></div>
				</div>

				<div className="google-login flex justify-center">
					<button
					className="w-3/4 py-2 bg-blue-500 text-white rounded-md flex justify-center items-center gap-3 hover:bg-blue-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
					onClick={(e) => {
						if (!e.isTrusted) return alert("Script Attack!");
						anyAuth.handleLoginButtonClick("google", document.body);
					}}
					>
						<img src={Google} alt="Google Logo" className="h-8 bg-white p-1 rounded-full"/>
						{mode === "login" ? "Login" : "Sign Up"} Using Google
					</button>
				</div>
			</div>
		</div>
		<footer className="absolute bottom-5">
			<h1 className="footer text-gray-300">Created by Meet Gandhi, Kaushik Chavda, Devansh Gupta and Nisarg Sahayata</h1>
		</footer>
    </div>
  );
}

export function InputBox({ type, labelText, componentRef, placeholder }) {
  return (
    <div>
      <label className="block mb-2 font-medium text-black">{labelText}</label>
      <input
        type={type || "text"}
        ref={componentRef}
        className="w-full px-4 py-3 border border-gray-300 rounded-md"
		placeholder={placeholder}
      />
    </div>
  );
}