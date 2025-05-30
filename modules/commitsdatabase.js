const {app, dialog, ipcMain} = require("electron");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

let db;


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
                  proposalend: _hashproposalend,
                  proposaldeadline: _hashproposaldeadline,
                  timestampclaimable: _timestamp_claimable,
                  isDone: false,
                  status: _status, // status of the commit
*/

ipcMain.on("setWalletDataDbPath", (event, arg) => {
  // set dbPath using IPC message
  const dbWalletDataDirectory = arg;
  const dbPath = path.join(dbWalletDataDirectory, "commits.db");

  db = new datastore({filename: dbPath});
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

// index the status field
db.ensureIndex({
  fieldName: "status",
}, function (err) {
  // If there was an error, err is not null
});

});


ipcMain.on("storeCommit", (event, arg) => {
  db.update({
    votehash: arg.votehash,
    txhash: arg.txhash,
    voter: arg.voter
  }, {$set:{ votehash: arg.votehash, txhash: arg.txhash, voter:arg.voter, timestamp: arg.timestamp, valueeti: arg.valueeti, choice: arg.choice, vary: arg.vary, proposalhash: arg.proposalhash, proposaltitle: arg.proposaltitle, proposalend: arg.proposalend, proposaldeadline: arg.proposaldeadline, timestampclaimable:arg.timestampclaimable, isDone: arg.isDone, status: arg.status}}, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateCommit", (event, arg) => {
  db.update({
    votehash: arg.votehash,
    voter: arg.voter
  }, {$set:{vary: arg.vary, choice: arg.choice, proposalhash: arg.proposalhash, proposaltitle: arg.proposaltitle, proposaldeadline:arg.proposaldeadline, timestampclaimable:arg.timestampclaimable}}, {
    upsert: false,
    multi:true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});


ipcMain.on("updateCommitwithStatus", (event, arg) => {
  db.update({
    votehash: arg.votehash,
    voter: arg.voter
  }, {$set:{vary: arg.vary, choice: arg.choice, proposalhash: arg.proposalhash, proposaltitle: arg.proposaltitle, proposaldeadline:arg.proposaldeadline, timestampclaimable:arg.timestampclaimable, status: arg.status}}, {
    upsert: false,
    multi:true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateCommitRewardAmount", (event, arg) => {
  db.update({
    votehash: arg.votehash,
    voter: arg.voter
  }, {$set:{rewardamount: arg.rewardamount, status: arg.status}}, {
    upsert: false,
    multi:false
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});


ipcMain.on("updateCommitSlash", (event, arg) => {
  db.update({
    votehash: arg.votehash,
    voter: arg.voter
  }, {$set:{slashamount: arg.slashamount, slashduration: arg.slashduration, status: arg.status}}, {
    upsert: false,
    multi:false
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateCommitFee", (event, arg) => {
  db.update({
    votehash: arg.votehash,
    voter: arg.voter
  }, {$set:{fee: arg.fee, status: arg.status}}, {
    upsert: false,
    multi:false
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

ipcMain.on("getCommitbyProposalHash", (event, arg) => {
  db.findOne({
    proposalhash: arg.proposalhash,
    voter: arg.voter
  }).exec(function (err, _commit) {
    event.returnValue = _commit;
  });
});

ipcMain.on("getCommitbyTransactionHash", (event, arg) => {
  db.findOne({
    txhash: arg.txhash
  }).exec(function (err, _commit) {
    event.returnValue = _commit;
  });
});

ipcMain.on("getCommits", (event, arg) => {
  db.find({}).exec(function (err, docs) {
    ResultData = [];
    let _now = Date.now();
    let CurrentDate = moment(_now);

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
      let revealpassed = false;
      let claimopen = false;

      // had to use this system because current front end framework cant do "(if status == x)"":
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

        if(docs[i].proposalend != null && docs[i].proposalend !=''){
          let _end = moment(docs[i].proposalend).format("YYYY-MM-DD HH:mm:ss");
          let _deadline = moment(docs[i].proposaldeadline).format("YYYY-MM-DD HH:mm:ss");
          let _timestamp_claimable = moment(docs[i].timestampclaimable).format("YYYY-MM-DD HH:mm:ss");

        // proposal is in revealing stage:
        if( CurrentDate.isAfter(_end) && CurrentDate.isBefore(_deadline) ){
           revealopen = true;
          }
        else if (CurrentDate.isAfter(_deadline)){
           revealpassed = true;
          }

        if( CurrentDate.isAfter(_timestamp_claimable)){
            claimopen = true;
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
        "timestampclaimable": docs[i].timestampclaimable,
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
        "revealpassed": revealpassed,
        "claimopen": claimopen,
        "rewardamount": docs[i].rewardamount,
        "slashamount": docs[i].slashamount,
        "slashduration": docs[i].slashduration,
        "fee": docs[i].fee,
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

  try {
    // if file exists delete:
    if (fs.existsSync(dbPath)) {

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

  }
  else {
    event.returnValue = {
      success: true,
      error: null
    };
  } 
} catch(err) {
  console.error(err);
  event.returnValue = {
    success: false,
    error: err
  };
}


});
