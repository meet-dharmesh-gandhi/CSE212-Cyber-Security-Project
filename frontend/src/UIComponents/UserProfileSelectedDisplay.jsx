import {
	Box,
	Button,
	ButtonGroup,
	Center,
	Dialog,
	Field,
	Input,
	PinInput,
	Portal,
	Spinner,
	Text,
	VStack,
} from "@chakra-ui/react";
import { PasswordInput } from "../components/ui/password-input";
import React, { useEffect, useRef, useState } from "react";
import { encryptData } from "../Functions/cryptoFunctions";

const frontendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_CLIENT_URL
		: process.env.REACT_APP_DEV_CLIENT_URL;
const backendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_SERVER_URL
		: process.env.REACT_APP_DEV_SERVER_URL;
const debug = !(process.env.REACT_APP_ENV === "Production");

export default function UserProfileSelectedDisplay({ selected = 0 }) {
	const toDisplay = [
		<ResetEmailDisplay />,
		<ResetPasswordDisplay />,
		<ResetUserNameDisplay />,
		null,
		null,
	];

	return (
		<Box
			width="100%"
			height="100%"
			className="padding"
			style={{ "--padding": "2rem" }}
		>
			{toDisplay[selected] ?? <Text>{selected}</Text>}
		</Box>
	);
}

function ResetUserNameDisplay() {
	const userNameInputs = [useRef(null), useRef(null)];
	const [startPolling, setStartPolling] = useState(false);
	const [loading, setLoading] = useState(false);
	const [OTPReady, setOTPReady] = useState(false);

	useEffect(() => {
		if (!startPolling) return;
		let elapsedTime = 0;
		const interval = setInterval(async () => {
			const approved = await fetch(
				`${backendUrl}${
					backendUrl.endsWith("/") ? "" : "/"
				}check-token`,
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				}
			).then((data) => {
				if (data.status === 200) return true;
				else return false;
			});

			if (approved) {
				if (debug) console.log("approved!");
				const data = await encryptData([
					userNameInputs[0].current.value,
					userNameInputs[1].current.value,
				]);
				const usernameReset = await fetch(
					`${backendUrl}${
						backendUrl.endsWith("/") ? "" : "/"
					}reset-username`,
					{
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							data: encodeURIComponent(data),
						}),
					}
				).then((data) => {
					if (data.status === 200) return true;
					else return false;
				});
				if (debug) console.log("usernameReset:", usernameReset);
				setStartPolling(false);
				setLoading(false);
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
		<Box width="100%" height="100%">
			<Center width="100%" height="100%">
				<VStack width="100%">
					<CustomInputBox
						labelText="Old Username:"
						placeholderText="Enter your old username here"
						givenRef={userNameInputs[0]}
					/>
					<CustomInputBox
						labelText="New Username:"
						placeholderText="Enter your new username here"
						required
						givenRef={userNameInputs[1]}
					/>
					<Button
						margin="3rem 0rem 0rem 0rem"
						bgColor="blue.400"
						onClick={async () => {
							if (
								userNameInputs[0].current.value &&
								userNameInputs[1].current.value
							) {
								setLoading(true);
								const otpCreated = await fetch(
									`${backendUrl}${
										backendUrl.endsWith("/") ? "" : "/"
									}create-otp`,
									{
										method: "GET",
										credentials: "include",
										headers: {
											"Content-Type": "application/json",
										},
									}
								);
								if (otpCreated.status !== 200)
									return debug
										? console.log(
												"Unknown Error in OTP Creation"
										  )
										: null;
								setLoading(false);
								setOTPReady(true);
							} else {
								if (debug) console.log("Invalid way!");
							}
						}}
					>
						<Text fontWeight="semibold">Reset Username</Text>
					</Button>
				</VStack>
			</Center>
			<LoadingDialogBox loading={loading} content={<CustomLoader />} />
			<LoadingDialogBox
				loading={OTPReady}
				content={
					<OTPInputBox
						setOTPReady={setOTPReady}
						onOTPCorrect={async (otp) => {
							if (debug) console.log("OTP correct!");
							setOTPReady(false);
							sendResetUsernameEmail(setLoading, setStartPolling);
						}}
					/>
				}
				padding="3rem"
			/>
		</Box>
	);
}

async function sendResetUsernameEmail(setLoading, setStartPolling) {
	setLoading(true);
	const alerted = await fetch(
		backendUrl +
			(backendUrl.endsWith("/") ? "" : "/") +
			"send-reset-username-alert",
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		}
	).then((data) => data.status === 200);
	if (alerted) {
		setStartPolling(true);
		setLoading(true);
	} else {
		setLoading(false);
	}
}

