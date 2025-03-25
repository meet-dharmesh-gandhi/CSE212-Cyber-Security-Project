import React, { useEffect } from "react";
import "../Styles/UserDashBoard.css";
import Navbar from "./Navbar";
import ResetPasswordProtection from "./ResetPasswordProtection";
import ProtectMyResources from "./ProtectMyResources";
import AttackSomeonesResources from "./AttackSomeonesResources";
import ViewMyPasswords from "./ViewMyPasswords";
import UserProfile from "./UserProfile";

export default function UserDashBoard({ mode = 1 }) {
	const pages = [
		<ResetPasswordProtection />,
		<ProtectMyResources />,
		<AttackSomeonesResources />,
		<ViewMyPasswords />,
		<UserProfile />,
	];
	useEffect(() => {
		console.log(mode, pages[mode]);
	}, []);
	return (
		<div
			className="w100vw h100vh pr grid grid-row bg"
			style={{ "--bg": "beige", "--g-t-r": "1fr 10fr" }}
		>
			<Navbar mode={mode} />
			{/* <div>Main Content of the page</div> */}
			{pages[mode - 1]}
		</div>
	);
}
