// Assignment 10
// Student: Kristinn Heiðar Freysteinsson
// Email: kristinnf13@ru.is

const express = require("express");
const entities = require("./../entities/entities");
const bodyParser = require("body-parser");
const uuid = require("node-uuid");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const adminToken = "zeAdminRules";

/*
GET /api/users - 20%
Returns a list of all users that are in the MongoDB. This endpoint is not authenticated and the token
value within the user document must be removed from the document before it is written to the response.
*/
app.get("/", (req, res) => {
	entities.Users.find((err, docs) => {
		if(err) {
			console.log(err); // Here a logger should be added
			return res.status(500).send("An error occurred while fetching users from the database.");
		}

		var tmp = [];
		docs.forEach((p) => {
			tmp.push({
				_id: p._id,
				name: p.name,
				gender: p.gender
			});
		});
		res.json(tmp);
	});
});

/*
POST /api/users - 15%
Allows administrators to add a new user. The client must provide the name and gender properties. Otherwise
similar to the method which adds a company, except that the response contains the token of the newly created user.
*/
app.post("/", (req, res) => {
	if(!req.headers.hasOwnProperty("authorization") || req.headers.authorization !== adminToken) {
		return res.status(401).send("Not authorized");
	}

	if(!req.body.hasOwnProperty("name")) {
		return res.status(412).send("Post syntax is incorrect. Message body has to include a 'name' field!");
	}
	var name = req.body.name;

	if(!req.body.hasOwnProperty("gender")) {
		return res.status(412).send("Post syntax is incorrect. Message body has to include a 'gender' field!");
	}
	var gender = req.body.gender;

	entities.Users.create({"name": name, "token": uuid.v1(), "gender": gender}, (err, doc) => {
		if(err) {
			if(err.name === "ValidationError") {
				return res.status(412).send("ValidationError occurred. Either name wasn't included or the gender isn't formatted right");
			}
			console.log(err); // Here a logger should be added
			return res.status(500).send("Something went wrong with adding the user to the database");
		}
		res.status(201).json({user_id: doc._id, token: doc.token});
	});
});

module.exports = app;
