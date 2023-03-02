const {app, dialog, ipcMain} = require("electron");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

let hashinputdb;

ipcMain.on("setWalletDataDbPath", (event, arg) => {
  // set dbPath using IPC message
  const dbWalletDataDirectory = arg;
  const dbPath = path.join(dbWalletDataDirectory, "hashinputs.db");

  hashinputdb = new datastore({filename: dbPath});
  hashinputdb.loadDatabase(function (err) {
    // Now commands will be executed
  });


 // index the commithash field
 hashinputdb.ensureIndex({
  fieldName: "commithash",
  unique: true 
 }, function (err) {
  // If there was an error, err is not null
 });

 // index the proposalhash field
 hashinputdb.ensureIndex({
  fieldName: "proposalhash",
 }, function (err) {
  // If there was an error, err is not null
 });

 // index the voter field
 hashinputdb.ensureIndex({
  fieldName: "voter",
 }, function (err) {
  // If there was an error, err is not null
 });


 });


ipcMain.on("storeHashinput", (event, arg) => {
  console.log('--> storing Hashinputs');
  console.log('--> storing Hashinputs', arg);
  hashinputdb.update({
    commithash: arg.commithash
  }, arg, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("getHashinput", (event, arg) => {
  console.log('--> getting Hashinput');
  console.log('--> getting Hashinput arg is: ', arg);
  hashinputdb.find({commithash: arg.commithash}).exec(function (err, docs) {
    if(docs && docs.length > 0){
      event.returnValue = docs[0];
    }
    else {
      event.returnValue = null;
    }
  });
});

ipcMain.on("getHashinputs", (event, arg) => {
  console.log('--> getting Hashinputs');
  hashinputdb.find({}).exec(function (err, docs) {
    ResultData = [];

    for (i = 0; i < Math.min(docs.length, 500); i++) {
      ResultData.push([
        docs[i].commithash,
        docs[i].voter
      ]);
    }

    // return the transactions data
    event.returnValue = ResultData;
  });
});

ipcMain.on("deleteHashinputs", (event, arg) => {
  fs.unlink(hashinputdbPath, err => {
    if (err) {
      event.returnValue = {
        success: false,
        error: err
      };
    } else {
      event.returnValue = {
        success: true,
        error: null
      };
    }
  });
});
