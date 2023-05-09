const {app, dialog, ipcMain} = require("electron");
const storage = require("electron-storage");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const fsextra = require("fs-extra");
const os = require("os");

let db;

ipcMain.on("setWalletDataDbPath", (event, arg) => {
  // set dbPath using IPC message
  const dbWalletDataDirectory = arg;
  const dbPath = path.join(dbWalletDataDirectory, "storage.db");

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

// index the txhash field
db.ensureIndex({
  fieldName: "txhash",
  // unique: true // removes unique because we need to show eti smart contract events as transactions, a wallet could receive several smart contract evenets in same transaction
}, function (err) {
  // If there was an error, err is not null
});


});


ipcMain.on("storeTransaction", (event, arg) => {
  db.update({
    txhash: arg.txhash,
    logIndex: arg.logIndex
  }, arg, {
    upsert: true
  }, function (err, numReplaced, upsert) {
    // do nothing for now
  });
});

ipcMain.on("getTransactions", (event, arg) => {
  db.find({}).exec(function (err, docs) {
    ResultData = [];

    // sort the data
    docs.sort((a, b) => {
      if (!b.block && a.block) {
        return 1;
      } else if (b.block && !a.block) {
        return -1;
      } else if (!b.block && !a.block) {
        return (moment(b.timestamp, "YYYY-MM-DD HH:mm:ss").toDate() - moment(a.timestamp, "YYYY-MM-DD HH:mm:ss").toDate());
      } else {
        return b.block - a.block;
      }
    });

    for (i = 0; i < Math.min(docs.length, 500); i++) {
      ResultData.push([
        docs[i].block,
        docs[i].timestamp,
        docs[i].txhash,
        docs[i].fromaddr,
        docs[i].toaddr,
        docs[i].value,
        docs[i].valueeti,
        docs[i].fromaddreti,
        docs[i].toaddreti,
        docs[i].eventtype,
        docs[i].slashduration,
        docs[i].inorout
      ]);
    }

    // return the transactions data
    event.returnValue = ResultData;
  });
});

ipcMain.on("getJSONFile", (event, arg) => {
  storage.get(arg, (err, data) => {
    if (err) {
      event.returnValue = null;
    } else {
      event.returnValue = data;
    }
  });
});

ipcMain.on("setJSONFile", (event, arg) => {
  storage.set(arg.file, arg.data, err => {
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

ipcMain.on("deleteTransactions", (event, arg) => {

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

/* former deleteTransactions() (didnt check if file exist) 
ipcMain.on("deleteTransactions", (event, arg) => {
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
   former deleteTransactions() (didnt check if file exist) */

ipcMain.on("deleteWalletData", (event, arg) => {
  fs.unlink(path.join(app.getPath("userData"), "wallets.json"), err => {
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

/*
ipcMain.on("deleteBlockchainData", (event, arg) => {
  var deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function (file, index) {
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          // only deletes folders that have these names:
          if (["geth", "keystores", "chaindata", "ethash", "lightchaindata", "nodes", "triecache"].includes(file)) {
          // recurse
          deleteFolderRecursive(curPath);
          }
        } else {
          // delete file if name correspond to one of the geth files
          if (fs.lstatSync(filePath).isFile() && (file.startsWith('LOCK') || file.startsWith('nodekey') || file.startsWith('transactions'))) {
          fs.unlinkSync(curPath);
          }
        }
      });
      fs.rmdirSync(path);
    }
  };

  // delete folder in a synchronous recursive maner
  deleteFolderRecursive(arg);

  event.sender.send('initializeGethResponse', 2);


  event.returnValue = true;
}); */

ipcMain.on("deleteBlockchainData", async (event, arg) => {
  try {
    const deleteFolderRecursive = async function (dir) {
      if (await fsextra.exists(dir)) {
        const files = await fsextra.readdir(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          if ((await fsextra.lstat(filePath)).isDirectory()) {
            if (["geth", "keystore", "chaindata", "ethash", "lightchaindata", "nodes", "triecache"].includes(file)) {
              await fsextra.remove(filePath);
              //console.log('removed', filePath);
            }
          } else {
            if ( fsextra.lstat(filePath).isFile() && ["LOCK", "nodekey", "transactions"].some((prefix) => file.startsWith(prefix))) {
              fsextra.unlinkSync(filePath);
            }
          }
        }
        
        // dont remove main blockchain folder:
        if(path.resolve(dir) != path.resolve(arg)){
          fsextra.rmdirSync(dir);
        }
       
      }
    };

    await deleteFolderRecursive(arg);
  // console.log('Blockchain folder deleted with success');
    event.sender.send("deleteBlockchainDataResponse", true);
  } catch (error) {
    console.error("Error deleting blockchain data:", error);
    event.sender.send("deleteBlockchainDataResponse", false);
  }
});


ipcMain.on("deleteAddressKeystore", (event, arg) => {

  var deleteKeytore = function (){
  // deletes all files in address keysotre, make sure file starts with UTC-- 
  //to make sure not to delete unwanted files even if we assume only keystore files should be in that folder:
  const keystorePath = arg;
  if (fs.existsSync(keystorePath)) {
    fs.readdirSync(keystorePath).forEach((file) => {
      const filePath = path.join(keystorePath, file);
      if (fs.lstatSync(filePath).isFile() && file.startsWith('UTC--')) {
        fs.unlinkSync(filePath);
      }
    });
  }
  };

  deleteKeytore();
  event.returnValue = true;

});