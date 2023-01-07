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


/* Commit fields:
                  votehash: onetxevent.returnValues.votehash,
                  txhash: onetx.hash.toLowerCase(),
                  voter: onetxevent.returnValues._voter,
                  timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                  valueeti: _valueeti,
                  choice: _hashchoice,
                  vary: _hashvary,
                  proposalhash: _hashproposalhash,
                  proposaltitle: _hashproposaltitle,
                  proposaldeadline: _hashproposaldeadline,
                  isDone: false,
                  status: 1, // 1: created, 2: revealed, 3: claimed, 4: missed
*/

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

// index the status field
db.ensureIndex({
  fieldName: "status",
}, function (err) {
  // If there was an error, err is not null
});

ipcMain.on("storeCommit", (event, arg) => {
  console.log('--> storing Commit');
  console.log('--> storing Commit', arg);
  db.update({
    votehash: arg.votehash,
    txhash: arg.txhash,
    voter: arg.voter
  }, arg, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateCommit", (event, arg) => {
  console.log('--> updateing Commit');
  console.log('--> updating Commit', arg);
  db.update({
    votehash: arg.votehash,
    voter: arg.voter
  }, {$set:{vary: arg.vary, choice: arg.choice, proposalhash: arg.proposalhash, proposaltitle: arg.proposaltitle, proposaldeadline:arg.proposaldeadline}}, {
    upsert: false,
    multi:true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});


ipcMain.on("updateCommitwithStatus", (event, arg) => {
  console.log('--> updateing Commit');
  console.log('--> updating Commit', arg);
  db.update({
    votehash: arg.votehash,
    voter: arg.voter
  }, {$set:{vary: arg.vary, choice: arg.choice, proposalhash: arg.proposalhash, proposaltitle: arg.proposaltitle, proposaldeadline:arg.proposaldeadline, status: arg.status}}, {
    upsert: false,
    multi:true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("getCommit", (event, arg) => {
  db.findOne({
    votehash: arg.votehash,
    voter: arg.voter
  }).exec(function (err, _commit) {
    event.returnValue = _commit;
  });
});

ipcMain.on("getCommits", (event, arg) => {
  db.find({}).exec(function (err, docs) {
    ResultData = [];
    console.log('in getCommmits');
    let _now = Date.now();
    console.log('in getCommmits _now is', _now);
    let CurrentDate = moment(_now);
    console.log('in getCommmits CurrentDate is', CurrentDate);

    // sort the data
    docs.sort((a, b) => {
        return (moment(b.timestamp, "YYYY-MM-DD HH:mm:ss").toDate() - moment(a.timestamp, "YYYY-MM-DD HH:mm:ss").toDate());
    });

    for (i = 0; i < Math.min(docs.length, 500); i++) {
      let _proposaltitle = "Unknown Proposal";
      let created = false;
      let revealed = false;
      let claimed = false;
      let missed = false;
      let revealopen = false;

      if(docs[i].status == 1){
        created = true;
      }
      if(docs[i].status == 2){
        revealed = true;
      }
      if(docs[i].status == 3){
        claimed = true;
      }
      if(docs[i].status == 4){
        missed = true;
      }

      if(docs[i].proposalhash != null && docs[i].proposalhash !=''){
        _proposaltitle = docs[i].proposaltitle;

        if(docs[i].proposalend != null && docs[i].proposalend !='' && i != 34 && i != 35 && i != 36){
          console.log('in docs[i].proposalend');
          console.log('in docs[i].proposalend is is', i);
          console.log('docs[i].proposalend is', docs[i].proposalend);
          let _end = moment(docs[i].proposalend).format("YYYY-MM-DD HH:mm:ss");
          let _deadline = moment(docs[i].proposaldeadline).format("YYYY-MM-DD HH:mm:ss");

        // proposal is in revealing stage:
        if( CurrentDate.isAfter(_end) && CurrentDate.isBefore(_deadline) ){
           revealopen = true;
          }
      }


      }
      let _commit = {
        "votehash": docs[i].votehash,
        "txhash": docs[i].txhash,
        "voter": docs[i].voter,
        "proposalhash": docs[i].proposalhash,
        "proposaltitle": _proposaltitle,
        "proposalend": docs[i].proposalend,
        "proposaldeadline": docs[i].proposaldeadline,
        "valueeti": docs[i].valueeti,
        "choice": docs[i].choice,
        "vary": docs[i].vary,
        "isDone": docs[i].isDone,
        "status": docs[i].status,
        "created": created,
        "revealed": revealed,
        "claimed": claimed,
        "missed": missed,
        "revealopen": revealopen,
        "timestamp": docs[i].timestamp
      };
      console.log('_commit ', i, ' is', _commit);

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
