import {
	Accordion,
	Span,
	Box,
	IconButton,
	Center,
	List,
} from "@chakra-ui/react";
import { TiTick } from "react-icons/ti";
import { MdCancel } from "react-icons/md";
import { PiMonitorDuotone } from "react-icons/pi";
import { FaLocationDot, FaCity } from "react-icons/fa6";
import React from "react";
import "../Styles/MyActivity.css";

export default function MyActivity() {
	const items = [
		{
			value: "a",
			title: "First Item",
			text: <Activity />,
		},
		{ value: "b", title: "Second Item", text: <Activity /> },
		{ value: "c", title: "Third Item", text: <Activity /> },
	];
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
				defaultValue={["a"]}
				size="lg"
				variant="enclosed"
			>
				{items.map((item, index) => (
					<Accordion.Item key={index} value={item.value}>
						<Accordion.ItemTrigger>
							<Span flex="1" color="white">
								{item.title}
							</Span>
							<Accordion.ItemIndicator />
						</Accordion.ItemTrigger>
						<Accordion.ItemContent>
							<Accordion.ItemBody color="white">
								{item.text}
							</Accordion.ItemBody>
						</Accordion.ItemContent>
					</Accordion.Item>
				))}
			</Accordion.Root>
		</Box>
	);
}

function Activity() {
	return (
		<Box>
			<Center>
				<List.Root variant="plain" align="center" gap="2">
					<List.Item>
						<List.Indicator asChild>
							<PiMonitorDuotone />
						</List.Indicator>
						IP Address: 8.8.8.8
					</List.Item>
					<List.Item>
						<List.Indicator asChild>
							<FaCity />
						</List.Indicator>
						City: Ahmedabad
					</List.Item>
					<List.Item>
						<List.Indicator asChild>
							<FaLocationDot />
						</List.Indicator>
						Latitude and Longitude: some numbers
					</List.Item>
				</List.Root>
			</Center>
			<Span
				className="flex justify align padding"
				style={{
					"--justify": "space-between",
					"--padding": "0px 5em",
				}}
			>
				<IconButton colorPalette="green">
					<TiTick />
				</IconButton>
				<IconButton colorPalette="red">
					<MdCancel />
				</IconButton>
			</Span>
		</Box>
	);
}
