// Assignment 10
// Student: Kristinn Heiðar Freysteinsson
// Email: kristinnf13@ru.is

const express = require("express");
const users = require("./usersapi");
const companies = require("./companiesapi");
const punches = require("./punchesapi");

const api = express();

api.use("/api/users", users);
api.use("/api/companies", companies);
api.use("/api/my/punches", punches);

module.exports = api;
