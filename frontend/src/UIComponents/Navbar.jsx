import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Text, Menu, Portal, IconButton } from "@chakra-ui/react";
import { HiDotsHorizontal } from "react-icons/hi";
import { FaUserCog } from "react-icons/fa";

const pages = [
	["Reset Password Protection", "/password-protection"],
	["Protect My Resources", "/protect-resources"],
	["Attack Someones Resources", "/attack-resources"],
	["View My Passwords", "/view-passwords"],
];

export default function Navbar({ toSelect = 0 }) {
	const [currentlySelected, setCurrentlySelected] = useState(toSelect);
	const navigate = useNavigate();

	useEffect(() => {
		const reqIndex =
			window.location.pathname.toLowerCase() === "/home"
				? 0
				: pages.findIndex(
						(ele) =>
							ele[1].toLowerCase() === window.location.pathname
				  );
		setCurrentlySelected(reqIndex === -1 ? 4 : reqIndex);
	}, [window.location.href]);

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
				{/* <MoreButton setCurrentlySelected={setCurrentlySelected} /> */}
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
		<li className="hover:bg-blue-500">
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

function MoreButton({ setCurrentlySelected }) {
	const [color, setColor] = useState("brand.111");
	const buttonRef = useRef(null);
	const navigate = useNavigate();

	useEffect(() => {
		const abortController = new AbortController();
		document.addEventListener(
			"mousedown",
			(e) => {
				if (!e.isTrusted) return;
				if (
					buttonRef.current &&
					!buttonRef.current.contains(e.target)
				) {
					setColor((prev) => "brand.111");
				}
			},
			{ signal: abortController.signal }
		);

		return () => {
			abortController.abort();
		};
	}, []);

	return (
		<Menu.Root>
			<Menu.Trigger asChild>
				<IconButton
					bgColor={color}
					borderColor="brand.999"
					variant="outline"
					ref={buttonRef}
					onClick={(e) => {
						if (!e.isTrusted) return;
						setColor((prev) => "brand.222");
					}}
				>
					<HiDotsHorizontal color="white" />
				</IconButton>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content>
						<Menu.Item value="rename">Log Out</Menu.Item>
						<Menu.Item
							value="export"
							onClick={() => {
								setCurrentlySelected(4);
								navigate("/view-profile");
							}}
						>
							My Profile
						</Menu.Item>
						<Menu.Item
							value="delete"
							color="fg.error"
							_hover={{ bg: "bg.error", color: "fg.error" }}
						>
							Delete My Account
						</Menu.Item>
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
}
