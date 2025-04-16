import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { createContext, useState } from "react";
import LoginPage from "./UIComponents/LoginPage";
import "./Styles/App.css";
import UserDashBoard from "./UIComponents/UserDashBoard";
import VerifyToken from "./UIComponents/VerifyToken";
import GlobalComponent from "./UIComponents/GlobalComponent";
import MissingRoute from "./UIComponents/MissingRoute";

export const NotificationsContext = createContext();

export default function App() {
	const [notifications, setNotifications] = useState([]);

	function addNotification(status, title) {
		const uid = Date.now();
		setNotifications((prev) => [...prev, { status, title, uid }]);
		setTimeout(() => {
			setNotifications((prev) => {
				return prev.filter((ele) => ele.uid !== uid);
			});
		}, 5000);
	}

	return (
		<NotificationsContext.Provider
			value={{ notifications, addNotification }}
		>
			<Router>
				<GlobalComponent />
				<Routes>
					<Route path="/" element={<LoginPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route
						path="/signup"
						element={<LoginPage mode="signup" />}
					/>
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
						path="/view-passwords"
						element={<UserDashBoard mode={3} />}
					/>
					<Route
						path="/view-profile"
						element={<UserDashBoard mode={4} />}
					/>
					<Route path="/verify-token" element={<VerifyToken />} />
					<Route path="*" element={<MissingRoute />} />
				</Routes>
			</Router>
		</NotificationsContext.Provider>
	);
}
