"use strict";
var exec = require ("child_process").execSync;
var parser = require ("jsontoxml");
var fs = require("fs"); //Load the filesystem module
module.exports = {
    
    checksums: {},
    
    pluginRecords : {pluginRecords : [] },

    // A plugin has a name and a list of previous versions, including the current one.
    plugin : function (_filename) {
	var toReturn = {
	    name:"plugin", attrs:{"filename": _filename}, children: []
	};
	return toReturn;
    },
    
    // A version is composed of a name, a timestamp and a checksum.
    version : function (_timestamp,_checksum,_filename) {

	var stats = fs.statSync(_filename);
	var toReturn = {
	    name:"version", attrs:{"checksum":_checksum, "timestamp":_timestamp, "filesize": stats.size}
	};
	return toReturn;
    },

    addVersion : function (_plugin,_version){

	var newVersion = this.version(_version.attrs.timestamp, _version.attrs.checksum,_plugin);
	this.pluginRecords.pluginRecords.forEach( function (p) {
	    if (p.attrs.filename == _plugin) p.children.push(_version);
	});
	
    },

    addPlugin : function (_filename){
	this.pluginRecords.pluginRecords.push(this.plugin(_filename));
	var firstVersion = this.version (this.currentTimestamp(), this.performChecksum(_filename),_filename);
	this.addVersion(_filename, firstVersion);
	
    },

    currentTimestamp : function (){
	return new Date(new Date().getTime() - new Date().getTimezoneOffset()*60*1000).toISOString().substr(0,19).replace(/[\-T:]/g,"");
    },

    performChecksum : function (filename) {
	var cmd = "java SHA1 " + filename;
        console.log(cmd);
	var res = exec(cmd).toString();
	res = res.substring(0, res.length - 1);
	this.checksums[filename] = res;
	return res;
    },

    parse : function () {
	return parser(this.pluginRecords);
    }
    


}

