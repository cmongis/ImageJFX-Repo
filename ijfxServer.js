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

app.get("/", function(request, response) {
    fs.readdir(__dirname, function(err, files) {
	var ijfxJars = {};
	ijfxJars.filenames = files
	    .filter(function(file) { return /imagejfx-core-.*\.jar/.test(file)
				   }).map(function(file) {
				       return {filename: file};
				   });

	ijfxJars.db = "db.xml.gz";
	response.render("homepage", ijfxJars);
    });
});

app.get("/update", function (request, response) {

    var update = require("./updater");
    update(function(statusCode){
	var data = fs.readFileSync("data.json");
	data = JSON.parse(data);
	response.send(new Date(data.lastTimeBuilt).toISOString());
	console.log("updating done.");
    });
});


app.get("/jars", function(request, response) {

    fs.readFile(config.data, function(err, data) {
	var json = JSON.parse(data);
	json = json.jars;
	var list = [];
	for (var file in json) {
	    var files = {};
	    files.filename = file.substring(5);
	    files.checksum = json[file];
	    list.push(files);
	}
	var jars = {prop: list};
	response.render("jars", jars);
    });
});

app.get("/jars/:jarName", function(request, response) {
    
    var name = request.params.jarName;
    if (! name.endsWith(".jar"))
	var jarName = name.substring(0, name.lastIndexOf('-'));
    else
	var jarName = name;
    response.sendFile(__dirname + "/jars/" + jarName);
});

app.get("/:file", function(request, response) {
    var filename = request.params.file;
    if (/imagejfx-core-.*jar.*/.test(filename)) {
	if (! filename.endsWith("jar")) 
	    filename = filename.substring(0, filename.lastIndexOf('-'));
	response.sendFile(__dirname + "/" + filename);
    }
    else if (filename === "db.xml.gz") 
	response.sendFile(__dirname + "/" + filename);
    else
	response.sendStatus(404);
});


//serving the client-side files
app.use(express.static(path.join(__dirname, "public")));

// app.use(function(request, response, next){
//     response.setHeader("Content-Type", "text/plain");
//     response.status(404).send("The page you are asking for does not exist");

// });

console.log("The server is listening on: " + config.port);
app.listen(config.port);
