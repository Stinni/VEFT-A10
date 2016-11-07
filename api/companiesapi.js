// Assignment 10
// Student: Kristinn Heiðar Freysteinsson
// Email: kristinnf13@ru.is

const express = require("express");
const ObjectId = require('mongoose').Types.ObjectId;
const entities = require("./../entities/entities");
const bodyParser = require("body-parser");
const elasticsearch = require("elasticsearch");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const client = new elasticsearch.Client({
	host: "localhost:9200",
	log: "error"
});

const adminToken = "zeAdminRules";

/*
GET /api/companies - 10%
Fetches a list of companies that have been added to MongoDB. This endpoint should not use any
authentication. If no company has been added this endpoint should return an empty list.
*/
app.get("/", (req, res) => {
	entities.Companies.find((err, docs) => {
		if(err) {
			console.log(err); // Here a logger should be added
			return res.status(500).send("An error occurred while fetching companies from the database.");
		}
		res.json(docs);
	});
});

/*
POST /api/companies - 15%
Allows administrators to add new companies to MongoDB. Authenticated using the Authorization header,
using the hardcoded admin token.
*/
app.post("/", (req, res) => {
	if(!req.headers.hasOwnProperty("authorization") || req.headers.authorization !== adminToken) {
		return res.status(401).send("Not authorized");
	}

	if(!req.body.hasOwnProperty("name")) {
		return res.status(412).send("Post syntax is incorrect. Message body has to include a 'name' field!");
	}

	var name = req.body.name;
	if(name === "" || name === null) {
		return res.status(412).send("Post syntax is incorrect. Company name has to be included!");
	}

	var pCount = null;
	if(req.body.hasOwnProperty("punchCount")) {
		pCount = parseInt(req.body.punchCount);
		if(isNaN(pCount)) {
			pCount = null; // We'll still create the company, just with the default value (10)
		}
	}

	if(pCount === null) {
		entities.Companies.create({"name": name}, (err, doc) => {
			if(err) {
				return res.status(500).send("Something went wrong with adding the company to the database");
			}
			res.status(201).json({company_id: doc._id});
		});
	} else {
		entities.Companies.create({"name": name, "punchCount": pCount}, (err, doc) => {
			if(err) {
				if(err.name === "ValidationError") {
					return res.status(500).send("ValidationError occurred. Probably because of invalid value for punchCount. It can't be lower than 2!");
				}
				return res.status(500).send("Something went wrong with adding the company to the database");
			}
			res.status(201).json({company_id: doc._id});
		});
	}
});

/*
GET /api/companies/:id - 10%
Fetches a given company that has been added to MongoDB by id. This endpoints should return a single JSON document if found.
If no company is found by the id then this endpoint should return response with status code 404.
No authentication is needed for this endpoint.
*/
app.get("/:id", (req, res) => {
	var id = req.params.id;
	if(id.length !== 24) {
		return res.status(412).send("The company Id is a string of 24 hex characters");
	}

	entities.Companies.findOne({"_id": new ObjectId(id)}, (err, doc) => {
		if(err) {
			return res.status(500).send("An error occurred while fetching a company from the database.");
		}
		if(doc === null) {
			return res.status(404).send("No company found with id: " + id);
		}
		res.json(doc);
	});
});

module.exports = app;
