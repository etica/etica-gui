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
    { $set: { walletname: arg.walletname, walletdirectory: arg.walletdirectory, blockchaindirectory: arg.blockchaindirectory, walletaddress: arg.walletaddress } },
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
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
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


ipcMain.on("assignWalletFoldertoNewWallet", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const walletFolderPath = result.filePaths[0];
      event.reply("NewWalletFolderAssigned", walletFolderPath);
    } else {
      event.reply("NoNewWalletFolderAssigned", '');
      throw new Error("NoNewWalletFolderAssigned");
    }
  } catch (error) {
    event.reply("NoNewWalletFolderAssigned", "");
  }
});


ipcMain.on("assignBlockchainFoldertoNewWallet", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const walletFolderPath = result.filePaths[0];
      event.reply("NewBlockchainFolderAssigned", walletFolderPath);
    } else {
      event.reply("NoNewBlockchainFolderAssigned", '');
      throw new Error("NoNewBlockchainFolderAssigned");
    }
  } catch (error) {
    event.reply("NoNewBlockchainFolderAssigned", "");
  }
});


ipcMain.on("assignWalletFoldertoWalletImport", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const walletFolderPath = result.filePaths[0];
      event.reply("NewWalletFolderAssignedImport", walletFolderPath);
    } else {
      event.reply("NoNewWalletFolderAssignedImport", '');
      throw new Error("NoNewWalletFolderAssignedImport");
    }
  } catch (error) {
    event.reply("NoNewWalletFolderAssignedImport", "");
  }
});


ipcMain.on("assignBlockchainFoldertoWalletImport", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const walletFolderPath = result.filePaths[0];
      event.reply("NewBlockchainFolderAssignedImport", walletFolderPath);
    } else {
      event.reply("NoNewBlockchainFolderAssignedImport", '');
      throw new Error("NoNewBlockchainFolderAssignedImport");
    }
  } catch (error) {
    event.reply("NoNewBlockchainFolderAssignedImport", "");
  }
});


ipcMain.on("assignBlockchainFoldertoWalletResyncSetup", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const walletFolderPath = result.filePaths[0];
      event.reply("NewBlockchainFolderAssignedResyncSetup", walletFolderPath);
    } else {
      event.reply("NoNewBlockchainFolderAssignedResyncSetup", '');
      throw new Error("NoNewBlockchainFolderAssignedResyncSetup");
    }
  } catch (error) {
    event.reply("NoNewBlockchainFolderAssignedResyncSetup", "");
  }
});