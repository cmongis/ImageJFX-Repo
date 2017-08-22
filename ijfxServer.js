"use strict";
var http = require ("http");
var express = require("express");
var config = require("./config");
var path = require("path");
var app = express();
var exphbs = require("express-handlebars");
var fs = require("fs");
var exec = require ("child_process").execSync;


app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

app.get("/jars", function(request, response) {
    fs.readdir(__dirname + "/jars", function(err, files) {
	if (err){console.log(err);}
	else {
	    files = files.map(function(file) {
		var check = exec("java SHA1 " + __dirname + "/jars/" + file).toString();
		return {filename: file, checksum: check};
	    });
	    var jars = { prop: files};
	    response.render("jars", jars);}
    });
});

app.get("/jars/:jarName", function(request, response) {
    
    var name = request.params.jarName;
    if (name.indexOf('-') > -1 )
	var jarName = name.substring(0, name.lastIndexOf('-'));
    else
	var jarName = name;
    response.sendFile(__dirname + "/jars/" + jarName);
});

app.get("/imagejfx-core-*jar*", function(request, response) {
    var name = request.params.exec;
    var reg = /imagejfx-core-/;
    if (reg.test(name))
	name = name.substring(0, name.lastIndexOf('-'));
    response.sendFile(__dirname + "/" + name);
});

app.get("/db.xml.gz", function(request, response) {
    response.sendFile(__dirname + "/db.xml.gz");
});



app.get("/update", function (request, response) {
    var update = require("./updater");
    update(function(statusCode){
	response.sendStatus(statusCode);


	console.log("updating done.");
    });
});


app.use(express.static(path.join(__dirname, "public")));

// app.use(function(request, response, next){
//     response.setHeader("Content-Type", "text/plain");
//     response.status(404).send("The page you are asking for does not exist");

// });

console.log("The server is listening on: " + config.port);
app.listen(config.port);
