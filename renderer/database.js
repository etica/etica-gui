// In renderer process (web page).
const {ipcRenderer} = require("electron");

class Datatabse {
  constructor() {}

  getCounters() {
    var counters = ipcRenderer.sendSync("getJSONFile", "counters.json");

    if (counters == null) {
      counters = {};
    }

    return counters;
  }

  setCounters(counters) {
    ipcRenderer.sendSync("setJSONFile", {
      file: "counters.json",
      data: counters
    });
  }

  getWallets() {
    var wallets = ipcRenderer.sendSync("getJSONFile", "wallets.json");

    if (!wallets) {
      wallets = {
        names: {}
      };
    }

    return wallets;
  }

  setWallets(wallets) {
    ipcRenderer.sendSync("setJSONFile", {
      file: "wallets.json",
      data: wallets
    });
  }

  getAddresses() {
    var addressBook = ipcRenderer.sendSync("getJSONFile", "addresses.json");

    if (!addressBook) {
      addressBook = {
        names: {}
      };
    }

    return addressBook;
  }

  setAddresses(addresses) {
    ipcRenderer.sendSync("setJSONFile", {
      file: "addresses.json",
      data: addresses
    });
  }
}

// create new account variable
EticaDatabase = new Datatabse();
