const {app, dialog, ipcMain} = require("electron");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

const dbPath = path.join(app.getPath("userData"), "commits.db");
const db = new datastore({filename: dbPath});
db.loadDatabase(function (err) {
  // Now commands will be executed
});

// index the creationdate field
db.ensureIndex({
  fieldName: "creationdate"
}, function (err) {
  // If there was an error, err is not null
});

// index the commithash field
db.ensureIndex({
  fieldName: "commithash",
}, function (err) {
  // If there was an error, err is not null
});

// index the proposalhash field
db.ensureIndex({
  fieldName: "proposalhash",
}, function (err) {
  // If there was an error, err is not null
});

// index the txhash field
db.ensureIndex({
  fieldName: "txhash",
}, function (err) {
  // If there was an error, err is not null
});

// index the voter field
db.ensureIndex({
  fieldName: "voter",
}, function (err) {
  // If there was an error, err is not null
});

ipcMain.on("storeCommit", (event, arg) => {
  console.log('--> storing Commit');
  console.log('--> storing Commit', arg);
  db.update({
    commithash: arg.commithash,
    txhash: arg.txhash,
    voter: arg.voter
  }, arg, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("getCommits", (event, arg) => {
  db.find({}).exec(function (err, docs) {
    ResultData = [];

    // sort the data
    docs.sort((a, b) => {
        return (moment(b.timestamp, "YYYY-MM-DD HH:mm:ss").toDate() - moment(a.timestamp, "YYYY-MM-DD HH:mm:ss").toDate());
    });

    for (i = 0; i < Math.min(docs.length, 500); i++) {
      let _proposal_title = "Unknown Proposal";
      if(docs[i].proposalhash != null && docs[i].proposalhash !=''){
        _proposaltitle = docs[i].proposalhash;
      }
      let _commit = {
        "votehash": docs[i].votehash,
        "txhash": docs[i].txhash,
        "voter": docs[i].voter,
        "proposalhash": docs[i].proposalhash,
        "proposaltitle": _proposal_title,
        "proposaldeadline": docs[i].proposaldeadline,
        "valueeti": docs[i].valueeti,
        "choice": docs[i].choice,
        "vary": docs[i].vary,
        "isDone": docs[i].isDone,
        "status": docs[i].status,
        "timestamp": docs[i].timestamp
      };

      ResultData.push(
        _commit
      );
    }
    // return the commits data
    event.returnValue = ResultData;
  });
});

ipcMain.on("deleteCommits", (event, arg) => {
  fs.unlink(dbPath, err => {
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
