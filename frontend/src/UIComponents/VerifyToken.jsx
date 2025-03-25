import {
	Alert,
	Box,
	Button,
	ButtonGroup,
	Center,
	Text,
	VStack,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const frontendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_CLIENT_URL
		: process.env.REACT_APP_DEV_CLIENT_URL;
const backendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_SERVER_URL
		: process.env.REACT_APP_DEV_SERVER_URL;
const debug = !(process.env.REACT_APP_ENV === "Production");

export default function VerifyToken() {
	const navigate = useNavigate();
	const [updated, setUpdated] = useState("pending");
	const [token, setToken] = useState(null);
	const [disableButton, setDisableButton] = useState(false);

	useEffect(() => {
		const newToken = new URLSearchParams(window.location.search).get(
			"token"
		);
		setToken(newToken);
		if (!newToken) navigate("/login");
	});
	return (
		<Box className="w100vw h100vh">
			<Center className="w100 h100">
				<VStack>
					<Box className="w100 h100">
						<Center
							className="padding w100 h100"
							style={{ "--padding": "5rem" }}
						>
							<VStack
								rowGap="2rem"
								bgColor="whiteAlpha.500"
								borderRadius="1.5rem"
								padding="3rem"
							>
								<Text
									color="black"
									fontWeight="bold"
									fontSize="3xl"
								>
									Do you want to proceed??
								</Text>
								<ButtonGroup orientation="vertical">
									<Button
										bgColor="green.500"
										size="lg"
										onClick={async () => {
											const tokenValid = await fetch(
												`${backendUrl}${
													backendUrl.endsWith("/")
														? ""
														: "/"
												}verify-token/${token}`
											).then((data) => {
												if (data.status === 200)
													setUpdated("updated");
												else navigate("/login");
											});
										}}
										disabled={disableButton}
									>
										Yes, Go Ahead
									</Button>
									<Button
										bgColor="red.500"
										onClick={() => {
											setDisableButton(true);
											setUpdated("updated");
										}}
									>
										No, Go Back
									</Button>
								</ButtonGroup>
							</VStack>
						</Center>
					</Box>
					{updated === "updated" ? (
						<Alert.Root status="success" variant="surface">
							<Alert.Indicator />
							<Alert.Title>
								Close the tab and continue your work!
							</Alert.Title>
						</Alert.Root>
					) : (
						<></>
					)}
				</VStack>
			</Center>
		</Box>
	);
}
