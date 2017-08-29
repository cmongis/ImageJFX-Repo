"use strict";
var request = require("request");
var spawn = require ("child_process").spawn;
var execSync = require ("child_process").execSync; 
var fs = require ("fs");
var zlib = require ("zlib");
var readline = require("readline");
var events = require("events");
var eventEmitter = new events.EventEmitter();
var js2xml = require("./js2xml.js");
var config = require("./config.js");


var imageJDependencies = [];
var imageJFXDependencies = [];

var imageJFXDependenciesOnly = new Set();

var imageJDone = false;
var imageJFXDone = false;
var statusCode = 200;


module.exports = function (callback) {

    if (! fs.existsSync("public"))
	execSync("mkdir " + "public");
    
    getImageJDependencies(imageJDependencies, config.pathToImageJDependencies, () => eventEmitter.emit("dependencies got"));
    getImageJFXDependencies(imageJFXDependencies, config.pathToImageJFXDependencies, () => eventEmitter.emit("dependencies got"));
    eventEmitter.on("dependencies got", function() {
	if (imageJDone && imageJFXDone)
	    getImageJFXDependenciesOnly(imageJFXDependenciesOnly, () => eventEmitter.emit("list complete"));
    });

    eventEmitter.on("list complete", function() {
	// copies imageJFX dependencies to the main directory
	copyDependencies(imageJFXDependenciesOnly, config.pathToImageJFXDependencies, config.dependenciesDirectory);
	//execSync("cp " + config.pathToImageJFX + " .");
	// Writes the ImageJFX db.xml.gz file
	writeXMLFile(config.dependenciesDirectory, config.finalDatabase, () => eventEmitter.emit("db.xml.gz produced"));
    });

    eventEmitter.on("db.xml.gz produced", function() {
	return callback(statusCode);
    });
		   
};
/**
 * Gets the db.xml file from ImageJ update website.
 * Pushes ImageJ dependencies (without version and extension) into the ImageJDependencies array
 * Emits a "dependencies got" event when it is done.
 * @param {Array} array - The array to contain the dependencies
 * @param {String} source - url of ImageJ"s db.xml.gz file. 
 * @param {Function} callback - the event to emit when the task is done 
 */
function getImageJDependencies (array ,source, callback) {

    // The regex to find plugin names from the ImageJ Dependencies file
    var regex =/plugin filename="jars\/([\_A-Za-z\-]+)([\d\.]*)(.*)\.jar">[\n\s.*]*<version/g;
    // We fetch the db.xml.gz file from the ImageJ update site and unzip it
    var db = request(source).pipe(zlib.createGunzip()).pipe(fs.createWriteStream("tmp"));
    db.on("finish", function () {
	fs.readFile("tmp", function(err, data) {
	    if (err) {
		console.log(err);
		statusCode = 500;
	    }
	    var jars = data.toString().match(regex);
	    jars = jars.map(function(jar) {
		return jar.substring(jar.search("/") + 1, jar.search('>') - 1);
	    });
	    fs.unlinkSync("tmp");
	    imageJDone = true;
	    callback();
	});

    });
};

/**
 * Launches the assembly script.
 * Pushes ImageJFX dependencies into an array. 
 * Emits a "dependencies got" event when it is done.
 * @param {Array} array - the array to contain ImageJFXDependencies
 * @param {String} source - path to assembly"s dependencies directory.
 * @param {Function} callback - the event to emit when the task is done 
 */
function getImageJFXDependencies(array, source, callback) {
    var script = spawn(config.assemblyScript);
    script.stdout.on ("data", (data) => process.stdout.write(data.toString()) );
    script.stderr.on("data",  (data) =>  process.stderr.write(data.toString()) );
    script.on("exit", function (code) {
	if (code != 0) {
	    statusCode = 500;
	    console.log("Server error during assembly");
	}
	console.log("exit code: " + code);
	fs.readdir (source, function (err, files) {
            if(files != null) {
	    files.forEach( function (file) {
		array.push(file);
	    });
            }
	    imageJFXDone = true;
	    callback();
	});
    });
}


/**
 * Extracts the dependencies which are only imageJFX dependencies
 * @param {Set} dest - the set to contain imageJFX dependencies only
 * @param {Function} callback - the event to emit when the task is done 

 */
function getImageJFXDependenciesOnly (dest, callback) {
    // The regex to find the extension and the version number of a dependency.
    var extension = new RegExp(/(\-[\d\.]+)|(\-v[\d\.]+)((-beta-[\d\.]+))*(-*[a-zA-Z0-9]*)*.jar$/);
    getDifferencesWithoutExtension (dest, imageJFXDependencies, imageJDependencies, extension);
    callback();
}


/**
 * Gets the elements which are in a first array and not in the second array without considering their extension (version number and .jar)
 * @param {Set} dest - the set to contain the dependencies
 * @param {Array} arr1 - the first array
 * @param {Array} arr2 - the second array
 * @pattern {string} pattern - the pattern not concerned with the comparison
 */
function getDifferencesWithoutExtension(dest, arr1, arr2, pattern) {
    var flag = 0;
    arr1.forEach (function (string1){
	var n1 = string1.substring(0,pattern.exec(string1).index);
	flag = 0;
	arr2.forEach (function (string2){
	    var n2 = string2.substring(0,pattern.exec(string2).index);
	    if (n1 === n2) 
		flag = 1;
	});
	if (flag == 0)
	    dest.add(string1);
    });
};

/**
 * Gets dependencies from imageJFXDependenciesOnly array and uses them to generate the compressed xml database file
 * @param {String} from - the directory containing the dependencies
 * @param {String} to - the name of the uncompressed file to produce
 */
function writeXMLFile(from, to, callback) {
    imageJFXDependenciesOnly.forEach(function(dependency) {
	js2xml.addPlugin(from + dependency);
    });

    js2xml.addPlugin(config.imageJFXCore);
    fs.writeFileSync(to,js2xml.parse(js2xml.pluginRecords));
    appendAtTheTop(to, config.doctype);
    //We are gzipping the db.xml
    fs.createReadStream(to).pipe(zlib.createGzip()).pipe(fs.createWriteStream(to + ".gz"))
    	.on("close", function () {
    	    fs.unlinkSync(to);
	    var data = {};
	    data.jars = js2xml.checksums;
	    data.lastTimeBuilt = Date.now();
	    fs.writeFileSync(config.data, JSON.stringify(data));
	    callback();
	});
};

/**
 * Copies some files from a directory to an other, using an array to filter which files to copy
 * @param {Array} filter - The array used to filter.
 * @param {String} from - The source directory
 * @param {String} to - The target directory (without "/")
 */
function copyDependencies (filter, from,to) {
    if (! fs.existsSync(to))
	execSync("mkdir " + to);
    filter.forEach( function (dependency) {
	execSync("cp " + from + dependency + " " + to);
    });
};

/**
 * Appends some text at the beginning of a file
 * @param {String} file - the path to the file to append to
 * @param {String} text - the text to append
 */
function appendAtTheTop (file, text) {
    var data = fs.readFileSync(file).toString().split("\n");
    data.splice(0,0, text);
    var text = data.join("\n");

    fs.writeFileSync(file, text);
};

function getLocal (array, source) {
    fs.readdir(source, function(err, files) {
	files.forEach ( function (file) {
	    array.push(file)});
    });
}
