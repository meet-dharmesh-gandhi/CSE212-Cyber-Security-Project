import { Alert, VStack } from "@chakra-ui/react";
import React, { useContext, useEffect } from "react";
import { NotificationsContext } from "../App";

export default function Notifications() {
	const { notifications } = useContext(NotificationsContext);

	return (
		<VStack
			zIndex="100"
			position="absolute"
			bottom="0"
			right="0"
			padding="1rem"
			gap="2rem"
		>
			{notifications.map((ele, ind) => (
				<Alert.Root status={ele.status} key={ind}>
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>{ele.title}</Alert.Title>
					</Alert.Content>
				</Alert.Root>
			))}
		</VStack>
	);
}
