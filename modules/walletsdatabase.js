const {app, dialog, ipcMain} = require("electron");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

let db;


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
                  contractaddress: for testnet only
                  wsport:
                  wsaddress:
                  port:
*/


// Only this function reacts to this call:
ipcMain.on("checkWalletDataDbPath", (event, arg) => {
  // set dbPath using IPC message
  const dbWalletDataDirectory = arg;
  const dbPath = path.join(dbWalletDataDirectory, "walletsdatabase.db");

  db = new datastore({filename: dbPath});
  db.loadDatabase(function (err) {
    // Now commands will be executed
  });
});


// All modules db files react to this call:
ipcMain.on("setWalletDataDbPath", (event, arg) => {
  // set dbPath using IPC message
  const dbWalletDataDirectory = arg;
  const dbPath = path.join(dbWalletDataDirectory, "walletsdatabase.db");
console.log('dbWalletDataDirectory is', dbWalletDataDirectory);
  db = new datastore({filename: dbPath});
  db.loadDatabase(function (err) {
    // Now commands will be executed
  });
});


ipcMain.on("storeWallet", (event, arg) => {
  db.update({
    name: arg.name
  }, {$set:{ name: arg.name, masteraddress: arg.masteraddress, infos: arg.infos, type:arg.type, blockchaindirectory: arg.blockchaindirectory, keystoredirectory: arg.keystoredirectory, datadirectory: arg.datadirectory, enode: arg.enode, type:arg.type, networkid: arg.networkid, contractaddress: arg.contractaddress, wsport: arg.wsport, wsaddress: arg.wsaddress, port: arg.port, encryptedMaster: arg.encryptedMaster, salt: arg.salt, vector: arg.vector}}, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateWallet", (event, arg) => {
  db.update({
    name: arg.name
  }, {$set:{ name: arg.name, masteraddress: arg.masteraddress, infos: arg.infos, type:arg.type, blockchaindirectory: arg.blockchaindirectory, keystoredirectory: arg.keystoredirectory, datadirectory: arg.datadirectory, enode: arg.enode, type:arg.type, networkid: arg.networkid, contractaddress: arg.contractaddress, wsport: arg.wsport, wsaddress: arg.wsaddress, port: arg.port, encryptedMaster: arg.encryptedMaster, salt: arg.salt, vector: arg.vector}}, {
    upsert: false
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});


ipcMain.on("getWallet", (event, arg) => {
  db.findOne({
    masteraddress: arg.masteraddress
  }).exec(function (err, _wallet) {
    event.returnValue = _wallet;
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
        "type": docs[i].type,
        "networkid": docs[i].networkid, 
        "contractaddress": docs[i].contractaddress,
        "wsport": docs[i].wsport,
        "wsaddress": docs[i].wsaddress,
        "port": docs[i].port
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
