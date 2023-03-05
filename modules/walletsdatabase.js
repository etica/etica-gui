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



/*
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
*/

/*
ipcMain.on('getWallets', (event, arg) => {
  const wallets = [];

  // Prompt user to select a folder
  dialog.showOpenDialog({ properties: ['openDirectory'] }).then(async (result) => {
    if (!result.canceled) {
      const folderPath = result.filePaths[0];

      // Search for walletsregistry.db in subfolders
      const searchForFiles = async (dir) => {
        fs.readdir(dir, { withFileTypes: true }, (err, files) => {
          if (err) throw err;

          files.forEach(file => {
            if (file.isDirectory()) {
              searchForFiles(path.join(dir, file.name));
            } else if (file.name === 'walletsregistry.db') {
              const dbPath = path.join(dir, file.name);

              const walletDb = new datastore({ filename: dbPath });
              walletDb.loadDatabase(function (err) {
                if (err) throw err;

                walletDb.find({}).exec(function (err, docs) {
                  if (err) throw err;

                  for (let i = 0; i < docs.length; i++) {
                    const wallet = {
                      name: docs[i].name,
                      masteraddress: docs[i].masteraddress,
                      infos: docs[i].infos,
                      blockchaindirectory: docs[i].blockchaindirectory,
                      keystoredirectory: docs[i].keystoredirectory,
                      datadirectory: docs[i].datadirectory,
                      enode: docs[i].enode,
                      type: docs[i].type,
                      networkid: docs[i].networkid, 
                      contractaddress: docs[i].contractaddress,
                      wsport: docs[i].wsport,
                      wsaddress: docs[i].wsaddress,
                      port: docs[i].port
                    };

                    console.log('found one wallet', wallet);
                    wallets.push(wallet);
                  }

                });
              });
            }
          });
        });
      };

      await searchForFiles(folderPath);
      console.log('before call to ScanedFolderWalletsFound, wallets are::::!', wallets);
      event.reply("ScanedFolderWalletsFound", wallets);
      
    }
  });
}); */


ipcMain.on('getWallets', async (event, arg) => {
  const wallets = [];

  // Prompt user to select a folder
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const folderPath = result.filePaths[0];

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
              port: doc.port
            };

            console.log('found one wallet', wallet);
            wallets.push(wallet);
          }
        }
      }
    };

    await searchForFiles(folderPath);
    console.log('before call to ScanedFolderWalletsFound, wallets are:', wallets);
    event.reply("ScanedFolderWalletsFound", wallets);
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
