import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import LoginPage from "./UIComponents/LoginPage";
import "./Styles/App.css";
import UserDashBoard from "./UIComponents/UserDashBoard";

export default function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<LoginPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/signup" element={<LoginPage mode="signup" />} />
				<Route
					path="/home"
					element={<UserDashBoard mode={-1}></UserDashBoard>}
				/>
				<Route
					path="/password-protection"
					element={<UserDashBoard mode={1}></UserDashBoard>}
				/>
				<Route
					path="/protect-resources"
					element={<UserDashBoard mode={2}></UserDashBoard>}
				/>
				<Route
					path="/attack-resources"
					element={<UserDashBoard mode={3}></UserDashBoard>}
				/>
				<Route
					path="/view-passwords"
					element={<UserDashBoard mode={4}></UserDashBoard>}
				/>
			</Routes>
		</Router>
	);
}
