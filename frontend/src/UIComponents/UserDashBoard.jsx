import React, { useEffect } from "react";
import "../Styles/UserDashBoard.css";
import Navbar from "./Navbar";
import ResetPasswordProtection from "./ResetPasswordProtection";
import ProtectMyResources from "./ProtectMyResources";
import AttackSomeonesResources from "./AttackSomeonesResources";
import ViewMyPasswords from "./ViewMyPasswords";
import UserProfile from "./UserProfile";

const debug = !(process.env.REACT_APP_ENV === "Production");

export default function UserDashBoard({ mode = 1 }) {
	const pages = [
		<ResetPasswordProtection />,
		<ProtectMyResources />,
		<AttackSomeonesResources />,
		<ViewMyPasswords />,
		<UserProfile />,
	];
	useEffect(() => {
		if (debug) console.log(mode, pages[mode]);
	}, []);
	return (
		<div
			className="user-dashboard w100vw h100vh pr grid grid-row bg"
			style={{ "--bg": "beige", "--g-t-r": "1fr 10fr" }}
		>
			<Navbar mode={mode} />
			{/* <div>Main Content of the page</div> */}
			{pages[mode - 1]}
		</div>
	);
}
