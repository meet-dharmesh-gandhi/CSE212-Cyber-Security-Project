import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Text, IconButton } from "@chakra-ui/react";
import { FaUserCog } from "react-icons/fa";

const pages = [
	["My Activity", "/my-activity"],
	["Protect My Resources", "/protect-resources"],
	["View My Passwords", "/view-passwords"],
];

export default function Navbar({ toSelect = 0 }) {
	const [currentlySelected, setCurrentlySelected] = useState(toSelect);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const reqIndex =
			window.location.pathname.toLowerCase() === "/home"
				? 0
				: pages.findIndex(
						(ele) =>
							ele[1].toLowerCase() === window.location.pathname
				  );
		setCurrentlySelected(reqIndex === -1 ? 4 : reqIndex);
	}, [location.pathname]);

	return (
		<nav className="navbar w100vw">
			<ul
				className="flex fx-xol w100 justify align padding bg"
				style={{
					"--justify": "space-evenly",
					"--padding": "1rem 0rem",
					"--bg": "#111111",
				}}
			>
				{pages.map((text, index) => (
					<NavBarComponent
						key={index}
						setCurrentlySelected={setCurrentlySelected}
						selected={currentlySelected}
						text={text}
					/>
				))}
				<IconButton
					bgColor={
						currentlySelected === 4
							? "brand.lightBlue"
							: "transparent"
					}
					onClick={() => {
						navigate("/view-profile");
					}}
				>
					<FaUserCog color="white" />
				</IconButton>
			</ul>
		</nav>
	);
}

function NavBarComponent({
	text,
	color = "brand.111",
	selected,
	setCurrentlySelected,
}) {
	const navigate = useNavigate();
	if (
		selected < pages.length &&
		selected >= 0 &&
		pages[selected][0] === text[0]
	) {
		color = "brand.lightBlue";
	}
	return (
		<li>
			<Button
				bg={color}
				asChild
				rounded="xl"
				onClick={(e) => {
					if (!e.isTrusted) return;
					const newIndex = pages.indexOf(text);
					setCurrentlySelected(newIndex);
					navigate(pages[newIndex][1]);
				}}
			>
				<Text color="white">{text[0]}</Text>
			</Button>
		</li>
	);
}
