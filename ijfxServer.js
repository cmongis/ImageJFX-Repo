"use strict";
var http = require ("http");
var express = require("express");
var config = require("./config");

var app = express();

// app.use("/jars", express.static(__dirname + "/public/lib"));
// app.use("/", express.static(__dirname + "/public"));

app.use(express.static(__dirname + "/jars"));
app.use(express.static(__dirname + "/"));


app.get("/update", function (request, response) {
    var update = require("./serverUtils.js");
    update(function(statusCode){
	response.sendStatus(statusCode);
	console.log("updating done.");
    });
});

app.use(function(req, res, next){
    res.setHeader("Content-Type", "text/plain");
    res.status(404).send("The page you are asking for does not exist");

});

console.log("The server is listening on: " + config.port);
app.listen(config.port);
