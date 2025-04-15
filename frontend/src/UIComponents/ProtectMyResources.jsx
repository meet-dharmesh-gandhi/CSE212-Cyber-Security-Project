import {
	Box,
	Center,
	FileUpload,
	Icon,
	Button,
	VStack,
	Text,
	Switch,
	IconButton,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { LuUpload } from "react-icons/lu";
import { FaFileAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import {
	PasswordInput,
	PasswordStrengthMeter,
} from "../components/ui/password-input";
import { IoMdCloudDownload } from "react-icons/io";
import { TiTick } from "react-icons/ti";
import { debug } from "../constants/Mode";
import {
	deleteFileFromCloudinary,
	downloadFilesFromCloudinary,
	uploadFilesToCloudinary,
} from "../Functions/ProtectResourcesFunctions";
import { backendUrl } from "../constants/Urls";

export default function ProtectMyResources() {
	const [userPassword, setUserPassword] = useState("");
	const [passwordStrength, setPasswordStrength] = useState(0);
	const [files, setFiles] = useState([]);
	const [uploadFiles, setUploadFiles] = useState(true);
	const [userFiles, setUserFiles] = useState([]);
	const [selected, setSelected] = useState([]);

	const getUserFiles = useCallback(async () => {
		const userFiles = await fetch(backendUrl + "/get-user-files", {
			method: "get",
			credentials: "include",
		})
			.then((data) => data.json())
			.then((data) => JSON.parse(data.data))
			.catch((err) => {
				console.error("Error getting user files");
				return {};
			});
		return userFiles;
	}, []);

	useEffect(() => {
		(async () => {
			const fetchedUserFiles = await getUserFiles();
			setUserFiles(fetchedUserFiles);
		})();
	}, [getUserFiles]);

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
			<Box width="100%" display="flex" justifyContent="flex-end">
				<Switch.Root
					size="lg"
					onCheckedChange={() => setUploadFiles((prev) => !prev)}
				>
					<Switch.Label>
						{uploadFiles ? "Upload Files" : "Download Files"}
					</Switch.Label>
					<Switch.HiddenInput />
					<Switch.Control />
				</Switch.Root>
			</Box>
			<Box
				display="grid"
				gridTemplateColumns="1fr 1fr"
				width="100%"
				height="100%"
			>
				{uploadFiles ? (
					<ShowUploadFilesUI setFiles={setFiles} />
				) : (
					<ShowDownloadFilesUI
						files={userFiles}
						selected={selected}
						setSelected={setSelected}
						setUserFiles={setUserFiles}
					/>
				)}
				<Center>
					<VStack width="90%" gap="2em">
						<Text>Enter Your Password</Text>
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
							onClick={async (e) => {
								if (!e.isTrusted) return;
								if (files.length <= 0 && uploadFiles)
									return console.log("No files found!");
								if (selected.length <= 0 && !uploadFiles)
									return console.log("No files found!");
								if (passwordStrength < 3)
									return console.log("Too weak password!");
								console.log(files);
								console.log(userPassword);
								if (uploadFiles) {
									const uploaded =
										await uploadFilesToCloudinary(
											files,
											userPassword
										);
									console.log(uploaded);
								} else {
									downloadFilesFromCloudinary(
										selected,
										userPassword
									);
								}
							}}
						>
							{uploadFiles
								? "Upload My Files!"
								: "Download My Files!"}
						</Button>
					</VStack>
				</Center>
			</Box>
		</Box>
	);
}

function ShowDownloadFilesUI({
	files = [],
	selected,
	setSelected,
	setUserFiles,
}) {
	return (
		<Box width="100%" height="100%" padding="2rem">
			<VStack>
				{files.map((file, index) => {
					return (
						<Box
							width="100%"
							display="flex"
							justifyContent="space-between"
							bgColor={
								selected.includes(file)
									? "green.400"
									: "gray.950"
							}
							key={index}
							_hover={{
								backgroundColor: selected.includes(file)
									? "green.600"
									: "gray.900",
							}}
							paddingLeft="1rem"
							borderRadius="0.5rem"
						>
							<Box display="flex" alignItems="center">
								<Box
									display="flex"
									gap="1rem"
									alignItems="center"
									maxWidth="10rem"
									minWidth="10rem"
								>
									<FaFileAlt />
									<Text>
										{file.fileName}.{file.extension}
									</Text>
								</Box>
								<Text color="gray.500" marginLeft="1rem">
									{file.size ?? ""}
								</Text>
							</Box>
							<Box>
								<IconButton
									size="lg"
									color="blue.500"
									bgColor="transparent"
									_hover={{
										backgroundColor: selected.includes(file)
											? "green.500"
											: "gray.800",
									}}
									borderRadius="0.5rem"
									onClick={() =>
										setSelected((prev) =>
											prev.some((ele) => ele === file)
												? prev.filter(
														(ele) => file !== ele
												  )
												: [...prev, file]
										)
									}
								>
									{selected.includes(file) ? (
										<TiTick />
									) : (
										<IoMdCloudDownload />
									)}
								</IconButton>
								<IconButton
									size="lg"
									color="red"
									bgColor="transparent"
									_hover={{
										backgroundColor: "gray.800",
									}}
									borderRadius="0.5rem"
									onClick={async () => {
										const deleted =
											await deleteFileFromCloudinary(
												file
											);
										console.log(deleted);
										if (deleted) {
											setUserFiles((prev) => {
												const newFiles = prev.filter(
													(ele) => file !== ele
												);
												console.log(newFiles);
												return newFiles;
											});
										}
									}}
								>
									<MdDelete />
								</IconButton>
							</Box>
						</Box>
					);
				})}
			</VStack>
		</Box>
	);
}

function ShowUploadFilesUI({ setFiles }) {
	return (
		<Center height="100">
			<FileUpload.Root
				maxW="xl"
				alignItems="stretch"
				maxFiles={10}
				directory
				maxFileSize={10 * 1024 * 1024}
				onFileChange={(files) => {
					setFiles(files.acceptedFiles);
				}}
			>
				<FileUpload.HiddenInput />
				<FileUpload.Dropzone>
					<Icon size="md" color="fg.muted">
						<LuUpload />
					</Icon>
					<FileUpload.DropzoneContent>
						<Box>Drag and drop files here</Box>
						<Box>OR</Box>
						<Box>Click to select a file</Box>
						<Box color="fg.muted">
							Maximum File Size Allowed: 10MB
						</Box>
					</FileUpload.DropzoneContent>
				</FileUpload.Dropzone>
				<FileUpload.ItemGroup>
					<FileUpload.Context>
						{({ acceptedFiles }) => {
							return (
								<Box
									overflowY="auto"
									maxHeight="30vh"
									bgColor="gray.800"
									padding="2em"
									borderRadius="0.5rem 0.5rem 0.5rem 0.5rem"
									display={
										acceptedFiles.length > 0
											? "block"
											: "none"
									}
								>
									<VStack gap="2em">
										{acceptedFiles.map((file) => (
											<FileUpload.Item
												key={file.name}
												file={file}
												borderRadius="1em"
											>
												<FileUpload.ItemPreview />
												<Box
													display="flex"
													width="100%"
													justifyContent="space-between"
													alignItems="center"
												>
													<Box>
														<FileUpload.ItemName />
														<FileUpload.ItemSizeText />
													</Box>
													<Box>
														<FileUpload.ItemDeleteTrigger
															height="1.5rem"
															width="1.5rem"
															borderRadius="0.2em"
															_hover={{
																bg: "gray.800",
															}}
														/>
													</Box>
												</Box>
											</FileUpload.Item>
										))}
									</VStack>
								</Box>
							);
						}}
					</FileUpload.Context>
				</FileUpload.ItemGroup>
			</FileUpload.Root>
		</Center>
	);
}
