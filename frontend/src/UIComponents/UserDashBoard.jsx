import React, { useEffect, useMemo } from "react";
import "../Styles/UserDashBoard.css";
import Navbar from "./Navbar";
import MyActivity from "./MyActivity";
import ProtectMyResources from "./ProtectMyResources";
import ViewMyPasswords from "./ViewMyPasswords";
import UserProfile from "./UserProfile";

import { debug } from "../constants/Mode";

export default function UserDashBoard({ mode = 1 }) {
	const pages = useMemo(
		() => [
			<MyActivity />,
			<ProtectMyResources />,
			<ViewMyPasswords />,
			<UserProfile />,
		],
		[]
	);
	useEffect(() => {
		if (debug) console.log(mode, pages[mode]);
	}, [mode, pages]);
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
