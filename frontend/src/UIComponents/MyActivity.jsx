import { Accordion, Span, Box, Center, Text, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import "../Styles/MyActivity.css";
import { backendUrl } from "../constants/Urls";

export default function MyActivity() {
	const [myActivity, setMyActivity] = useState([]);

	const getMyActivity = useCallback(async () => {
		const fetchedActivity = await fetch(backendUrl + "/view-my-activity", {
			method: "get",
			credentials: "include",
		}).then((data) => data.json());
		return fetchedActivity;
	}, []);

	useEffect(() => {
		(async () => {
			const activity = await getMyActivity();
			setMyActivity(activity);
		})();
	}, []);

	return (
		<Box
			margin="2rem 2rem"
			bgColor="black"
			borderRadius="2rem"
			padding="2rem"
			overflow="auto"
		>
			<Accordion.Root
				multiple
				size="lg"
				variant="enclosed"
				defaultValue={[0]}
			>
				{myActivity.map((activity, index) => {
					if (!activity.activityDescription || !activity.activityType)
						return null;
					const { date, IpDetails } = JSON.parse(
						activity.activityDescription
					);
					return (
						<Accordion.Item key={index} value={index}>
							<Accordion.ItemTrigger>
								<Span flex="1" color="white">
									{activity.activityType}
								</Span>
								<Accordion.ItemIndicator />
							</Accordion.ItemTrigger>
							<Accordion.ItemContent>
								<Accordion.ItemBody>
									<Center
										width="100%"
										display="flex"
										flexDirection="column"
										gap="2rem"
									>
										<Box>
											<Center
												width="100%"
												display="flex"
												flexDirection="column"
											>
												<Text>Date & Time:</Text>
												<Text>{date}</Text>
											</Center>
										</Box>
										<Box>
											<Center
												width="100%"
												display="flex"
												flexDirection="column"
											>
												<Text>Activity IP Details</Text>
												<VStack gap="0.5rem">
													{Object.entries(
														IpDetails.data
													).map((ele, ind) => (
														<Text
															key={
																index +
																"ip-addr" +
																ind
															}
														>
															{ele[0] +
																" : " +
																ele[1]}
														</Text>
													))}
												</VStack>
											</Center>
										</Box>
									</Center>
								</Accordion.ItemBody>
							</Accordion.ItemContent>
						</Accordion.Item>
					);
				})}
			</Accordion.Root>
		</Box>
	);
}
