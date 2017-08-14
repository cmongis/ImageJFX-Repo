"use strict";
var http = require ("http");
var express = require("express");
var config = require("./config");

var app = express();

// app.use("/jars", express.static(__dirname + "/public/lib"));
// app.use("/", express.static(__dirname + "/public"));

//app.use(express.static(__dirname + "/jars"));
app.get("/jars/:jarName", function(req, res) {

    var name = req.params.jarName;
    var jarName = name.substring(0, name.lastIndexOf('-'));
    res.sendFile(__dirname + "/jars/" + jarName);
});

app.get("/:exec", function(req, res) {
    var name = req.params.exec;
    var reg = /imagejfx-core-/;
    if (reg.test(name))
	name = name.substring(0, name.lastIndexOf('-'));
    res.sendFile(__dirname + "/" + name);
});

app.get("/db.xml.gz", function(req, res) {
    res.sendFile(__dirname + "/db.xml.gz");
});
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
