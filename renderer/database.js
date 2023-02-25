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

  getAddressesNames() {
    var addressesnames = ipcRenderer.sendSync("getJSONFile", "wallets.json");

    if (!addressesnames) {
      addressesnames = {
        names: {}
      };
    }

    return addressesnames;
  }

  setAddressesNames(addressesnames) {
    ipcRenderer.sendSync("setJSONFile", {
      file: "wallets.json",
      data: addressesnames
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
