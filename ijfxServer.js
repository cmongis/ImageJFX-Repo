'use strict';
var http = require ("http");
var express = require("express");
var config = require("./config");

var app = express();

app.use("/jars", express.static(__dirname + "/public/lib"));
app.use("/", express.static(__dirname + "/public"));

app.get("/update", function (request, response) {
    var update = require("./serverUtils.js");
    update(function(statusCode){
	response.sendStatus(statusCode);
	console.log("updating done.");
    });
});

console.log("The server is listening on: " + config.port);
app.listen(config.port);
