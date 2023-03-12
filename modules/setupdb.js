const {app, dialog, ipcMain} = require("electron");
const datastore = require("nedb");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const os = require("os");

const dbPath = path.join(app.getPath("userData"), "setupdirectory.db");
const db = new datastore({filename: dbPath});
db.loadDatabase(function (err) {
  // Now commands will be executed
});


/* Settup settings:
                  registerdirectory: Directory where Wallets list is stored
                  default_blockchaindirectory: last used Directory for blockchain
                  default_keystoredirectory: last used Directory for keystore
*/

ipcMain.on("InsertOrUpdateWalletPreload", (event, arg) => {
  db.update(
    { keyword: arg.keyword },
    { $set: { walletname: arg.walletname, walletdirectory: arg.walletdirectory, walletaddress: arg.walletaddress } },
    { upsert: true },
    function (err, doc) {
      // do nothing for now
    }
  );
});


ipcMain.on("getWalletPreload", (event, arg) => {
  db.findOne({
    keyword: arg
  }).exec(function (err, _walletpreload) {
    event.returnValue = _walletpreload;
  });
});


// Prompt user to select a wallet file:
ipcMain.on("selectWalletFile", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const walletFilePath = result.filePaths[0];
    event.reply("walletFileSelected", walletFilePath);
  }
});

ipcMain.on("selectWalletFolder", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const walletFolderPath = result.filePaths[0];
      event.reply("walletFolderSelected", walletFolderPath);
    } else {
      event.reply("NowalletFolderSelected", '');
      throw new Error("NowalletFolderSelected");
    }
  } catch (error) {
    event.reply("NowalletFolderSelected", "");
  }
});