async function sendResetEmailEmail(setLoading, emailInputs, setStartPolling) {
	setLoading(true);
	const email2 = await encryptData([emailInputs[1].current.value]);
	const alerted = await fetch(
		backendUrl +
			(backendUrl.endsWith("/") ? "" : "/") +
			"send-reset-email-alert",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				data: encodeURIComponent(email2),
			}),
		}
	).then((data) => data.status === 200);
	if (alerted) {
		setStartPolling(true);
		setLoading(true);
	} else {
		setLoading(false);
	}
}

function ResetEmailDisplay() {
	const emailInputs = [useRef(null), useRef(null)];
	const [startPolling, setStartPolling] = useState(false);
	const [loading, setLoading] = useState(false);
	const [OTPReady, setOTPReady] = useState(false);

	useEffect(() => {
		if (!startPolling) return;
		let elapsedTime = 0;
		const interval = setInterval(async () => {
			const approved = await fetch(
				`${backendUrl}${
					backendUrl.endsWith("/") ? "" : "/"
				}check-token`,
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				}
			).then((data) => {
				if (data.status === 200) return true;
				else return false;
			});

			if (approved) {
				if (debug) console.log("approved!");
				const data = await encryptData([emailInputs[1].current.value]);
				const emailReset = await fetch(
					`${backendUrl}${
						backendUrl.endsWith("/") ? "" : "/"
					}reset-email`,
					{
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							data: encodeURIComponent(data),
						}),
					}
				).then((data) => {
					if (data.status === 200) return true;
					else return false;
				});
				if (debug) console.log("emailReset:", emailReset);
				setStartPolling(false);
				setLoading(false);
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
		<Box width="100%" height="100%">
			<Center width="100%" height="100%">
				<VStack width="100%">
					<CustomInputBox
						labelText="Old Email:"
						placeholderText="Enter your old email here"
						givenRef={emailInputs[0]}
					/>
					<CustomInputBox
						labelText="New Email:"
						placeholderText="Enter your new email here"
						required
						givenRef={emailInputs[1]}
					/>
					<Button
						margin="3rem 0rem 0rem 0rem"
						bgColor="blue.400"
						onClick={async () => {
							if (
								emailInputs[0].current.value &&
								emailInputs[1].current.value
							) {
								if (debug) console.log("method 1");
								setLoading(true);
								const otpCreated = await fetch(
									`${backendUrl}${
										backendUrl.endsWith("/") ? "" : "/"
									}create-otp`,
									{
										method: "GET",
										credentials: "include",
										headers: {
											"Content-Type": "application/json",
										},
									}
								);
								if (otpCreated.status !== 200)
									return debug
										? console.log(
												"Unknown Error in OTP Creation"
										  )
										: null;
								setLoading(false);
								setOTPReady(true);
							} else if (emailInputs[1].current.value) {
								if (debug) console.log("method 2");
								sendResetEmailEmail(
									setLoading,
									emailInputs,
									setStartPolling
								);
							} else {
								if (debug) console.log("Invalid way!");
							}
						}}
					>
						<Text fontWeight="semibold">Reset Email</Text>
					</Button>
				</VStack>
			</Center>
			<LoadingDialogBox loading={loading} content={<CustomLoader />} />
			<LoadingDialogBox
				loading={OTPReady}
				content={
					<OTPInputBox
						setOTPReady={setOTPReady}
						onOTPCorrect={async (otp) => {
							if (debug) console.log("OTP correct!");
							setOTPReady(false);
							sendResetEmailEmail(
								setLoading,
								emailInputs,
								setStartPolling
							);
						}}
					/>
				}
				padding="3rem"
			/>
		</Box>
	);
}

function ResetPasswordDisplay() {
	const [startPolling, setStartPolling] = useState(false);
	const [loading, setLoading] = useState(false);
	const [OTPReady, setOTPReady] = useState(false);
	const passwordInputs = [useRef(null), useRef(null), useRef(null)];

	useEffect(() => {
		if (!startPolling) return;
		let elapsedTime = 0;
		const interval = setInterval(async () => {
			const approved = await fetch(
				`${backendUrl}${
					backendUrl.endsWith("/") ? "" : "/"
				}check-token`,
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				}
			).then((data) => {
				if (data.status === 200) return true;
				else return false;
			});

			if (approved) {
				if (debug) console.log("approved!");
				setStartPolling(false);
				const otpCreated = await fetch(
					`${backendUrl}${
						backendUrl.endsWith("/") ? "" : "/"
					}create-otp`,
					{
						method: "GET",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);
				if (otpCreated.status !== 200)
					return debug
						? console.log("Unknown Error in OTP Creation")
						: null;
				setLoading(false);
				setOTPReady(true);
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
		<Box width="100%" height="100%">
			<Center width="100%" height="100%">
				<VStack width="100%">
					<CustomInputBox
						labelText="Old Password:"
						placeholderText="Enter your old password here"
						required
						password
						givenRef={passwordInputs[0]}
					/>
					<CustomInputBox
						labelText="New Password:"
						placeholderText="Enter your new password here"
						required
						password
						givenRef={passwordInputs[1]}
					/>
					<CustomInputBox
						labelText="Re-Enter New Password:"
						placeholderText="Enter your new password here"
						required
						password
						givenRef={passwordInputs[2]}
					/>
					<Button
						className="bg margin"
						style={{
							"--bg": "#44ff44",
							"--margin": "3rem 0rem 0rem 0rem",
						}}
						onClick={async () => {
							setLoading(true);
							const alerted = await fetch(
								backendUrl +
									(backendUrl.endsWith("/") ? "" : "/") +
									"send-reset-password-alert",
								{
									method: "GET",
									headers: {
										"Content-Type": "application/json",
									},
									credentials: "include",
								}
							);
							if (debug) console.table(alerted);
							setStartPolling(true);
						}}
					>
						<Text fontWeight="semibold">Reset Password</Text>
					</Button>
				</VStack>
			</Center>
			<LoadingDialogBox loading={loading} content={<CustomLoader />} />
			<LoadingDialogBox
				loading={OTPReady}
				content={
					<OTPInputBox
						setOTPReady={setOTPReady}
						onOTPCorrect={async () => {
							if (debug) console.log("OTP correct!");
							if (
								!passwordInputs[0].current.value ||
								!passwordInputs[1].current.value ||
								!passwordInputs[2].current.value
							)
								return;
							const oldPass = passwordInputs[0].current.value;
							const newPass = passwordInputs[1].current.value;
							const newPass2 = passwordInputs[2].current.value;
							if (newPass !== newPass2) {
								if (debug)
									console.log("Passwords don't match!");
								return;
							}
							const encryptedData = await encryptData([
								oldPass,
								newPass,
							]);
							const passwordReset = await fetch(
								backendUrl +
									(backendUrl.endsWith("/") ? "" : "/") +
									"reset-password",
								{
									method: "POST",
									credentials: "include",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										data: encodeURIComponent(encryptedData),
									}),
								}
							)
								.then((data) => {
									if (data.status === 200) return true;
									else return false;
								})
								.catch((error) =>
									console.error(
										"Error while resetting password:",
										error
									)
								);
							if (passwordReset) {
								if (debug) console.log("User password reset!");
								setOTPReady(false);
							} else {
								if (debug)
									console.log("Password reset failed!");
								// setOTPReady(false);
							}
						}}
					/>
				}
				padding="3rem"
			/>
		</Box>
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
									backendUrl +
										(backendUrl.endsWith("/") ? "" : "/") +
										"verify-otp",
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

function CustomInputBox({
	required = false,
	labelText,
	placeholderText,
	variant = "outline",
	password = false,
	givenRef,
}) {
	return (
		<Box
			className="padding"
			style={{
				"--padding": "1rem",
			}}
			width="100%"
		>
			<Field.Root required={required}>
				<Field.Label>
					{labelText} <Field.RequiredIndicator />
				</Field.Label>
				{password ? (
					<PasswordInput
						className="br"
						style={{ "--br-w": "1px", "--br-c": "#7f7f7f" }}
						placeholder={placeholderText}
						ref={givenRef}
					/>
				) : (
					<Input
						className="br"
						style={{ "--br-w": "1px", "--br-c": "#7f7f7f" }}
						placeholder={placeholderText}
						variant={variant}
						ref={givenRef}
					/>
				)}
			</Field.Root>
		</Box>
	);
}
