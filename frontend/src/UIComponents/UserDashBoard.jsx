import React from "react";
import "../Styles/UserDashBoard.css";
import Navbar from "./Navbar";

export default function UserDashBoard({ mode = -1 }) {
	return (
		<div
			className="w100vw h100vh pr grid grid-row bg"
			style={{ "--bg": "beige", "--g-t-r": "1fr 10fr" }}
		>
			<Navbar mode={mode === -1 ? 1 : mode} />
			<div>Main Content of the page</div>
		</div>
	);
}
