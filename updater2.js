/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

"use strict";
var request = require("request");
var spawn = require("child_process").spawn;
var execSync = require("child_process").execSync;
var fs = require("fs");
var zlib = require("zlib");
var readline = require("readline");
var events = require("events");
var eventEmitter = new events.EventEmitter();
var js2xml = require("./js2xml.js");
var config = require("./config.js");

var extension = new RegExp(/(\-[\d\.]+)|(\-v[\d\.]+)((-beta-[\d\.]+))*(-*[a-zA-Z0-9]*)*.jar$/);


module.exports = {

    getRemote: function (source, callback) {
        var array = [];
        // The regex to find plugin names from the ImageJ Dependencies file
        var regex = new RegExp(/plugin filename="jars\/([\_A-Za-z\-]+)([\d\.]*)(.*)\.jar/);
        // We fetch the db.xml.gz file from the ImageJ update site and unzip it
        var db = request(source).pipe(zlib.createGunzip()).pipe(fs.createWriteStream("tmp"));
        db.on("finish", function () {
            var rd = readline.createInterface({
                input: fs.createReadStream("tmp"),
            });
            rd.on("line", function (line) {
                if (regex.test(line)) {
                    var tmp = regex.exec(line)[0];
                    array.push(tmp.substring(tmp.search("/") + 1));
                }
            });
            rd.on("close", function () {
                fs.unlinkSync("tmp");
                callback(null, array);
            });

        });
    }
    ,
    getLocal: function (source, callback) {
        fs.readdir(source, callback);
    }

    ,
    diff: function (arr1, arr2, pattern, callback) {

        var dest = [];

        var flag = 0;
        arr1.forEach(function (string1) {
            var n1 = string1.substring(0, pattern.exec(string1).index);
            flag = 0;
            arr2.forEach(function (string2) {
                var n2 = string2.substring(0, pattern.exec(string2).index);
                if (n1 === n2)
                    flag = 1;
            });
            if (flag == 0)
                dest.add(string1);
        });
        callback(null, dest);
    }
    , compare: function (remote, local) {

        // transform a name into a easily comparable data structure
        var toJSON = function (jarname) {


            var ext = jarname.match(extension)[0];
            var basename = jarname.substr(0, jarname.indexOf(ext));
            console.log(basename,ext);
            return {
                basename: basename,
                extension: ext
            };
        };

        remote = remote.map(toJSON);
        local = local.map(toJSON);

        var result = local
                .filter(function (localJar) {

                    return remote
                            .filter(function (remoteJar) {
                                return remoteJar.basename == localJar.basename
                            })
                            .length == 0;

                });

        //local.forEach(console.log);
        var toJar = function (datastr) {
            return datastr.basename + datastr.extension + "jar";
        }

        return result.map(toJar);

    }
    , copyList: function (listFile, from, to) {
        if (!fs.existsSync(to))
            execSync("mkdir " + to);
        listFile.forEach(function (dependency) {
            var cmd = "cp " + from + dependency + " " + to;
            execSync(cmd);
        });
    }
};