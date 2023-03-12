const {app, dialog, ipcMain} = require("electron");
const storage = require("electron-storage");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

let db;

/* Counters fields:
                  name: MainTxsChecker;
                  block: blocknumber;  // last block whose transactions where scanned
*/


ipcMain.on("setWalletDataDbPath", (event, arg) => {
  // set dbPath using IPC message
  const dbWalletDataDirectory = arg;
  const dbPath = path.join(dbWalletDataDirectory, "counters.db");

  db = new datastore({filename: dbPath});
  db.loadDatabase(function (err) {
    // Now commands will be executed
  });

// index the block field
db.ensureIndex({
  fieldName: "block"
}, function (err) {
  // If there was an error, err is not null
});

// index the name field
db.ensureIndex({
  fieldName: "name"
}, function (err) {
  // If there was an error, err is not null
});


});


ipcMain.on("createCounter", (event, arg) => {
  db.update({
    name: arg.name
  }, {$set:{ block: arg.block}}, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateCounter", (event, arg) => {
  db.update({
    name: arg.name
  }, {$set:{ block: arg.block}}, {
    upsert: false
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("getCounter", (event, arg) => {
  db.findOne({
    name: arg.name,
  }).exec(function (err, _counter) {
    event.returnValue = _counter;
  });
});