import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const frontendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_CLIENT_URL
		: process.env.REACT_APP_DEV_CLIENT_URL;
const backendUrl =
	process.env.REACT_APP_ENV === "Production"
		? process.env.REACT_APP_SERVER_URL
		: process.env.REACT_APP_DEV_SERVER_URL;
const debug = !(process.env.REACT_APP_ENV === "Production");
const routesToIgnore = ["/login", "/signup", "/verify-token"];

export default function GlobalComponent() {
	const [checkIfSet, setCheckIfSet] = useState(false);
	const location = useLocation();

	useEffect(() => {
		if (debug) console.log(window.location.pathname);
		if (
			routesToIgnore.includes(
				window.location.pathname.replace(/\/$/g, "")
			)
		)
			return;
		fetch(
			backendUrl +
				(backendUrl.endsWith("/") ? "" : "/") +
				"check-valid-user",
			{
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}
		)
			.then((data) => {
				if (data.status !== 200) {
					throw new Error("User is not authenticated!");
				}
				setCheckIfSet(true);
			})
			.catch((err) => {
				window.location.href =
					frontendUrl +
					(frontendUrl.endsWith("/") ? "" : "/") +
					"login";
			});
	}, [location.pathname]);

	useEffect(() => {
		if (!checkIfSet) return;
		const timeout = setTimeout(() => {
			if (debug) console.log(window.location.pathname);
			if (
				routesToIgnore.includes(
					window.location.pathname.replace(/\/$/g, "")
				)
			)
				return;
			fetch(
				backendUrl +
					(backendUrl.endsWith("/") ? "" : "/") +
					"check-valid-user",
				{
					method: "GET",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				}
			)
				.then((data) => {
					if (data.status !== 200) {
						throw new Error("User is not authenticated!");
					}
				})
				.catch((err) => {
					window.location.href =
						frontendUrl +
						(frontendUrl.endsWith("/") ? "" : "/") +
						"login";
				});
		}, 16 * 60 * 1000);
		return () => clearTimeout(timeout);
	}, [checkIfSet]);
	return <></>;
}
