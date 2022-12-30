const {app, dialog, ipcMain} = require("electron");
const storage = require("electron-storage");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

const dbPath = path.join(app.getPath("userData"), "storage.db");
const db = new datastore({filename: dbPath});
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
        docs[i].slashduration,
        docs[i].eventtype,
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

ipcMain.on("deleteBlockchainData", (event, arg) => {
  var deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function (file, index) {
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          deleteFolderRecursive(curPath);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  };

  function getBlockchainDataLocation() {
    switch (os.type()) {
      case "Darwin":
        return path.join(os.homedir(), "Library", "Etica", "geth");
        break;
      default:
        return path.join(process.env.APPDATA, "Etica", "geth");
    }
  }

  // delete folder in a synchronous recursive maner
  deleteFolderRecursive(getBlockchainDataLocation());
  event.returnValue = true;
});
