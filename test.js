/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */





var Repository = require("./repository.js");
var xml2js = require("xml2js");
var fs = require("fs");
var Seq = require("seq");
var zlib = require("zlib");
var fspath = require("./path.js");

console.log(fspath("/foo","bar"));
console.log(fspath("/foo/","/bar"));
console.log(fspath("/foo","/bar","hello.txt"));
console.log(fspath("/foo","bar","/hello.txt"));


var updater = require("./updater2.js");
updater(function() {
    console.log("it works");
});

/*
repo    .read(function(db) {
        
        
        //console.log(repo.getId("jars/ijfx-core-1.1.jar"));
        //console.log(repo.getPlugin("imagejfx-core"));
        repo.checkCurrentJars(repo.write);
        //repo.write();
});*/