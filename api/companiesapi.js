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

const ADMIN_TOKEN = "zeAdminRules";

/*
POST /companies - 20%
The route should be used to create new companies in Punchy.
The body data which client can post should be on the following form.
{
    name: String representing the company name,
    punchCount: The number of punches a user must collect in order to get a discount
    description: String represetning description for the company 
} 
This endpoint should be authorized with a token named ADMIN_TOKEN known by clients and server.
The ADMIN_TOKEN secret can be hard-coded in the server.
The following preconditions must be implemented in this endpoint.
- If ADMIN_TOKEN is missing or is incorrect the server responds with status code 401.
- If content-type in the request header is not application/json then this endpoint should answer with status code 415.
- If a company with the same name exists, then we answer with status code 409.
- If preconditions are met then the company should be written to MongoDB and to ElasticSearch.
  Note that the id of the document in ElasticSearch should contain the same id as the document within MongoDB.
  This endpoint should then answer with status code 201 and the response body should include a Json document
  named id and should have id of the newly created company as value.
*/
app.post("/", (req, res) => {
	if(!req.headers.hasOwnProperty("authorization") || req.headers.authorization !== ADMIN_TOKEN) {
		return res.status(401).send("Not authorized!");
	}

	if(!req.is('application/json')) { // bodyparser.json 
		return res.status(415).send("Json format expected!");
	}

	if(!req.body.hasOwnProperty("name")) {
		return res.status(412).send("Post syntax is incorrect. Message body has to include a 'name' field!");
	}
	var name = req.body.name;
	if(name === "") {
		return res.status(412).send("Post syntax is incorrect. Company name has to be included!");
	}

	var pCount;
	if(req.body.hasOwnProperty("punchCount")) {
		pCount = parseInt(req.body.punchCount);
		if(isNaN(pCount)) {
			pCount = 10; // We'll still create the company, just with the default value (10)
		}
	} else {
		return res.status(412).send("Post syntax is incorrect. Message body has to include a 'punchCount' field!");
	}

	if(!req.body.hasOwnProperty("description")) {
		return res.status(412).send("Post syntax is incorrect. Message body has to include a 'description' field!");
	}
	var description = req.body.description;

	entities.Companies.findOne({"name": name}, (ferr, fdoc) => {
		if(ferr) {
			return res.status(500).send("An error occurred while fetching a company from the database.");
		}
		if(fdoc) {
			return res.status(409).send("A company with that name already exists!");
		}
		entities.Companies.create({"name": name, "punchCount": pCount, "description": description}, (err, doc) => {
			if(err) {
				if(err.name === "ValidationError") {
					return res.status(500).send("ValidationError - Probably because of invalid value for punchCount. It can't be lower than 2!");
				}
				return res.status(500).send("Something went wrong with adding the company to the database");
			}

			const data = {
				"company_id": doc._id.toString(),
				"name": name,
				"punchCount": pCount,
				"description": description
			};

			client.index({
				"index": "companies",
				"type": "company",
				"id": doc._id.toString(),
				"body": data
			}, (eerr, edoc) => {
				if(eerr) {
					console.log(eerr);
					return res.status(500).send("Something went wrong with adding an index to elasticsearch");
				}
				return res.status(201).json({id: doc._id});
			});
		});
	});
});

/*
GET /companies[?page=N&max=N&search=Q] - 60%
Endpoint for fetching list of companies that have been added to Punchy. The companies should be
fetched from ElasticSearch (note: not from MongoDB!). This endpoint should return a list of Json
objects with the following fields:
id
name
Other fields should be excluded.

This endpoint accepts three request parameters, page, max and search. If they are not presented
they should be defaulted by 0, 20 and "" respectively. The page and max parameters should control
the pagination in Elasticsearch and allow the client to paginate the result. The search parameter
should allow the client to filter the list based on the company name, or the company description.

The list should be ordered alphabetically by the company name.
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
