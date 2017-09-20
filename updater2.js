/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var updater = require("./updater-utils.js");
var Seq = require("seq");
var config = require("./config.js");
var exec = require("child_process").exec;

var spawn = require("child_process").spawn;

var Repository = require("./repository.js");

var repo = new Repository(__dirname);

module.exports = function (callback, progress) {
    var response = {
        sdtout: ""
        , stderr: ""
    };

    if (progress == undefined) {
        progress = console.log;
    }
    ;

    Seq()
            // executing the assembly script that will build the object
            .seq(function () {
                //exec("bash assembly.sh", this);

                //this();
                //return;




                var cmd = spawn("bash", ["assembly.sh"])

                var displayOutput = function (output) {
                    progress(output.toString());
                };

                cmd.stdout.on("data", displayOutput);
                cmd.stderr.on("data", displayOutput);

                var cb = this;

                cmd.on("exit", function (code) {
                    if (code == 0) {
                        cb();
                    } else {
                        cb(code);
                    }
                });
            })
            .catch(function (err, output) {
                callback(err, output);
            })
            .seq(function (err, stdout, stderr) {
                response.stdout = stdout;
                response.stderr = stderr;

                exec("bash rm jars/*");

                this();
            })
            // first we get the list of jars of the remote
            //.par(function () {
            //    updater.getRemote(config.pathToImageJDependencies, this);
            //})
            // then we the the list of jars that was compiled
            .seq(function () {
                updater.getLocal(__dirname + "/" + config.pathToImageJFXDependencies, this);
            })
            // in case of error, we just print it
            .catch(function (err) {
                console.log(err);
                callback(err);
            })
            // we copy the file to the destination
            .seq(function (local) {



                // we filter the local list of jar to contain only jars
                local = local.filter(function (item) {

                    return item.indexOf(".jar") != -1;

                });

                //var toCopy = updater.compare(remote, local);
                var toCopy = local;
                updater.copyList(toCopy, config.pathToImageJFXDependencies, config.dependenciesDirectory);

                this();

            })
            .seq(repo.read)
            .seq(repo.checkCurrentJars)
            .seq(repo.write)
            .seq(function () {
                console.log("Build success");
                callback(undefined);
            })
            ;

};