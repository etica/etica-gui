// In renderer process (web page).
const {ipcRenderer} = require("electron");

class Datatabase {
  constructor() {

    this.filepath = null;

  }

  getAddressesNames() {
    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    let _filepath = dbWalletDataDirectory+'/wallets.json';
    var addressesnames = ipcRenderer.sendSync("getJSONFile", _filepath);

    if (!addressesnames) {
      addressesnames = {
        names: {}
      };
    }

    return addressesnames;
  }

  setAddressesNames(addressesnames) {
    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    let _filepath = dbWalletDataDirectory+'/wallets.json';
    ipcRenderer.sendSync("setJSONFile", {
      file: _filepath,
      data: addressesnames
    });
  }

  getAddresses() {
    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    let _filepath = dbWalletDataDirectory+'/addresses.json';
    var addressBook = ipcRenderer.sendSync("getJSONFile", _filepath);

    if (!addressBook) {
      addressBook = {
        names: {}
      };
    }

    return addressBook;
  }

  setAddresses(addresses) {
    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    let _filepath = dbWalletDataDirectory+'/addresses.json';
    ipcRenderer.sendSync("setJSONFile", {
      file: "addresses.json",
      data: addresses
    });
  }
}



// create new account variable
EticaDatabase = new Datatabase();
