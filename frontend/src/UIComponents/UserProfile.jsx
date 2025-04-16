import React, { useState } from "react";
import UserProfileSidebar from "./UserProfileSidebar";
import UserProfileSelectedDisplay from "./UserProfileSelectedDisplay";

export default function UserProfile() {
	const [selected, setSelected] = useState(0);

	return (
		<div
			className="margin bg b-r padding flex gap"
			style={{
				"--margin": "50px 50px",
				"--bg": "black",
				"--b-r": "30px",
				"--padding": "20px",
				"--gap": "1em",
			}}
		>
			<div
				className="w bg b-r padding"
				style={{
					"--w": "40%",
					"--bg": "#2c2c2c",
					"--b-r": "10px",
					"--padding": "10px",
				}}
			>
				<UserProfileSidebar
					setSelected={setSelected}
					selected={selected}
				/>
			</div>
			<div
				className="bg b-r padding w"
				style={{
					"--bg": "#1a1a1a",
					"--b-r": "10px",
					"--padding": "10px",
					"--w": "100%",
				}}
			>
				<UserProfileSelectedDisplay selected={selected} />
			</div>
		</div>
	);
}
