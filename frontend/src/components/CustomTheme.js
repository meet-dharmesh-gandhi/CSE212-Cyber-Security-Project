import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
	theme: {
		tokens: {
			colors: {
				brand: {
					111: { value: "#111111" },
					lightBlue: { value: "#55f" },
					222: { value: "#222" },
					999: { value: "#999" },
				},
			},
		},
	},
});
