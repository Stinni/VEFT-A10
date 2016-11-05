// Assignment 10
// Student: Kristinn Heiðar Freysteinsson
// Email: kristinnf13@ru.is

const mongoose = require("mongoose");
const api = require("./api/api");
const db = "localhost/app";
const port = 4000;

mongoose.connect(db);
mongoose.connection.once("open", () => {
	console.log("\x1b[36m" + "Connected to database: " + db + "\x1b[0m");
	api.listen(port, () => {
		console.log("\x1b[31m" + "Web server started on port: " + port + "\x1b[0m");
	});
});
