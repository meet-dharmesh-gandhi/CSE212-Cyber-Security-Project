import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useEffect } from "react";
import LoginPage from "./UIComponents/LoginPage";
import "./Styles/App.css";
import UserDashBoard from "./UIComponents/UserDashBoard";
import VerifyToken from "./UIComponents/VerifyToken";

const frontendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_CLIENT_URL
		: process.env.REACT_APP_DEV_CLIENT_URL;
const backendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_SERVER_URL
		: process.env.REACT_APP_DEV_SERVER_URL;
const debug = !(process.env.REACT_APP_ENV === "Production");
const routesToIgnore = ["/login", "/signup", "/verify-token"];

export default function App() {
	useEffect(() => {
		(async () => {
			if (debug) console.log(window.location.pathname);
			if (
				routesToIgnore.includes(
					window.location.pathname.replace(/\/$/g, "")
				)
			)
				return;
			const validUser = await fetch(
				backendUrl +
					(backendUrl.endsWith("/") ? "" : "/") +
					"check-valid-user",
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				}
			)
				.then((data) => {
					if (data.status !== 200) {
						throw new Error("User is not authenticated!");
					}
				})
				.catch((err) => {
					window.location.href =
						frontendUrl +
						(frontendUrl.endsWith("/") ? "" : "/") +
						"login";
				});
		})();
	}, [window.location.href]);

	return (
		<Router>
			<Routes>
				<Route path="/" element={<LoginPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/signup" element={<LoginPage mode="signup" />} />
				<Route path="/home" element={<UserDashBoard />} />
				<Route
					path="/password-protection"
					element={<UserDashBoard mode={1} />}
				/>
				<Route
					path="/protect-resources"
					element={<UserDashBoard mode={2} />}
				/>
				<Route
					path="/attack-resources"
					element={<UserDashBoard mode={3} />}
				/>
				<Route
					path="/view-passwords"
					element={<UserDashBoard mode={4} />}
				/>
				<Route
					path="/view-profile"
					element={<UserDashBoard mode={5} />}
				/>
				<Route path="/verify-token" element={<VerifyToken />} />
			</Routes>
		</Router>
	);
}
