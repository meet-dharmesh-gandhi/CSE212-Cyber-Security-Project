import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import LoginPage from "./UIComponents/LoginPage";
import "./Styles/App.css";
import UserDashBoard from "./UIComponents/UserDashBoard";
import VerifyToken from "./UIComponents/VerifyToken";
import GlobalComponent from "./UIComponents/GlobalComponent";
import MissingRoute from "./UIComponents/MissingRoute";

export default function App() {
	return (
		<Router>
			<GlobalComponent />
			<Routes>
				<Route path="/" element={<LoginPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/signup" element={<LoginPage mode="signup" />} />
				<Route path="/home" element={<UserDashBoard />} />
				<Route
					path="/my-activity"
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
				<Route path="*" element={<MissingRoute />} />
			</Routes>
		</Router>
	);
}
