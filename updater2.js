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

var repo = new Repository(config.repo);
var fspath = require("./path.js");


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
            // and clean the repository
            .seq(function () {


                var cmd = spawn("bash", ["assembly.sh", config.repo]);

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
            .seq(function () {
                repo.read(this);
            })
            .seq(function () {
                repo.checkCurrentJars(this);
            })
            .seq(function () {
                repo.write(this);
            })
            .catch(function (err) {
                callback(err);
            })
            .seq(function () {
                console.log("Build success");
                callback();
            })
            ;
            return;
};