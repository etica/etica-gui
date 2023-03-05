// In renderer process (web page).
const {ipcRenderer} = require("electron");

class Datatabase {
  constructor() {


  }

  getCounters() {
    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    let _filepath = dbWalletDataDirectory+'/counters.json';
    console.log('getCounters _filepath is', _filepath);
    var counters = ipcRenderer.sendSync("getJSONFile", _filepath);

    if (counters == null) {
      counters = {};
    }

    return counters;
  }

  setCounters(counters) {
    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    let _filepath = dbWalletDataDirectory+'/counters.json';
    console.log('setCounters _filepath is', _filepath);
    ipcRenderer.sendSync("setJSONFile", {
      file: _filepath,
      data: counters
    });
  }

  getAddressesNames() {
    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    let _filepath = dbWalletDataDirectory+'/wallets.json';
    console.log('getAddressesNames _filepath is', _filepath);
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
    console.log('setAddressesNames _filepath is', _filepath);
    ipcRenderer.sendSync("setJSONFile", {
      file: _filepath,
      data: addressesnames
    });
  }

  getAddresses() {
    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    let _filepath = dbWalletDataDirectory+'/addresses.json';
    console.log('getAddresses _filepath is', _filepath);
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
    console.log('setAddresses _filepath is', _filepath);
    ipcRenderer.sendSync("setJSONFile", {
      file: "addresses.json",
      data: addresses
    });
  }
}



// create new account variable
EticaDatabase = new Datatabase();
