/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var Repository = require("./repository.js");
var config = require("./config.js");
var Seq = require("seq");
var repo = new Repository(config.repo);


new Seq()
        .seq(function () {
            repo.read(this);
        })
        .seq(function () {
            repo.checkCurrentJars(this);
        })

        .seq(function () {
            repo.write(this);
        })
        .seq(function () {
            console.log("Build successful");
        });
