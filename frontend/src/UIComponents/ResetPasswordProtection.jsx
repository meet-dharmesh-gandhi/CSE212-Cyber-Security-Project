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

export default function ResetPasswordProtection() {
	const items = [
		{
			value: "a",
			title: "First Item",
			text: (
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
			),
		},
		{ value: "b", title: "Second Item", text: "Some value 2..." },
		{ value: "c", title: "Third Item", text: "Some value 3..." },
	];
	return (
		<div
			className="margin bg b-r padding flex fx-col"
			style={{
				"--margin": "50px 50px",
				"--bg": "black",
				"--b-r": "30px",
				"--padding": "30px",
			}}
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
		</div>
	);
}
