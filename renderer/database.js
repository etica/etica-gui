// In renderer process (web page).
const {ipcRenderer} = require("electron");

class Datatabase {
  constructor() {

    this.filepath = null;

  }


  async getFilepath(){

    let runningwallet = ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    this.filepath = dbWalletDataDirectory+'/counters.json';
    return this.filepath;

  }


  async getCounters() {

    if(this.filepath){
      console.log('getCounters this.filepath ok is', this.filepath);
      var counters = ipcRenderer.sendSync("getJSONFile", this.filepath);
      if (counters == null) {
        counters = {};
      }
      return counters;
    }
    else {

      console.log('getCounters this.filepath not ok is', this.filepath);

      let runningwallet = await ipcRenderer.sendSync("getRunningWallet");
      let dbWalletDataDirectory = runningwallet.datadirectory;
      this.filepath = dbWalletDataDirectory+'/counters.json';

      console.log('this.filepath is now ::: ', this.filepath);
      var counters = ipcRenderer.sendSync("getJSONFile", this.filepath);
      if (counters == null) {
        counters = {};
      }
      return counters;
    }
    
    
  }

  async setCounters(counters) {

  if(this.filepath){
    console.log('setCounters this.filepath ok is', this.filepath);
    let runningwallet = await ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    this.filepath = dbWalletDataDirectory+'/counters.json';
    console.log('setCounters this.filepath is', this.filepath);
    ipcRenderer.sendSync("setJSONFile", {
      file: this.filepath,
      data: counters
    });
  }
  else {
    console.log('setCounters this.filepath not ok is', this.filepath);
    let runningwallet = await ipcRenderer.sendSync("getRunningWallet");
    let dbWalletDataDirectory = runningwallet.datadirectory;
    this.filepath = dbWalletDataDirectory+'/counters.json';

    console.log('setCounters this.filepath is now', this.filepath);
    ipcRenderer.sendSync("setJSONFile", {
      file: this.filepath,
      data: counters
    });

  }

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
