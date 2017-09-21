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
var dateformat = require("dateformat");

var path = require("./path.js");

function Repository(dir, jarFolder) {

    var self = this;



    self.dir = dir;
    if (jarFolder == undefined) {
        jarFolder = path(dir, "jars");
    }


    self.jarFolder = jarFolder;

    self.dbFile = path(dir, "db.xml.gz");

    self.db;


    self.now = function () {

        return dateformat(new Date(), "yyyymmHHMMss");

    };

    // read current database file
    self.read = function (callback) {

        // if there no db files
        if (fs.existsSync(self.dbFile) == false) {

            self.db = {
                pluginRecords: {
                    plugin: []
                }
            };

            callback(null, self.db);
        } else {
            new Seq()
                    .seq(function () {
                        var gzip = zlib.createGunzip();

                        var buffer = [];
                        var cb = this;
                        fs
                                .createReadStream(self.dbFile)
                                .pipe(gzip)
                                .on("data", function (data) {
                                    buffer.push(data.toString());
                                })
                                .on("end", function () {
                                    cb(null, buffer.join(""));
                                })
                                .on("error", function (err) {
                                    cb(err);
                                });
                    })
                    .catch(function (err) {
                        callback(err)
                    })
                    .seq(function (xml) {
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

        try {

            console.log("Writing db.xml.gz");


            var builder = new xml2js.Builder();
            var xml = builder.buildObject(self.db);
            var cdata = config.doctype;

            // creating the output stream
            var output = fs.createWriteStream(path(config.repo, "db.xml.gz"));
            var compress = zlib.createGzip();
            compress.pipe(output);


            var begin = "<pluginRecords>";

            // deleting the header of the XML
            xml = xml.substring(xml.indexOf(begin), xml.length);

            // writing the compressed output

            compress.write(cdata);
            compress.write("\n");
            compress.write(xml);
            compress.end();


            // writing an uncompressed output for debug reasons
            var output2 = fs.createWriteStream(path(config.repo, "db.xml"));
            output2.write(cdata);
            output2.write("\n");
            output2.write(xml);
            output2.end();

            console.log("db.xml.gz written.");

            cb(null);
        } catch (e) {
            if (cb != undefined)
                cb(e);
        }
    };



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


        // getting the plugin entry
        var plugin = self.getPlugin(filename);


        // creating a entry for the old version (must respect the XML format)
        var oldVersion = {$: self.getVersion(plugin)};

        // creates the entry in the data tree if doesn't exists
        if (plugin[PREVIOUS_VERSION] == undefined) {
            plugin[PREVIOUS_VERSION] = [];
        }
        plugin[PREVIOUS_VERSION].push(oldVersion);

        // if the current the parameter is null
        // it means the jar is not used anymore
        // it's deleted from the tree
        if (version == undefined) {
            delete plugin.version
        }

        // otherwise, the new version of the jar
        // is set as default
        else {
            plugin.$.filename = filename;
            plugin.version = [version];
        }
    };

    /**
     * Returns the current version of the jara
     * @param {type} plugin
     * @returns 
     */
    self.getVersion = function (plugin) {
        try {
            return plugin.version[0].$;
        } catch (e) {
            return {}
        }
    };

    /**
     * Returns the checksum as a string
     * @param {type} filename
     * @returns {unresolved}
     */
    self.getCheckSum = function (filename) {
        return self.getVersion(self.getPlugin(filename)).checksum;
    };

    /**
     * checks the jars contained in the jar folder
     * @param {type} callback : callback
     * @returns {undefined}
     */
    self.checkCurrentJars = function (callback) {

        // read current directory with all files
        // get the checksum
        // get the id
        // find the equivalent in the database
        // if equivalent exist put current as previous version
        // put this one as new
        // if not, create it

        // array that will contain the detected jars
        var check = [];

        // current timestamp
        var now = self.now();

        // starting the sequence
        new Seq()
                // reading the list of files in the jar directory
                .seq(function () {
                    fs.readdir(self.jarFolder, this)
                })

                // transform the resulted list in a sequence stack
                .flatten()

                // for each detected file in the jar folder
                .parEach(2, function (f) {
                    var p = path(self.jarFolder, f);

                    // calculating the checksum and storing it
                    self.checksum(p, this.into(f));
                })
                // putting everyting back into one array
                .unflatten()
                .seq(function (result) {

                    // the checksum associated to the file is retrieved...
                    for (var i = 0; i != result.length; i++) {
                        var filename = result[i];
                        var checksum = this.vars[filename];

                        if (filename.indexOf(".jar") == -1)
                            continue;

                        if (checksum == undefined) {
                            continue;
                        }


                        checksum = checksum.trim();

                        // ...and a new data structure is created
                        check.push({
                            filename: path("jars", filename)
                            , checksum: checksum
                            , timestamp: now
                            , filesize: fs.lstatSync(path("jars", filename)).size
                        });

                    }
                    // let pass to the next 
                    this(null, check);
                })
                .seq(function (check) {

                    // for each file in the list of created strucutre that
                    // that represent the current jar
                    for (file in check) {

                        file = check[file];

                        // checking if a different version of the
                        // jar already exists in the database
                        var record = self.getPlugin(file.filename);

                        // if not, a record is created
                        if (record == undefined) {
                            // create record
                            console.log("creating", file.filename);

                            self.db.pluginRecords.plugin.push({
                                $: {
                                    filename: file.filename
                                }
                                , version: [{$: file}]

                            });


                        }
                        // if a record with a different checksum exists,
                        // the old version is flagged as previous version
                        else if (self.getCheckSum(record) != file.checksum) {

                            console.log("updating", record.$.filename);

                            self.addVersion(file.filename, {
                                $: file
                            });
                        }

                    }

                    // function checking if a filename is
                    // in the list of newly discovered jars
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
                                .length == 0

                    };

                    // deleting the jar that are not used anymore
                    console.log("Deleting missing dependancies");
                    self
                            .db
                            .pluginRecords
                            .plugin
                            .filter(function (plugin) {
                                return has(plugin.$.filename);
                            })
                            .map(function (plugin) {
                                console.log("Deleting " + plugin.$.filename);
                                return plugin.$.filename;
                            })
                            .forEach(function (plugin) {
                                console.log("Deleting", plugin);
                                self.addVersion(plugin);
                            });
                    console.log("JAR check finished.");


                    if (callback != undefined) {
                        callback();
                    }
                    this();

                });

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

    /**
     * Asynchronous checksum
     * @param {type} filename
     * @param {type} cb
     * @returns {undefined}
     */
    self.checksum = function (filename, cb) {

        var cmd = "java SHA1 " + filename;

        exec(cmd, function (err, stdout) {
            console.log(cmd, "[executed]");
            cb(err, stdout.toString());
        });

    };
}
module.exports = Repository;