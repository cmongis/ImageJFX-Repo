/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var Seq = require("seq");
var spawn = require("child_process").spawn;
var exec = require("child_process").exec;
var fs = require("fs");
var xml2js = require("xml2js");
var zlib = require("zlib");
var config = require("./config.js");
var extension2 = /-(r?v?\d.*)\.jar/;

function Repository(dir, jarFolder) {

    var self = this;



    self.dir = dir;

    self.jarFolder = jarFolder;

    self.dbFile = dir + "/" + "db.xml.gz";

    self.db;

    // read current database file
    self.read = function (callback) {

        // if there no db files
        if (fs.existsSync(self.dbFile) == false) {

            self.db = {
                pluginRecords: {
                    plugin: []
                }
            };

            self.createDatabase(callback);
        } else {
            new Seq()
                    .seq(function () {
                        var gzip = zlib.createGunzip();

                        var buffer = [];
                        var cb = this;
                        var input = fs
                                .createReadStream("db.xml.gz")
                                .pipe(gzip)
                                .on("data", function (data) {
                                    //console.log(data.toString());
                                    buffer.push(data.toString());
                                })
                                .on("end", function () {
                                    //console.log(buffer.toString());
                                    cb(null, buffer.join(""));
                                });
                    })
                    .seq(function (xml) {
                        //console.log(xml);
                        xml2js.parseString(xml, this);
                    })
                    .seq(function (db) {
                        self.db = db;
                        callback(null, self.db);
                    });
        }
    };

    // writes updated database files
    self.write = function (cb) {


        var builder = new xml2js.Builder();
        var xml = builder.buildObject(self.db);
        console.log(xml);


        var cdata = config.doctype;


        var gzip = zlib.createGunzip();
        var output = fs.createWriteStream("test.xml.gz");
        var stream = new Stream();
        stream
                .pip(gzip)
                .pipe(output);
        stream
                .write(cdata)
                .write(xml)
                .flush()
                .close();

    };

    self.path = function (folder, filename) {
        if (folder.lastIndexOf("/") != filename.length - 1) {
            folder = folder + "/";
        }
        return folder + filename;
    }

    self.getPlugin = function (filename) {

        if (filename.$ != undefined)
            return filename;

        for (var record in self.db.pluginRecords.plugin) {
            // changing from the index to its associated value
            record = self.db.pluginRecords.plugin[record];
            if (self.getId(record.$.filename) == self.getId(filename)) {
                return record;
            }
        }
    };

    const PREVIOUS_VERSION = "previous-version";

    self.addVersion = function (filename, version) {


        var plugin = self.getPlugin(filename);



        var oldVersion = self.getVersion(plugin);

        if (plugin[PREVIOUS_VERSION] == undefined) {
            plugin[PREVIOUS_VERSION] = [];
        }
        plugin[PREVIOUS_VERSION].push(oldVersion);

        if (version == undefined) {
            delete plugin.version
        } else {
            plugin.version = [version];
        }


    };



    self.getVersion = function (plugin) {
        try {
            return plugin.version[0].$;
        } catch (e) {
            return {}
        }
    };

    self.getCheckSum = function (filename) {
        console.log(JSON.stringify(self.getPlugin(filename), null, 2));
        return self.getVersion(self.getPlugin(filename)).checksum;
    };



    // doesn the checksum of the current jars
    self.checkCurrentJars = function (cb) {

        // read current directory with all files
        // get the checksum
        // get the id
        // find the equivalent in the database
        // if equivalent exist put current as previous version
        // put this one as new
        // if not, create it

        var check = [];

        new Seq()
                .seq(function () {
                    fs.readdir(self.jarFolder, this)
                })
                .flatten()

                .parEach(2, function (f) {


                    var path = self.path(self.jarFolder, f);
                    self.checksum(path, this.into(f));


                })
                .unflatten()
                .seq(function (result) {

                    for (var i = 0; i != result.length; i++) {
                        var filename = result[i];
                        var checksum = this.vars[filename];
                        if (checksum == undefined) {
                            continue;
                        }
                        checksum = checksum.trim();
                        check.push({
                            filename: filename
                            , checksum: checksum
                        });

                    }
                    // let pass to the next 
                    this(null, check);


                })
                .seq(function (check) {



                    for (file in check) {
                        file = check[file];

                        var record = self.getPlugin(file.filename);

                        if (record == undefined) {
                            // create record
                            console.log("creating", file.filename);

                            self.db.pluginRecords.plugin.push({
                                $: {
                                    filename: file.filename
                                }
                                , version: [{$: file}]

                            });


                        } else if (self.getCheckSum(record) != file.checksum) {
                            console.log(self.getCheckSum(record));
                            console.log("updating", record.$.filename);


                            self.addVersion(file.filename, {
                                $: file
                            });
                            console.log(self.getPlugin(file.filename));
                            // update record

                        }

                    }

                    var has = function (filename) {

                        // getting the id associated to the filename
                        var filenameId = self.getId(filename);

                        return check
                                // getting all the id contained in the "check" array
                                .map(function (file) {
                                    return self.getId(file.filename);
                                })
                                .filter(function (id) {
                                    return id == filenameId;
                                })
                                // checking if a record was spot
                                .length > 0

                    };

                    // deleting 
                    console.log("deleting");

                    self
                            .db
                            .pluginRecords
                            .plugin
                            .filter(function (plugin) {
                                has(plugin.$.filename);
                            })
                            .forEach(console.log);





                })
                ;
    };

    self.getId = function (jarname) {
        if (jarname.indexOf("/") > -1) {
            jarname = jarname.substr(jarname.indexOf("/") + 1, jarname.length);
        }
        var m = jarname.match(extension2);

        var ext;
        if (m == null) {
            return jarname;
        } else {
            ext = m[0];
        }
        var basename = jarname.substr(0, jarname.indexOf(ext));
        return basename;
    }

    self.checksum = function (filename, cb) {


        var cmd = "java SHA1 " + filename;

        exec(cmd, function (err, stdout) {
            console.log(cmd, "[executed]");
            cb(err, stdout.toString());
        });

    };
}

module.exports = Repository;