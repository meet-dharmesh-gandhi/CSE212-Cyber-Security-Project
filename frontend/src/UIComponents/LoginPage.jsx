import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as anyAuth from "any-auth";
import { useNavigate } from "react-router-dom";
import {
	loginOrSignUp,
	loginOrSignUpUsingEmail,
} from "../Functions/loginFunctions";
import "../Styles/LoginPage.css";
import { frontendUrl, backendUrl } from "../constants/Urls";
import { debug } from "../constants/Mode";
import {
	Box,
	Button,
	Center,
	HStack,
	Input,
	Separator,
	Text,
	VStack,
} from "@chakra-ui/react";
import {
	PasswordInput,
	PasswordStrengthMeter,
} from "../components/ui/password-input";

export default function LoginPage({ mode = "login" }) {
	const configObject = useMemo(() => {
		return {
			serverUrl: backendUrl + "/",
			providers: {
				google: {
					clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
					clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
					redirectUri: frontendUrl + "/" + mode + "/",
					scope: "email profile openid",
					serverEndPoint: "auth",
				},
			},
		};
	}, [mode]);

	const onLoginButtonClick = (e) => {
		if (debug) console.log("in!");
		(async (e) => {
			if (debug) console.log("in2!");

			if (!e.isTrusted) {
				alert("Script Attack!");
				return;
			}

			if (debug) console.log("in3!");

			const credentials = [
				username,
				password,
				...(mode === "login" ? [] : [email]),
			];
			if (debug) console.log(process.env.REACT_APP_PUBLIC_KEY);
			if (debug) console.log("in4!");
			const result = await loginOrSignUp(credentials, backendUrl, mode);
			if (debug) console.log("result: ");
			if (debug) console.table(result);
			if (result.status === "error" && mode === "login") {
				navigate("/signup");
			} else if (result.status !== "error") {
				navigate("/home");
			} else {
				alert("Invalid Username or Password");
			}
		})(e);
	};

	const redirectToAnotherPage = (e) => {
		if (!e.isTrusted) {
			alert("Script Attack!");
			return;
		}
		navigate(mode === "login" ? "/signup" : "/login");
	};

	const onGoogleLoginButtonClick = (e) => {
		if (!e.isTrusted) {
			alert("Script Attack!");
			return;
		}
		anyAuth.handleLoginButtonClick("google", document.body);
	};

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [passwordStrength, setPasswordStrength] = useState(0);
	const navigate = useNavigate();

	const checkPasswordStrength = useCallback(() => {
		if (!password || password.length < 0) return 0;
		if (password.length < 8) return 1;
		const [hasUpper, hasLower, hasNums, hasSpecial] = [
			/[A-Z]/.test(password),
			/[a-z]/.test(password),
			/[0-9]/.test(password),
			/[!@#$%^&*(),.?":{}|<>]/.test(password),
		];
		if (!hasUpper || !hasLower) return 2;
		if (hasNums && !hasSpecial) return 3;
		if (hasSpecial && hasNums) return 4;
		if (hasNums) return 3;
		return 2;
	}, [password]);

	useEffect(() => {
		if (debug) console.log(checkPasswordStrength());
		setPasswordStrength(checkPasswordStrength());
	}, [password, checkPasswordStrength]);

	useEffect(() => {
		anyAuth.setConfig(configObject, {});
		(async () => {
			const response = await anyAuth.handleOAuthRedirect();
			if (debug) console.log(response);
			if (!response?.data?.response?.data?.data) {
				if (debug) console.log("incorrect response");
			} else {
				const details = response.data.response.data.data;
				if (debug) console.log(details);
				const [result, status] = await loginOrSignUpUsingEmail(
					details.email,
					backendUrl,
					mode
				);
				if (debug)
					console.log("result after email auth:", result, status);
				if (status !== 200) navigate("/signup");
				else navigate("/home");
			}
		})();
	}, [configObject, mode, navigate]);

	return (
		<Box width="100vw" height="100vh" bgColor="beige" overflow="auto">
			<Center width="100%" height="100%" padding="2rem">
				<Box
					className="animate-gradient"
					padding="0.5rem"
					borderRadius="1rem"
				>
					<Box
						bgColor="black"
						width="100%"
						maxWidth="700px"
						padding="2rem"
						borderRadius="0.7rem"
						display="flex"
						flexDirection="column"
						gap="2rem"
					>
						<Text fontSize="4xl" width="100%" textAlign="center">
							{mode === "login" ? "Login" : "Sign Up"}
						</Text>
						<VStack gap="2rem" width="100%">
							<Box
								display="grid"
								gridTemplateColumns="1fr 2fr"
								width="100%"
								gap="2rem"
							>
								<Text>Enter Your Username</Text>
								<Input
									variant="subtle"
									onChange={(e) =>
										setUsername(e.target.value)
									}
								/>
							</Box>
							<Box
								display="grid"
								gridTemplateColumns="1fr 2fr"
								width="100%"
								gap="2rem"
							>
								<Text>Enter Your Password</Text>
								<VStack width="100%" gap="1em">
									<PasswordInput
										variant="subtle"
										onChange={(e) =>
											setPassword(e.target.value)
										}
									/>
									<Box width="100%">
										<PasswordStrengthMeter
											value={passwordStrength}
										/>
									</Box>
								</VStack>
							</Box>
							{mode === "login" ? (
								<></>
							) : (
								<Box
									display="grid"
									gridTemplateColumns="1fr 2fr"
									width="100%"
									gap="2rem"
								>
									<Text>Enter Your Email</Text>
									<Input
										variant="subtle"
										onChange={(e) =>
											setEmail(e.target.value)
										}
									/>
								</Box>
							)}
							<HStack gap="2rem">
								<Button
									bgColor="green.400"
									onClick={(e) => onLoginButtonClick(e)}
								>
									<Text fontSize="1.3em">
										{mode === "login" ? "Login" : "Sign Up"}
									</Text>
								</Button>
								<VStack
									gap="0"
									height="150%"
									position="relative"
								>
									<Separator
										flex="1"
										borderColor="white"
										height="1rem"
										orientation="vertical"
										position="absolute"
										top="-1rem"
									/>
									<Text>OR</Text>
									<Separator
										flex="1"
										borderColor="white"
										height="1rem"
										orientation="vertical"
										position="absolute"
										bottom="-1rem"
									/>
								</VStack>
								<Button
									bgColor="green.400"
									onClick={(e) => redirectToAnotherPage(e)}
								>
									<Text fontSize="1.3em">
										{mode === "login" ? "Sign Up" : "Login"}
									</Text>
								</Button>
							</HStack>
							<HStack width="100%">
								<Separator
									flex="1"
									borderColor="white"
									width="100%"
								/>
								<Text flexShrink="0">OR</Text>
								<Separator
									flex="1"
									borderColor="white"
									width="100%"
								/>
							</HStack>
							<Button
								bgColor="blue.400"
								onClick={(e) => onGoogleLoginButtonClick(e)}
							>
								{mode === "login" ? "Login" : "Sign Up"} With
								Google
							</Button>
						</VStack>
					</Box>
				</Box>
			</Center>
		</Box>
	);
}
