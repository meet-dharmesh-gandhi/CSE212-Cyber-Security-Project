import { Box, Center, VStack, Text, Button } from "@chakra-ui/react";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function MissingRoute() {
	const navigate = useNavigate();
	return (
		<Box width="100%" height="100vh">
			<Center width="100%" height="100vh">
				<VStack gap="4em">
					<Text>Oops! You have visited an unknown Page!</Text>
					<Button
						onClick={() => navigate("/login")}
						bgColor="green.400"
					>
						Click to go back to the Login Page!
					</Button>
				</VStack>
			</Center>
		</Box>
	);
}
