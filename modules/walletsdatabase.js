const {app, dialog, ipcMain} = require("electron");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

const dbPath = path.join(app.getPath("userData"), "walletsdatabase.db");
const db = new datastore({filename: dbPath});
db.loadDatabase(function (err) {
  // Now commands will be executed
});


/* Wallets fields:
                  name: wallet name given by user,
                  masteraddress: wallet address of seed,
                  infos: wallet additional info given by user,
                  blockchaindirectory: core-geth --blockchain datadir directory
                  keystoredirectory: core-geth --keystore directory
                  datadirectory: // transactions, commits databases...
                  enode: enode url to connect to
                  type: mainnet or testnet
                  networkid: for testnet only
                  wsport:
                  wsaddress:
                  port:
*/

ipcMain.on("storeWallet", (event, arg) => {
  db.update({
    name: arg.name
  }, {$set:{ name: arg.name, infos: arg.infos, blockchaindirectory:arg.blockchaindirectory, keystoredirectory: arg.keystoredirectory, datadirectory: arg.datadirectory}}, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateWallet", (event, arg) => {
  db.update({
    name: arg.name
  }, {$set:{ name: arg.name, infos: arg.infos, blockchaindirectory:arg.blockchaindirectory, keystoredirectory: arg.keystoredirectory, datadirectory: arg.datadirectory}}, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("getWallets", (event, arg) => {
  db.find({}).exec(function (err, docs) {
    ResultData = [];

    for (i = 0; i < Math.min(docs.length, 500); i++) {
      
      let _wallet = {
        "name": docs[i].name,
        "masteraddress": docs[i].masteraddress,
        "infos": docs[i].infos,
        "blockchaindirectory": docs[i].blockchaindirectory,
        "keystoredirectory": docs[i].keystoredirectory,
        "datadirectory": docs[i].datadirectory,
        "enode": docs[i].enode,
        "type": docs[i].type
      };

      ResultData.push(
        _wallet
      );
    }
    // return the proposals data
    event.returnValue = ResultData;
  });
});

ipcMain.on("deleteWallets", (event, arg) => {

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
