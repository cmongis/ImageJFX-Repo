/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var updater = require("./updater2.js");
var Seq = require("seq");
var config = require("./config.js");
var exec = require("child_process").exec;

var response = {

    output: ""

}

Seq()


        .seq(function () {

            //exec("bash assembly.sh", this);
            this();

        })
        .catch(function (err, output) {
            console.log(err, output)
        })

        .seq(function (result, output) {

            //console.log(result, output);
            response.output = output;
            this();
        })
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
        .seq(function (remote, local) {

           
            
            // we filter the local list of jar to contain only jars
            local = local.filter(function (item) {

                return item.indexOf(".jar") != -1;

            });

            //
            var toCopy = updater.compare(remote, local);
            console.log(toCopy);
            updater.copyList(toCopy, config.pathToImageJFXDependencies, config.dependenciesDirectory);

            updater.writeXMLFile("jars/", toCopy, "db.xml", this);

        })
        .seq(function () {

            console.log("Build success");
        })

        ;






