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
                  seedcreationtype: 'newseed' | 'importedseed' |'importedpk'
                  seedblockheight: blocknumber of seed creation to start scanning txs from
*/


// Only this function reacts to this call:
ipcMain.on("checkWalletDataDbPath", (event, arg) => {
  // set dbPath using IPC message
  const dbWalletDataDirectory = arg;
  const dbPath = path.join(dbWalletDataDirectory, "eticaregistry.db");

  db = new datastore({filename: dbPath});
  db.loadDatabase(function (err) {
    // Now commands will be executed
  });
});

// All modules db files react to this call:
ipcMain.on("setWalletDataDbPath", (event, arg) => {
  // set dbPath using IPC message. walletsregistry.db is located in main folder, one level above /walletaddress
  const dbWalletDataDirectory = arg;
  const dbPath = path.join(dbWalletDataDirectory, "eticaregistry.db");
  db = new datastore({filename: dbPath});
  db.loadDatabase(function (err) {
    // Now commands will be executed
  });
});


ipcMain.on("storeWallet", (event, arg) => {
  db.update({
    masteraddress: arg.masteraddress
  }, {$set:{ name: arg.name, masteraddress: arg.masteraddress, infos: arg.infos, type:arg.type, blockchaindirectory: arg.blockchaindirectory, keystoredirectory: arg.keystoredirectory, datadirectory: arg.datadirectory, enode: arg.enode, networkid: arg.networkid, contractaddress: arg.contractaddress, wsport: arg.wsport, wsaddress: arg.wsaddress, port: arg.port, encryptedMaster: arg.encryptedMaster, salt: arg.salt, vector: arg.vector, autounlock: arg.autounlock, unlocktime: arg.unlocktime, seedcreationtype: arg.seedcreationtype, seedblockheight: arg.seedblockheight}}, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("updateWallet", (event, arg) => {
  db.update({
    masteraddress: arg.masteraddress
  }, {$set:{ name: arg.name, masteraddress: arg.masteraddress, infos: arg.infos, type:arg.type, blockchaindirectory: arg.blockchaindirectory, keystoredirectory: arg.keystoredirectory, datadirectory: arg.datadirectory, enode: arg.enode, networkid: arg.networkid, contractaddress: arg.contractaddress, wsport: arg.wsport, wsaddress: arg.wsaddress, port: arg.port, encryptedMaster: arg.encryptedMaster, salt: arg.salt, vector: arg.vector, autounlock: arg.autounlock, unlocktime: arg.unlocktime}}, {
    upsert: false
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});


// Wallet Main Settings:
ipcMain.on("updateWalletMainSettings", (event, arg) => {
  db.update({
    masteraddress: arg.masteraddress
  }, {$set:{ name: arg.name, autounlock: arg.autounlock, unlocktime: arg.unlocktime}}, {
    upsert: false
  }, function (err, numReplaced, upsert) {
    // Retrieve the updated wallet and send it as a response
    db.findOne({ masteraddress: arg.masteraddress }, function (err, updatedWallet) {
      event.sender.send("updateWalletMainSettingsResponse", updatedWallet);
    });
  });
});


ipcMain.on("updateWalletAdvancedSettings", (event, arg) => {
  db.update({
    masteraddress: arg.masteraddress
  }, {$set:{ port: arg.port, wsport: arg.wsport, enode: arg.enode}}, {
    upsert: false
  }, function (err, numReplaced, upsert) {
    // Retrieve the updated wallet and send it as a response
    db.findOne({ masteraddress: arg.masteraddress }, function (err, updatedWallet) {
      event.sender.send("updateWalletAdvancedSettingsResponse", updatedWallet);
    });
  });
});

// Wallet Main Settings:
ipcMain.on("setWalletBlockHeight", (event, arg) => {
  db.update({
    masteraddress: arg.masteraddress
  }, {$set:{ seedblockheight: arg.seedblockheight}}, {
    upsert: false
  }, function (err, numReplaced, upsert) {
    // do nothing
  });
});


ipcMain.on("getWallet", (event, arg) => {
  db.findOne({
    masteraddress: arg.masteraddress
  }).exec(function (err, _wallet) {
    event.returnValue = _wallet;
  });
});


ipcMain.on('getWallets', async (event, arg) => {
  const wallets = [];
  let folderPath;

  // Prompt user to select a folder
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    folderPath = result.filePaths[0];

    // Search for walletsregistry.db in subfolders
    const searchForFiles = async (dir) => {
      const files = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        if (file.isDirectory()) {
          await searchForFiles(path.join(dir, file.name));
        } else if (file.name === 'eticaregistry.db') {
          const dbPath = path.join(dir, file.name);

          const walletDb = new datastore({ filename: dbPath });
          await new Promise((resolve, reject) => {
            walletDb.loadDatabase((err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          const docs = await new Promise((resolve, reject) => {
            walletDb.find({}).exec((err, docs) => {
              if (err) reject(err);
              else resolve(docs);
            });
          });

          for (const doc of docs) {
            const wallet = {
              name: doc.name,
              masteraddress: doc.masteraddress,
              infos: doc.infos,
              blockchaindirectory: doc.blockchaindirectory,
              keystoredirectory: doc.keystoredirectory,
              datadirectory: doc.datadirectory,
              enode: doc.enode,
              type: doc.type,
              networkid: doc.networkid,
              contractaddress: doc.contractaddress,
              wsport: doc.wsport,
              wsaddress: doc.wsaddress,
              port: doc.port,
              autounlock: doc.autounlock,
              unlocktime: doc.unlocktime
            };

            wallets.push(wallet);
          }
        }
      }
    };

    await searchForFiles(folderPath);
    let res = {};
    res.wallets = wallets;
    res.folderPath = folderPath;
    event.reply("ScanedFolderWalletsFound", res);
  }
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

function removeLastFolderFromPath(path) {
  // split the path into an array of folders
  let folders = path.split("/");

  // remove the last folder from the array
  folders.pop();

  // join the remaining folders back into a path
  let newPath = folders.join("/");

  // return the new path without the last folder
  return newPath;
}
