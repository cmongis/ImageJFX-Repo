/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var updater = require("./updater2.js");
var Seq = require("seq");
var config = require("./config.js");


Seq()   
        // first we get the list of jars of the remote
        .par(function () {
            updater.getRemote(config.pathToImageJDependencies, this)
        })
        // then we the the list of jars that was compiled
        .par(function (array) {
            updater.getLocal(__dirname + "/" + config.pathToImageJFXDependencies, this);
        })
        
        
        // in case of error, we just print it
        .catch(function (err) {
            console.log(err);
        })
        // we copy the file to the destination
        .seq(function(remote,local) {
            
            
            console.log(JSON.stringify(remote.pluginRecords.plugin,null,4));
            
           /*
            var toCopy = updater.compare(remote,local);
            console.log(toCopy);
            updater.copyList(config.pathToImageJDependencies,toCopy,config.dependenciesDirectory);
            */
            })
        
        ;






