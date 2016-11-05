// Assignment 10
// Student: Kristinn Heiðar Freysteinsson
// Email: kristinnf13@ru.is

const express = require("express");
const ObjectId = require('mongoose').Types.ObjectId;
const entities = require("./../entities/entities");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/*
POST /api/my/punches - 30%
Creates a new punch for the "current user" for a given company, the company id should be passed in via the request body.
This endpoint is authenticated using the user token.
Clients sends a request with the Authorization header value. That value is used to authenticate the user. A new document
is created in the app.punches collection with the user_id which owns the token value found in the header.
If the user has collected as many punches as the punchCount value states is required to be given a discount, the
method should return that information in the response: {discount: true} as well as marking the given punches as "used"
in the database (In later implementations, we will probably save this to a separate table and allow the user to collect
the discount at any time, i.e. not necessarily immediately, but this is not required at the time).
Otherwise the server should return with a status code 201 and return the newly created punch id back.
*/
app.post("/", (req, res) => {
	if(!req.headers.hasOwnProperty("authorization")) {
		return res.status(401).send("Not authorization token included");
	}
	var authToken = req.headers.authorization;

	if(!req.body.hasOwnProperty("company_id")) {
		return res.status(412).send("Post syntax is incorrect. Message body has to include a 'company_id' field!");
	}
	var cId = req.body.company_id;
	if(cId.length !== 24) {
		return res.status(412).send("The 'company_id' is a string of 24 hex characters");
	}

	entities.Users.findOne({"token": authToken}, (uerr, user) => {
		if(uerr) {
			console.log(uerr); // Here a logger should be added
			return res.status(500).send("An error occurred while fetching a user from the database.");
		}

		if(user === null) {
			return res.status(401).send("No user is found by the token");
		}

		entities.Companies.findOne({"_id": new ObjectId(cId)}, (cerr, company) => {
			if(cerr) {
				console.log(uerr); // Here a logger should be added
				return res.status(500).send("An error occurred while fetching a company from the database.");
			}
			if(company === null) {
				return res.status(404).send("No company found with id: " + cId);
			}

			entities.Punches.find({"company_id": cId, "user_id": user._id, "used": false}, (perr, punches) => {
				if(perr) {
					console.log(uerr); // Here a logger should be added
					return res.status(500).send("An error occurred while fetching punches from the database.");
				}

				if(punches.length < (company.punchCount - 1)) {
					entities.Punches.create({"company_id": cId, "user_id": user._id}, (createErr, punch) => {
						if(createErr) {
							console.log(uerr); // Here a logger should be added
							return res.status(500).send("Something went wrong with adding a punch to the database");
						}
						res.status(201).json({punch_id: punch._id});
					});
				} else {
					punches.forEach((p) => {
						p.used = true;
						p.save();
					});
					entities.Punches.create({"company_id": cId, "user_id": user._id, "used": true}, (createErr, punch) => {
						if(createErr) {
							console.log(uerr); // Here a logger should be added
							return res.status(500).send("Something went wrong with adding a punch to the database");
						}
						res.status(201).json({discount: true});
					});
				}
			});
		});
	});
});

module.exports = app;
