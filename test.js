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
var repo = new Repository("./", "./jars");
repo    .read(function(db) {
        
        
        //console.log(repo.getId("jars/ijfx-core-1.1.jar"));
        //console.log(repo.getPlugin("imagejfx-core"));
        //repo.checkCurrentJars();
        repo.write();
});