const {app, dialog, ipcMain} = require("electron");
const admZip = require("adm-zip");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");

class Accounts {
  constructor() {}

  getKeyStoreLocation() {
    switch (os.type()) {
      case "Darwin":
        return path.join(os.homedir(), "Library", "Etica", "keystore");
        break;
      default:
        return path.join(process.env.APPDATA.replace('Roaming', 'Local'), "Etica", "keystore");
    }
  }

  exportAccounts() {
    var savePath = dialog.showSaveDialog({
      defaultPath: path.join(app.getPath("documents"), "accounts.zip")
    });

    if (savePath) {
      const accPath = EticaAccounts.getKeyStoreLocation();

      fs.readdir(accPath, function (err, files) {
        var zip = new admZip();

        for (let filePath of files) {
          zip.addFile(filePath, fs.readFileSync(path.join(accPath, filePath)));
        }

        // store zip to path
        zip.writeZip(savePath);
      });
    }
  }

  importAccounts(accountsFile) {
    var extName = path.extname(accountsFile).toUpperCase();
    const accPath = EticaAccounts.getKeyStoreLocation();

    if (extName == ".ZIP") {
      var zip = new admZip(accountsFile);
      zip.extractAllTo(accPath, true);
      return {success: true, text: "Accounts ware successfully imported."};
    } else {
      try {
        fs.copySync(accountsFile, path.join(accPath, path.basename(accountsFile)));
        return {success: true, text: "Account was successfully imported."};
      } catch (err) {
        return {success: false, text: err};
      }
    }
  }

  saveAccount(account) {
    fs.writeFile(path.join(EticaAccounts.getKeyStoreLocation(), "0x" + account.address), JSON.stringify(account), "utf8", function () {
      // file was written
    });
  }
}

ipcMain.on("exportAccounts", (event, arg) => {
  EticaAccounts.exportAccounts();
});

ipcMain.on("importAccounts", (event, arg) => {
  var openPath = dialog.showOpenDialog({
    defaultPath: app.getPath("documents"),
    filters: [
      {
        name: "archive",
        extensions: ["zip"]
      }, {
        name: "json",
        extensions: ["json"]
      }, {
        name: "All",
        extensions: ["*"]
      }
    ]
  });

  if (openPath) {
    event.returnValue = EticaAccounts.importAccounts(openPath[0]);
  } else {
    event.returnValue = {};
  }
});

ipcMain.on("saveAccount", (event, arg) => {
  EticaAccounts.saveAccount(arg);
  event.returnValue = true;
});

EticaAccounts = new Accounts();
