import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { frontendUrl, backendUrl } from "../constants/Urls";
import { debug } from "../constants/Mode";
import Notifications from "./Notifications";

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
		fetch(backendUrl + "/check-valid-user", {
			method: "GET",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((data) => {
				if (data.status !== 200) {
					throw new Error("User is not authenticated!");
				}
				setCheckIfSet(true);
			})
			.catch((err) => {
				window.location.href = frontendUrl + "/login";
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
			fetch(backendUrl + "/check-valid-user", {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
				.then((data) => {
					if (data.status !== 200) {
						throw new Error("User is not authenticated!");
					}
				})
				.catch((err) => {
					window.location.href = frontendUrl + "/login";
				});
		}, 16 * 60 * 1000);
		return () => clearTimeout(timeout);
	}, [checkIfSet]);
	return <Notifications />;
}
