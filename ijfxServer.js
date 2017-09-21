"use strict";
var http = require("http");
var express = require("express");
var config = require("./config");
var path = require("path");
var app = express();
var exphbs = require("express-handlebars");
var fs = require("fs");
var execSync = require("child_process").execSync;
var log = require("color-log");

var exec = function (cmd) {
    log.mark(cmd);
    console.log(execSync(cmd));
}
var bodyParser = require("body-parser");
var Seq = require("seq");

var updater = require("./updater2.js");


var fspath = require("./path.js");

console.log("Test java...");
try {
    exec("java -version");
    exec("javac -version")
} catch (e) {
    console.log("Error: java not present");
    process.exit(2);
}
log.info("Java [OK]");

log.info("Testing SHA");


try {
    if (fs.existsSync("SHA1.class") == false) {
        console.log("Compiling SHA1...");
        console.log(exec("javac " + fspath(__dirname, "SHA1.java")).toString());
        console.log("Compilation succesful");

    }
} catch (e) {
    lor.error("Error when compiling");
    process.exit(2);
}
console.log("SHA ready.");

try {
    console.log("Testing repo");

    console.log("Making sure directory exists", config.repo);
    exec("mkdir -p " + fspath(config.repo));



} catch (e) {
    console.log("Error when creating repository");

}


console.log("Starting server");

app.engine("html", exphbs({defaultLayout: "main", extname: ".html"}));
app.set("view engine", "html");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.get("/", function (request, response) {


    new Seq()
            // let's read the file of the jar directory

            .seq(function () {
                fs.readdir(fspath(config.repo, "jars"), this);
            })
            .catch(function (err) {
                
                
               
                
            })
            // finally we render the page
            .seq(function (jars) {

                if(jars == undefined) {
                    jars = [];
                }

                var files = [{
                        filename: "db.xml.gz"
                        , checksum: "None"
                        , url: "db.xml.gz"
                    }
                ];

                jars = jars

                        .map(function (f) {

                            return {
                                filename: f
                                , checksum: "Unvailable"
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
            response
                    .status(200)
                    .send(new Date(data.lastTimeBuilt).toISOString());


        } else {
            response
                    .status(500)
                    .send("Error when building");
        }

    });


});

app.get("/jars/:jarName", function (request, response) {

    var name = request.params.jarName;
    if (!name.endsWith(".jar"))
        var jarName = name.substring(0, name.lastIndexOf('-'));
    else
        var jarName = name;
    response.sendFile(fspath(config.repo, "jars/", jarName));
});

app.get("/:file", function (request, response) {

    var filename = request.params.file;
    if (fs.existsSync(fspath(config.repo, filename))) {
        response.sendFile(fspath(config.repo, filename))
    } else {
        response.sendStatus(404);
    }
});


//serving the client-side files
app.use(express.static(path.join(__dirname, "public")));

// app.use(function(request, response, next){
//     response.setHeader("Content-Type", "text/plain");
//     response.status(404).send("The page you are asking for does not exist");

// });

console.log("The server is listening on: " + config.port);
app.listen(config.port);
