const {app, dialog, ipcMain} = require("electron");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

const dbPath = path.join(app.getPath("userData"), "setupdirectory.db");
const db = new datastore({filename: dbPath});
db.loadDatabase(function (err) {
  // Now commands will be executed
});


/* Settup settings:
                  registerdirectory: Directory where Wallets list is stored
                  default_blockchaindirectory: last used Directory for blockchain
                  default_keystoredirectory: last used Directory for keystore
*/

ipcMain.on("updateSetup", (event, arg) => {
  db.update({

  }, {$set:{ registerdirectory: arg.registerdirectory, default_blockchaindirectory: arg.default_blockchaindirectory, default_keystoredirectory: arg.default_keystoredirectory}}, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("getSetup", (event, arg) => {
  db.find({}).exec(function (err, docs) {
    ResultData = [];

      let _setup = {
        "registerdirectory": docs[0].registerdirectory,
        "default_blockchaindirectory": docs[0].default_blockchaindirectory,
        "default_keystoredirectory": docs[0].default_keystoredirectory
      };

      ResultData.push(
        _setup
      );

    // return the proposals data
    event.returnValue = ResultData;
  });
});