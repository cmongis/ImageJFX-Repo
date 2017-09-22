/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var request = require("request");
var execSync = require("child_process").execSync;
var fs = require("fs");
var zlib = require("zlib");
var readline = require("readline");
var js2xml = require("./js2xml.js");
var config = require("./config.js");
var xml2js = require("xml2js");
var StringBuilder = require("string-builder");



//var extension = new RegExp(/(\-v?[\d\.]+)|(\-v[\d\.]+)|(\-r\d+)((-beta-[\d\.]+))*(-*[a-zA-Z0-9]*)*.jar$/);

var extension2 = /-(r?v?\d.*)\.jar/;

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

module.exports = {

    getRemote: function (source, callback) {
        var array = [];
        // The regex to find plugin names from the ImageJ Dependencies file
        var regex = /plugin filename="jars\/([\_A-Za-z\-]+)([\d\.]*)(.*)\.jar.*<version.*<\/plugin>/;
        // We fetch the db.xml.gz file from the ImageJ update site and unzip it
        var db = request(source).pipe(zlib.createGunzip()).pipe(fs.createWriteStream("tmp"));
        
        var xml = new StringBuilder();
        
        db.on("finish", function () {
            var rd = readline.createInterface({
                input: fs.createReadStream("tmp"),
            });
            rd.on("line", function (line) {
                
                xml.append(line);
                /*
                if (regex.test(line)) {
                    var tmp = regex.exec(line)[0];
                    array.push(tmp.substring(tmp.search("/") + 1));
                }*/
            });
            rd.on("close", function () {
                fs.unlinkSync("tmp");
                
                xml2js.parseString(xml,function(err,result) {
                    //console.log(JSON.stringify(result,null,3));
                    result = result
                            .pluginRecords
                            .plugin
                            .filter(function(item) {
                                
                                
                                return item.version != undefined && item.version.length > 0;
                            })
                            .map(function(item) {
                        
                        return item.$.filename;
                    })
                            .filter(function(item) {
                                return item.indexOf("jars/") == 0
                    })
                            .map(function(item) {
                                return item.replace("jars/","")
                            });
                    callback(err,result);
                    
                });
                
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


            var m = jarname.match(extension2);
            var ext;
            if(m == null) {
                console.log("Couldn't match "+jarname);
                ext = ".jar";
            }
            else {
                ext = m[0];
            }
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
            return datastr.basename + datastr.extension;
        }

        return result.map(toJar);

    }
    , copyList: function (listFile, from, to) {
        if (!fs.existsSync(to))
            execSync("mkdir " + to);
        listFile.forEach(function (dependency) {
            var cmd = "cp " + from + dependency + " " + to;
            console.log(cmd);
            execSync(cmd);
        });
    },
    writeXMLFile: function(base,list, to, callback) {
    list.forEach(function(dependency) {
	js2xml.addPlugin(base + dependency);
    });
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
            console.log(to,"written.");
	});
}
};
