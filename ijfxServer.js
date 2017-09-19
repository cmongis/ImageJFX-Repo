"use strict";
var http = require("http");
var express = require("express");
var config = require("./config");
var path = require("path");
var app = express();
var exphbs = require("express-handlebars");
var fs = require("fs");
var exec = require("child_process").execSync;
var bodyParser = require("body-parser");
var Seq = require("seq");

var updater = require("./updater2.js");

app.engine("html", exphbs({defaultLayout: "main", extname: ".html"}));
app.set("view engine", "html");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.get("/", function (request, response) {


    new Seq()
            // let's read the file of the jar directory

            .par(function () {
                fs.readdir(__dirname + "/jars", this);
            })
            // now the file containing all the checksums
            .par(function () {
                fs.readFile(config.data, this);
            })
            // finally we render the page
            .seq(function (jars, json) {

                json = JSON.parse(json);

                var files = [{
                        filename: "db.xml.gz"
                        , checksum: "None"
                        , url: "db.xml.gz"
                    }
                ];

                jars = jars

                        .map(function (f) {
                            console.log(json["jars/" + f]);
                            return {
                                filename: f
                                , checksum: json.jars["jars/" + f]
                                , url: "jars/" + f
                            };

                        })
                        .filter(function (d) {
                            return d.checksum != undefined;

                        });

                files.push.apply(files, jars);
                response.render("homepage", {
                    filenames: files
                    , db: "db.xml.gz"
                });
            });
    /*
     fs.readdir(__dirname, function (err, files) {
     var ijfxJars = {};
     ijfxJars.filenames = files
     .filter(function (file) {
     return /imagejfx-core-.*\.jar/.test(file)
     }).map(function (file) {
     return {filename: file};
     });
     
     ijfxJars.db = "db.xml.gz";
     response.render("homepage", ijfxJars);
     });*/
});

app.post("/update", function (request, response) {

    console.log(request.body);
    
    
    
    if (request.body.password != config.pwd) {


        response
                .status(403)
                .send("Wrong password");
        return;

    }


    updater(function (err, result) {


        if (err == undefined || err == null) {
            var data = fs.readFileSync(config.data);
            data = JSON.parse(data);
            response
                    .status(200)
                    .send(new Date(data.lastTimeBuilt).toISOString());


        } else {
            response
                    .status(500)
                    .send("Error when building");
        }

    });

    /*
     update(function (statusCode) {
     var data = fs.readFileSync(config.data);
     data = JSON.parse(data);
     response.status(statusCode).send(new Date(data.lastTimeBuilt).toISOString());
     });*/



});


app.get("/jars", function (request, response) {

    fs.readFile(config.data, function (err, data) {
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

app.get("/jars/:jarName", function (request, response) {

    var name = request.params.jarName;
    if (!name.endsWith(".jar"))
        var jarName = name.substring(0, name.lastIndexOf('-'));
    else
        var jarName = name;
    response.sendFile(__dirname + "/jars/" + jarName);
});

app.get("/:file", function (request, response) {
    var filename = request.params.file;
    if (/imagejfx-core-.*jar.*/.test(filename)) {
        if (!filename.endsWith("jar"))
            filename = filename.substring(0, filename.lastIndexOf('-'));
        response.sendFile(__dirname + "/" + filename);
    } else if (filename === "db.xml.gz")
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
