import {
	Text,
	Box,
	Editable,
	IconButton,
	Table,
	VStack,
	HStack,
	Button,
	ButtonGroup,
	Center,
	Separator,
} from "@chakra-ui/react";
import {
	PasswordInput,
	PasswordStrengthMeter,
} from "../components/ui/password-input";
import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
	useContext,
} from "react";
import { NotificationsContext } from "../App";
import { LuCheck, LuPencilLine, LuPlus, LuX } from "react-icons/lu";
import { MdDelete } from "react-icons/md";
import {
	checkPasswordAndParsePasswords,
	getPasswordFromLocalStorage,
	getPasswordsFromCloud,
	initializePasswordManager,
	savePasswordsLocally,
	syncPasswordsToCloud,
} from "../Functions/passwordManagerFunctions";
import { backendUrl } from "../constants/Urls";
import { debug } from "../constants/Mode";

export default function ViewMyPasswords() {
	const [passwords, setPasswords] = useState({});
	const [userPassword, setUserPassword] = useState("");
	const [passwordManagerSetup, setupPasswordManagerSetup] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState(0);
	const [userPasswordValid, setUserPasswordValid] = useState(false);
	const rawCloudPasswords = useRef(null);
	const { addNotification } = useContext(NotificationsContext);

	const addPassword = (name, password) => {
		setPasswords((prev) => ({
			...prev,
			[name]: password,
		}));
	};

	const deletePassword = (key) => {
		if (debug) console.log("Called to delete!");
		setPasswords((prev) => {
			const updated = { ...prev };
			delete updated[key];
			return updated;
		});
	};

	const updatePasswordName = (oldKey, newKey) => {
		setPasswords((prev) => {
			const updated = { ...prev };
			updated[newKey] = updated[oldKey];
			delete updated[oldKey];
			return updated;
		});
	};

	const updatePasswordValue = (key, newValue) => {
		setPasswords((prev) => ({
			...prev,
			[key]: newValue,
		}));
	};

	const checkPasswordStrength = useCallback(() => {
		if (!userPassword || userPassword.length < 0) return 0;
		if (userPassword.length < 8) return 1;
		const [hasUpper, hasLower, hasNums, hasSpecial] = [
			/[A-Z]/.test(userPassword),
			/[a-z]/.test(userPassword),
			/[0-9]/.test(userPassword),
			/[!@#$%^&*(),.?":{}|<>]/.test(userPassword),
		];
		if (!hasUpper || !hasLower) return 2;
		if (hasNums && !hasSpecial) return 3;
		if (hasSpecial && hasNums) return 4;
		if (hasNums) return 3;
		return 2;
	}, [userPassword]);

	useEffect(() => {
		(async () => {
			const passwordManagerInitialized = await fetch(
				backendUrl + "/password-manager-initialized",
				{
					method: "GET",
					credentials: "include",
				}
			);
			if (passwordManagerInitialized.status === 200) {
				setupPasswordManagerSetup(true);
				return;
			}
			// const storedPasswords = localStorage.getItem("passwords");
			// if (storedPasswords) {
			// 	try {
			// 		const newParsedPasswords = JSON.parse(storedPasswords);
			// 		setPasswords(newParsedPasswords);
			// 	} catch (error) {
			// 		console.error(error);
			// 	}
			// }
		})();
	}, []);

	// useEffect(() => {
	// 	if (Object.entries(passwords).length === 0) return;
	// 	console.log(passwords);
	// 	localStorage.setItem("passwords", JSON.stringify(passwords));
	// }, [passwords]);

	useEffect(() => {
		if (debug) console.log(checkPasswordStrength());
		setPasswordStrength(checkPasswordStrength());
	}, [userPassword, checkPasswordStrength]);

	return (
		<Box
			margin="2rem 2rem"
			bgColor="black"
			borderRadius="2rem"
			padding="2rem"
		>
			{passwordManagerSetup && userPasswordValid ? (
				<VStack gap="2rem">
					<Table.Root size="md" variant="outline">
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeader width="40%">
									Password Name
								</Table.ColumnHeader>
								<Table.ColumnHeader width="60%">
									Password
								</Table.ColumnHeader>
								<Table.ColumnHeader>
									<IconButton color="red">
										<MdDelete />
									</IconButton>
								</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{passwords ? (
								Object.entries(passwords).map(
									([key, val], index) => (
										<Table.Row key={key}>
											<Table.Cell>
												<EditableInput
													value={key}
													onInputChange={(value) =>
														updatePasswordName(
															key,
															value
														)
													}
												/>
											</Table.Cell>
											<Table.Cell>
												<EditableInput
													value={val}
													onInputChange={(value) =>
														updatePasswordValue(
															key,
															value
														)
													}
												/>
											</Table.Cell>
											<Table.Cell>
												<IconButton
													size="lg"
													color="red"
													onClick={() =>
														deletePassword(key)
													}
												>
													<MdDelete />
												</IconButton>
											</Table.Cell>
										</Table.Row>
									)
								)
							) : (
								<Table.Row>
									<Table.Cell>
										<Text>Passwords</Text>
									</Table.Cell>
									<Table.Cell>
										<Text>{passwords}</Text>
									</Table.Cell>
								</Table.Row>
							)}
						</Table.Body>
					</Table.Root>
					<ButtonGroup width="100%" attached>
						<Button
							bgColor="green.300"
							width="20%"
							borderRadius="1rem 0rem 0rem 3rem"
							onClick={async () => {
								// if (Object.entries(passwords).length === 0) return;
								// console.log(passwords);
								// // localStorage.setItem("passwords", JSON.stringify(passwords));
								// addPasswordToLocalStorage(passwords);
								if (getPasswordFromLocalStorage() === "{}") {
									if (debug)
										console.log(
											"Passwords not found in the local storage, reverting to cloud..."
										);
									if (debug)
										console.log(
											"password, salt, iv:",
											rawCloudPasswords
										);
									addNotification(
										"warning",
										"No Passwords were stored locally!"
									);
									const passwordsUploaded =
										await syncPasswordsToCloud(
											false,
											userPassword,
											passwords,
											rawCloudPasswords.current[1],
											rawCloudPasswords.current[2]
										);
									if (passwordsUploaded)
										addNotification(
											"success",
											"Passwords were successfully stored to cloud!"
										);
									else
										addNotification(
											"error",
											"Could not store your passwords to the cloud, Try Again!"
										);
								} else {
									const passwordsSynced =
										await syncPasswordsToCloud();
									if (passwordsSynced)
										addNotification(
											"success",
											"Local Passwords Successfully Synced to Cloud!"
										);
								}
							}}
						>
							<Text>Sync to Cloud</Text>
						</Button>
						<IconButton
							width="60%"
							variant="surface"
							bgColor="blueviolet"
							borderRadius="0rem"
							borderWidth="0"
							shadowColor="none"
							onClick={() => addPassword("", "")}
						>
							<LuPlus />
						</IconButton>
						<Button
							bgColor="red.300"
							width="20%"
							borderRadius="0rem 1rem 3rem 0rem"
							onClick={async (e) => {
								if (!e.isTrusted) {
									return;
								}
								// if (Object.entries(passwords).length === 0) return;
								// console.log(passwords);
								// // localStorage.setItem("passwords", JSON.stringify(passwords));
								// addPasswordToLocalStorage(passwords);
								if (getPasswordFromLocalStorage() !== "{}") {
									if (debug)
										console.log(
											"passwords are in local storage!"
										);
									try {
										await savePasswordsLocally(
											passwords,
											userPassword
										);
										addNotification(
											"success",
											"Passwords Stored Locally!"
										);
									} catch (error) {
										addNotification(
											"error",
											"Error while Storing Passwords Locally, Try Again!"
										);
									}
								} else if (
									rawCloudPasswords.current &&
									Array.isArray(rawCloudPasswords.current) &&
									rawCloudPasswords.current.length === 3
								) {
									if (debug)
										console.log(
											"Passwords not found in the local storage, reverting to cloud..."
										);
									if (debug)
										console.log(
											"password, salt, iv:",
											rawCloudPasswords
										);
									try {
										await savePasswordsLocally(
											passwords,
											userPassword,
											false,
											rawCloudPasswords.current[1],
											rawCloudPasswords.current[2]
										);
										addNotification(
											"success",
											"Passwords Stored Locally!"
										);
									} catch (error) {
										addNotification(
											"error",
											"Error while Storing Passwords Locally, Try Again!"
										);
									}
								}
							}}
						>
							<Text>Save Locally</Text>
						</Button>
					</ButtonGroup>
				</VStack>
			) : (
				<Center height="100%">
					<VStack gap="2em">
						<Text>Create a Password for the Password Manager:</Text>
						<VStack width="100%" gap="1em">
							<PasswordInput
								variant="subtle"
								onChange={(e) =>
									setUserPassword(e.target.value)
								}
							/>
							<Box width="100%">
								<PasswordStrengthMeter
									value={passwordStrength}
								/>
							</Box>
						</VStack>
						<Button
							bgColor="green.400"
							onClick={() => {
								if (debug) console.log("Setting up...");
								if (!userPassword || passwordStrength < 3)
									return console.log("Invalid Password!");
								if (!passwordManagerSetup) {
									const passwordManagerInitialized =
										initializePasswordManager(userPassword);
									if (passwordManagerInitialized) {
										if (debug)
											console.log(
												"Password Manager Initialized!"
											);
										setupPasswordManagerSetup(true);
										setUserPasswordValid(true);
									} else {
										addNotification(
											"error",
											"Could not setup password manager!"
										);
										if (debug)
											console.log(
												"Some Error while initializing the Password Manager!"
											);
									}
								} else if (
									getPasswordFromLocalStorage() !== "{}"
								) {
									// validate the password and decode the passwords, and then update the state!
									(async () => {
										try {
											const [validPassword, passwords] =
												await checkPasswordAndParsePasswords(
													userPassword,
													getPasswordFromLocalStorage()
												);
											if (!validPassword) {
												addNotification(
													"error",
													"Invalid Password!"
												);
												if (debug)
													console.log(
														"Invalid Password!"
													);
											} else {
												setPasswords(passwords);
												setUserPasswordValid(true);
											}
										} catch (error) {
											console.error(
												"Error while decryption:",
												error
											);
										}
									})();
								} else {
									addNotification(
										"error",
										"Could not find any locally stored passwords, try loading from the cloud instead!"
									);
									if (debug)
										console.log(
											"Could not find any locally stored passwords, try loading from the cloud instead!"
										);
								}
							}}
						>
							{setupPasswordManagerSetup
								? "Start my Password Manager!"
								: "Set Up My Password Manager!"}
						</Button>
						{setupPasswordManagerSetup ? (
							<>
								<HStack width="100%">
									<Separator
										flex="1"
										borderColor="white"
										variant="solid"
										size="lg"
									/>
									<Text flexShrink="0">OR</Text>
									<Separator
										flex="1"
										borderColor="white"
										variant="solid"
										size="lg"
									/>
								</HStack>
								<Button
									bgColor="blue.400"
									onClick={() => {
										if (
											!userPassword ||
											passwordStrength < 3
										) {
											addNotification(
												"error",
												"Invalid Password!"
											);
											if (debug)
												return console.log(
													"Invalid Password!"
												);
										}
										if (passwordManagerSetup) {
											(async () => {
												try {
													let prevPasswords;
													if (
														getPasswordFromLocalStorage() !==
														"{}"
													) {
														const [
															validPassword,
															passwords,
														] =
															await checkPasswordAndParsePasswords(
																userPassword,
																getPasswordFromLocalStorage()
															);
														if (!validPassword) {
															addNotification(
																"error",
																"Invalid Password!"
															);
															if (debug)
																console.log(
																	"Invalid Password!"
																);
															return;
														}
														prevPasswords =
															passwords;
													}
													const cloudPasswords =
														await getPasswordsFromCloud(
															userPassword
														);
													if (debug)
														console.log(
															"cloudPasswords:",
															cloudPasswords
														);
													if (!cloudPasswords[0]) {
														addNotification(
															"error",
															"Could not load passwords from the cloud!"
														);
														if (debug)
															console.log(
																"Could not Load the passwords from the cloud!"
															);
														return;
													}
													setUserPasswordValid(true);
													setPasswords((prev) => {
														return {
															...prev,
															...prevPasswords,
															...cloudPasswords[1],
														};
													});
													rawCloudPasswords.current =
														cloudPasswords[2];
												} catch (error) {
													addNotification(
														"error",
														"Error while getting passwords from cloud!"
													);
													console.error(
														"Error while decryption:",
														error
													);
												}
											})();
										} else
											addNotification(
												"error",
												"Need to initialize the password manager first!"
											);
										if (debug)
											console.log(
												"Need to initialize the password manager first!"
											);
									}}
								>
									Load Passwords from the Cloud!
								</Button>
							</>
						) : (
							<></>
						)}
					</VStack>
				</Center>
			)}
		</Box>
	);
}

function EditableInput({ value = "", onInputChange = () => {} }) {
	const [password, setPassword] = useState("");

	return (
		<Editable.Root
			display="flex"
			justifyContent="space-between"
			bgColor="whiteAlpha.300"
			borderRadius="0.5rem"
			padding="0.5rem"
			defaultValue={value}
			onValueChange={(e) => {
				setPassword(e.value);
			}}
			onValueCommit={(e) => {
				if (debug) console.log(e);
				onInputChange(password);
			}}
		>
			<Editable.Preview />
			<Editable.Input />
			<Editable.Control>
				<Editable.EditTrigger asChild>
					<IconButton variant="ghost" size="xs">
						<LuPencilLine />
					</IconButton>
				</Editable.EditTrigger>
				<Editable.CancelTrigger asChild>
					<IconButton variant="outline" size="xs">
						<LuX />
					</IconButton>
				</Editable.CancelTrigger>
				<Editable.SubmitTrigger asChild>
					<IconButton variant="outline" size="xs">
						<LuCheck />
					</IconButton>
				</Editable.SubmitTrigger>
			</Editable.Control>
		</Editable.Root>
	);
}
