const mongoose = require("mongoose");
const { Schema } = mongoose;

const LogsManagerSchema = new Schema({
	username: { type: String, required: true },
	activityType: { type: String, required: true },
	activityDescription: { type: String, required: true },
});

module.exports = {
	logs: mongoose.model("logs", LogsManagerSchema),
};
