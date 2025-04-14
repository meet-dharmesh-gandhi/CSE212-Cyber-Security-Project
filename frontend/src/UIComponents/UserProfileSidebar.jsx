import React, { useEffect, useRef, useState } from "react";
import {
	Text,
	Center,
	HStack,
	VStack,
	Box,
	Separator,
	ButtonGroup,
	IconButton,
	Button,
	Dialog,
	Portal,
	PinInput,
	Spinner,
} from "@chakra-ui/react";
import { RiLockPasswordFill } from "react-icons/ri";
import { MdOutlinePermIdentity, MdEmail, MdDelete } from "react-icons/md";
import { FaPowerOff } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { encryptData } from "../Functions/cryptoFunctions";
import { backendUrl } from "../constants/Urls";
import { debug } from "../constants/Mode";

export default function UserProfileSidebar({ setSelected = () => {} }) {
	const [showLogoutScreen, setShowLogoutScreen] = useState(false);
	const [showDeletionScreen, setShowDeletionScreen] = useState(false);
	const [userName, setUserName] = useState("User");

	useEffect(() => {
		(async () => {
			const [fetched, data] = await fetch(
				backendUrl + "/get-cookie-data",
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				}
			)
				.then(async (data) =>
					data.status === 200
						? [true, await data.json()]
						: [false, null]
				)
				.catch((error) => console.error(error));
			if (debug) console.log("data:", data);
			const username = data.username;
			if (debug) console.log("fetched:", fetched);
			if (debug) console.log("username:", username);
			if (!fetched) return;
			if (username) setUserName(username);
		})();
	}, []);

	return (
		<VStack>
			<Center className="padding" style={{ "--padding": "2rem 0px" }}>
				<HStack>
					<Text fontSize="3xl">Hello </Text>
					<Text
						fontSize="3xl"
						fontWeight="semibold"
						color="green.400"
					>
						{userName}
					</Text>
					<Text fontSize="3xl">!</Text>
				</HStack>
			</Center>
			<Separator
				variant="solid"
				borderColor="white"
				width="90%"
				orientation="horizontal"
				size="lg"
			/>
			<Box className="padding" style={{ "--padding": "2rem 0px" }}>
				<VStack gap="1rem">
					<ButtonGroup
						attached
						className="w flex"
						style={{ "--w": "100%" }}
					>
						<IconButton
							backgroundColor="blackAlpha.800"
							rounded="full"
							size="lg"
						>
							<MdEmail color="white" />
						</IconButton>
						<Button
							backgroundColor="blackAlpha.800"
							color="white"
							rounded="full"
							size="lg"
							className="flex-grow justify"
							style={{
								"--f-g": "1",
								"--justify": "flex-end",
							}}
							onClick={() => setSelected(0)}
						>
							Change My Email
						</Button>
					</ButtonGroup>
					<ButtonGroup
						attached
						className="w flex"
						style={{ "--w": "100%" }}
					>
						<IconButton
							backgroundColor="blackAlpha.800"
							rounded="full"
							size="lg"
						>
							<RiLockPasswordFill color="white" />
						</IconButton>
						<Button
							backgroundColor="blackAlpha.800"
							color="white"
							rounded="full"
							size="lg"
							className="flex-grow justify"
							style={{
								"--f-g": "1",
								"--justify": "flex-end",
							}}
							onClick={() => setSelected(1)}
						>
							Reset My Password
						</Button>
					</ButtonGroup>
					<ButtonGroup
						attached
						className="w flex"
						style={{ "--w": "100%" }}
					>
						<IconButton
							backgroundColor="blackAlpha.800"
							rounded="full"
							size="lg"
						>
							<MdOutlinePermIdentity color="white" />
						</IconButton>
						<Button
							backgroundColor="blackAlpha.800"
							color="white"
							rounded="full"
							size="lg"
							className="flex-grow justify"
							style={{
								"--f-g": "1",
								"--justify": "flex-end",
							}}
							onClick={() => setSelected(2)}
						>
							Change My Username
						</Button>
					</ButtonGroup>
				</VStack>
			</Box>
			<Separator
				variant="solid"
				borderColor="white"
				width="90%"
				orientation="horizontal"
				size="lg"
			/>
			<Center
				width="100%"
				height="100%"
				className="padding"
				style={{ "--padding": "1rem 0rem" }}
			>
				<VStack width="100%" height="100%">
					<ButtonGroup
						attached
						className="w flex"
						style={{ "--w": "60%" }}
					>
						<IconButton
							backgroundColor="yellow.600"
							rounded="full"
							size="lg"
							variant="outline"
							className="br"
							style={{
								"--br-c": "yellow",
								"--br-w": "4px 0px 4px 4px",
							}}
						>
							<FaPowerOff color="yellow" />
						</IconButton>
						<Button
							backgroundColor="yellow.600"
							color="yellow"
							rounded="full"
							size="lg"
							className="justify flex-grow br"
							style={{
								"--justify": "flex-end",
								"--f-g": "1",
								"--br-c": "yellow",
								"--br-w": "4px 4px 4px 0px",
							}}
							onClick={() => {
								if (debug) console.log("logging out!");
								setShowLogoutScreen(true);
							}}
						>
							LogOut
						</Button>
					</ButtonGroup>
					<ButtonGroup
						attached
						className="w flex"
						style={{ "--w": "60%" }}
					>
						<IconButton
							backgroundColor="red.200"
							rounded="full"
							size="lg"
							variant="outline"
							className="br"
							style={{
								"--br-c": "red",
								"--br-w": "4px 0px 4px 4px",
							}}
						>
							<MdDelete color="red" />
						</IconButton>
						<Button
							backgroundColor="red.200"
							color="red"
							rounded="full"
							size="lg"
							className="justify flex-grow br"
							style={{
								"--justify": "flex-end",
								"--f-g": "1",
								"--br-c": "red",
								"--br-w": "4px 4px 4px 0px",
							}}
							onClick={() => {
								if (debug) console.log("logging out!");
								setShowDeletionScreen(true);
							}}
						>
							Delete
						</Button>
					</ButtonGroup>
				</VStack>
			</Center>
			<LogoutUserDisplay
				showDialog={showLogoutScreen}
				setShowDialog={setShowLogoutScreen}
			/>
			<DeleteUserDisplay
				showDialog={showDeletionScreen}
				setShowDialog={setShowDeletionScreen}
			/>
		</VStack>
	);
}

