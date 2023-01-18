const {app, dialog, ipcMain} = require("electron");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

const dbPath = path.join(app.getPath("userData"), "proposals.db");
const db = new datastore({filename: dbPath});
db.loadDatabase(function (err) {
  // Now commands will be executed
});


/* Proposal fields (within the wallet, we dont store all proposal data. Only data to identify proposal is stored, rest is queried on blockchain each time):
                  proposalhash: _hashproposalhash,
                  proposer: onetxevent.returnValues._proposer,
                  proposalrawreleashash:  _raw_release_hash, // ipfs content
                  proposaltitle: _hashproposaltitle,
                  diseasename: _diseasename,
                  diseasehash: _diseasehash,
                  chunktitle: _chunktitle,
                  chunkid: _chunkid,
                  diseasename: _diseasename,
                  proposalstart: _hashproposalstart,
                  proposalend: _hashproposalend,
                  proposaldeadline: _hashproposaldeadline,
                  timestampclaimable: _timestampclaimable, // when proposal is claimable
                  txhash: onetx.hash.toLowerCase(),
                  status: 1, // 0: Rejected, 1: Accepted, 2: Pending
                  claimed: false, // false if proposer didnt claim yet, true if proposer claimed 
                  approvalthreshold: _hashproposalthreshold,
                  finalforvotes: _forvotes, // forvotes value once proposal has reached final status (accepted or rejected)
                  finalagainstvotes: _againstvotes, // againstvotes value once proposal has reached final status (accepted or rejected)
                  timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss")
                  reward: _rewardamount, // ETI reward
                  fees: _feesamount, // ETI fees
                  slashduration: _slashduration // Time slash duration
*/

// index the creationdate field
db.ensureIndex({
  fieldName: "creationdate"
}, function (err) {
  // If there was an error, err is not null
});

// index the proposalhash field
db.ensureIndex({
  fieldName: "proposalhash",
}, function (err) {
  // If there was an error, err is not null
});


// index the proposalrawreleashash field
db.ensureIndex({
  fieldName: "proposalrawreleashash",
}, function (err) {
  // If there was an error, err is not null
});

// index the diseasehash field
db.ensureIndex({
  fieldName: "diseasehash",
}, function (err) {
  // If there was an error, err is not null
});

// index the chunkid field
db.ensureIndex({
  fieldName: "chunkid",
}, function (err) {
  // If there was an error, err is not null
});

// index the txhash field
db.ensureIndex({
  fieldName: "txhash",
}, function (err) {
  // If there was an error, err is not null
});

// index the proposer field
db.ensureIndex({
  fieldName: "proposer",
}, function (err) {
  // If there was an error, err is not null
});

// index the status field
db.ensureIndex({
  fieldName: "status",
}, function (err) {
  // If there was an error, err is not null
});

ipcMain.on("storeProposal", (event, arg) => {
  console.log('--> storing Proposal');
  console.log('--> storing Proposal', arg);
  db.update({
    proposalhash: arg.proposalhash
  }, {$set:{ votehash: arg.votehash, txhash: arg.txhash, voter:arg.voter, timestamp: arg.timestamp, valueeti: arg.valueeti, choice: arg.choice, vary: arg.vary, proposalhash: arg.proposalhash, proposaltitle: arg.proposaltitle, proposalend: arg.proposalend, proposaldeadline: arg.proposaldeadline, timestampclaimable:arg.timestampclaimable, isDone: arg.isDone, status: arg.status}}, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateProposal", (event, arg) => {
  console.log('--> updating Proposal');
  console.log('--> updating Proposal', arg);
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

ipcMain.on("getProposerProposals", (event, arg) => {
  db.find({
    proposer: arg.proposer
  }).exec(function (err, _proposals) {
    event.returnValue = _proposals;
  });
});

ipcMain.on("getProposalbyProposalHash", (event, arg) => {
  db.findOne({
    proposalhash: arg.proposalhash,
  }).exec(function (err, _proposal) {
    event.returnValue = _proposal;
  });
});

ipcMain.on("getProposals", (event, arg) => {
  db.find({}).exec(function (err, docs) {
    ResultData = [];
    console.log('in getProposals');
    let _now = Date.now();
    console.log('in getProposals _now is', _now);
    let CurrentDate = moment(_now);
    console.log('in getProposals CurrentDate is', CurrentDate);

    // sort the data
    docs.sort((a, b) => {
        return (moment(b.timestamp, "YYYY-MM-DD HH:mm:ss").toDate() - moment(a.timestamp, "YYYY-MM-DD HH:mm:ss").toDate());
    });

    for (i = 0; i < Math.min(docs.length, 500); i++) {
      let _proposaltitle = "";
      let created = false;
      let revealed = false;
      let claimed = false;
      let missed = false;
      let revealopen = false;
      let revealpassed = false;
      let claimopen = false;

      // had to use this system because current front end framework cant do "(if status == x)"":
      if(docs[i].status == 1){
        rejected = true;
      }
      if(docs[i].status == 2){
        approved = true;
      }
      if(docs[i].status == 3){
        pending = true;
      }

      if(docs[i].proposalhash != null && docs[i].proposalhash !=''){
        _proposaltitle = docs[i].proposaltitle;

        if(docs[i].proposalend != null && docs[i].proposalend !=''){
          console.log('in docs[i].proposalend');
          console.log('in docs[i].proposalend is is', i);
          console.log('docs[i].proposalend is', docs[i].proposalend);
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
      let _proposal = {
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
        "timestamp": docs[i].timestamp
      };
      console.log('_proposal ', i, ' is', _proposal);

      ResultData.push(
        _proposal
      );
    }
    // return the proposals data
    event.returnValue = ResultData;
  });
});

ipcMain.on("deleteProposals", (event, arg) => {

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