function DeleteUserDisplay({ showDialog, setShowDialog }) {
	const navigate = useNavigate();
	const [enterOTP, setEnterOTP] = useState(false);
	const [loading, setLoading] = useState(false);
	const [startPolling, setStartPolling] = useState(false);
	const [waitForEmailConfirmation, setWaitForEmailConfirmation] =
		useState(false);

	useEffect(() => {
		if (!startPolling) return;
		let elapsedTime = 0;
		const interval = setInterval(async () => {
			const approved = await fetch(`${backendUrl}/check-token`, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then((data) => {
				if (data.status === 200) return true;
				else return false;
			});

			if (approved) {
				if (debug) console.log("approved!");
				setStartPolling(false);
				const userDeleted = await fetch(backendUrl + "/delete-user", {
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				}).then((data) => (data.status === 200 ? true : false));
				if (userDeleted) navigate("/login");
				else if (debug) console.log("user deletion failed!");
				clearInterval(interval);
			}

			elapsedTime += 1000;
			if (elapsedTime >= 5 * 60 * 1000) {
				setLoading(false);
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	return (
		<Dialog.Root
			motionPreset="slide-in-bottom"
			open={showDialog}
			placement="center"
			closeOnInteractOutside={true}
		>
			<Portal>
				<Dialog.Backdrop>
					<Dialog.Positioner>
						<Dialog.Content
							padding="3rem"
							borderColor="#cccccc"
							borderWidth="2px"
						>
							{waitForEmailConfirmation ? (
								<LoadingDialogBox
									loading
									content={<CustomLoader />}
								/>
							) : enterOTP ? (
								<OTPInputBox
									setOTPReady={enterOTP}
									onOTPCorrect={async () => {
										setEnterOTP(false);
										const alerted = await fetch(
											backendUrl +
												"/send-delete-account-alert",
											{
												method: "GET",
												headers: {
													"Content-Type":
														"application/json",
												},
												credentials: "include",
											}
										);
										if (debug) console.table(alerted);
										setWaitForEmailConfirmation(true);
										setStartPolling(true);
									}}
								/>
							) : (
								<VStack
									rowGap="2rem"
									borderRadius="1.5rem"
									padding="3rem"
								>
									<Text
										color="white"
										fontWeight="bold"
										fontSize="2xl"
										textAlign="center"
										lineHeight="2rem"
									>
										Do you want to delete your current
										account??
									</Text>
									<ButtonGroup orientation="vertical">
										<Button
											bgColor="green.500"
											size="lg"
											loading={loading}
											onClick={async () => {
												setLoading(true);
												const otpCreated = await fetch(
													`${backendUrl}/create-otp`,
													{
														method: "GET",
														credentials: "include",
														headers: {
															"Content-Type":
																"application/json",
														},
													}
												);
												if (otpCreated.status !== 200)
													return console.log(
														"Unknown Error in OTP Creation"
													);
												setLoading(false);
												setEnterOTP(true);
											}}
										>
											Yes, Go Ahead
										</Button>
										<Button
											bgColor="red.500"
											onClick={() => {
												setShowDialog(false);
											}}
										>
											No, Go Back
										</Button>
									</ButtonGroup>
								</VStack>
							)}
						</Dialog.Content>
					</Dialog.Positioner>
				</Dialog.Backdrop>
			</Portal>
		</Dialog.Root>
	);
}

function LoadingDialogBox({ loading = false, content, padding = "7rem" }) {
	return (
		<Dialog.Root
			motionPreset="slide-in-bottom"
			open={loading}
			closeOnEscape={false}
			closeOnInteractOutside={false}
			placement="center"
		>
			<Portal>
				<Dialog.Backdrop>
					<Dialog.Positioner>
						<Dialog.Content
							padding={padding}
							borderColor="#cccccc"
							borderWidth="2px"
						>
							{content}
						</Dialog.Content>
					</Dialog.Positioner>
				</Dialog.Backdrop>
			</Portal>
		</Dialog.Root>
	);
}

function CustomLoader() {
	return (
		<VStack>
			<Spinner color="teal.600" />
			<Text color="teal.600">Loading...</Text>
		</VStack>
	);
}

function OTPInputBox({
	setOTPReady,
	onOTPCorrect = (otp) =>
		debug ? console.log("correct otp:", otp) : console.log(""),
	onOTPIncorrect = (otp) =>
		debug ? console.log("incorrect otp:", otp) : console.log(""),
}) {
	const pinRef = useRef(null);
	return (
		<Box>
			<Center>
				<VStack gap="3rem">
					<Text fontSize="3xl">Enter OTP from email</Text>
					<PinInput.Root otp color="green.100">
						<PinInput.HiddenInput ref={pinRef} />
						<PinInput.Control>
							{[0, 1, 2, 3, 4, 5].map((value, index) => [
								<PinInput.Input index={value} key={index} />,
							])}
						</PinInput.Control>
					</PinInput.Root>
					<ButtonGroup>
						<Button
							bgColor="green.400"
							onClick={async () => {
								if (debug)
									console.log(
										"otp:",
										pinRef.current.value.trim()
									);
								const data = await encryptData([
									pinRef.current.value.trim(),
								]);
								const otpCorrect = await fetch(
									backendUrl + "/verify-otp",
									{
										method: "POST",
										headers: {
											"Content-Type": "application/json",
										},
										body: JSON.stringify({
											data: encodeURIComponent(data),
										}),
									}
								)
									.then((data) => {
										if (data.status === 200) return true;
										else return false;
									})
									.catch((error) =>
										console.error(
											"Error while checking OTP:",
											error
										)
									);
								if (otpCorrect) onOTPCorrect();
								else onOTPIncorrect();
							}}
						>
							Submit
						</Button>
						<Button
							bgColor="red.500"
							onClick={() => {
								setOTPReady(false);
							}}
						>
							Cancel
						</Button>
					</ButtonGroup>
				</VStack>
			</Center>
		</Box>
	);
}

function LogoutUserDisplay({ showDialog, setShowDialog }) {
	const navigate = useNavigate();

	return (
		<Dialog.Root
			motionPreset="slide-in-bottom"
			open={showDialog}
			placement="center"
			closeOnInteractOutside={true}
		>
			<Portal>
				<Dialog.Backdrop>
					<Dialog.Positioner>
						<Dialog.Content
							padding="3rem"
							borderColor="#cccccc"
							borderWidth="2px"
						>
							<VStack
								rowGap="2rem"
								borderRadius="1.5rem"
								padding="3rem"
							>
								<Text
									color="white"
									fontWeight="bold"
									fontSize="2xl"
									textAlign="center"
									lineHeight="2rem"
								>
									Do you want to logout of your current
									account??
								</Text>
								<ButtonGroup orientation="vertical">
									<Button
										bgColor="green.500"
										size="lg"
										onClick={async () => {
											await fetch(
												`${backendUrl}/logout`,
												{
													method: "GET",
													credentials: "include",
													headers: {
														"Content-Type":
															"application/json",
													},
												}
											).then((data) => {
												if (data.status === 200)
													navigate("/login");
												else {
													console.log(
														"Failed to logout user!"
													);
												}
											});
										}}
									>
										Yes, Go Ahead
									</Button>
									<Button
										bgColor="red.500"
										onClick={() => {
											setShowDialog(false);
										}}
									>
										No, Go Back
									</Button>
								</ButtonGroup>
							</VStack>
						</Dialog.Content>
					</Dialog.Positioner>
				</Dialog.Backdrop>
			</Portal>
		</Dialog.Root>
	);
}
