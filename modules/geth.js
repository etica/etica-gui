const {app, dialog, ipcMain} = require("electron");
const child_process = require("child_process");
const appRoot = require("app-root-path");
const path = require("path");
const fs = require("fs");
const os = require("os");

class Geth {

  #walletpw; // privateVariable

  constructor() {
    this.isRunning = false;
    this.gethProcess = null;
    this.gethInitProcess = null;
    this.logGethEvents = false;
    this.wallet = null;
    this.#walletpw = null;
    // create the user data dir (needed for MacOS)
    if (!fs.existsSync(app.getPath("userData"))) {
      fs.mkdirSync(app.getPath("userData"));
    }

    /*
    if (this.logGethEvents) {
      this.logStream = fs.createWriteStream(path.join(app.getPath("userData"), "gethlog.txt"), {flags: "a"});
    } */

    if (appRoot.path.indexOf("app.asar") > -1) {
      this.rootPath = path.dirname(appRoot.path);
    } else {
      this.rootPath = appRoot.path;
    }

    switch (os.type()) {
      case "Linux":
        this.binaries = path.join(this.rootPath, "bin", "linux");
        break;
      case "Darwin":
        this.binaries = path.join(this.rootPath, "bin", "macos");
        break;
      case "Windows_NT":
        this.binaries = path.join(this.rootPath, "bin", "win");
        break;
      default:
        this.binaries = path.join(this.rootPath, "bin", "win");
    }
  }

  _writeLog(text) {
    if (this.logGethEvents && this.logStream) {
      this.logStream.write(text);
    }
  }

  startGeth(wallet) {
    console.log('startGeth called!');

    if(wallet.pw != ''){
      this.#walletpw = wallet.pw;
      wallet.pw = '';
    }
    this.wallet = wallet;
    let _mainnetenodes = '';

    let _networkid = '';
    let _chainflagname = '';
    if(wallet.type == 'mainnet'){
      _chainflagname = '--etica';
      _networkid = '61803';
      _mainnetenodes = ", enode://16623935be2a6e6fa33dbac1ece5c234f41a3fd547081c70d56ae732bfa03f6dd6c11eb351708236c81281798535b5e7e9fc9592904e05b08aa5c0b77d542ef0@149.102.133.68:38430, enode://4d2750b64f0538297861289ccf4aa30c81d94c44b381dc8a49a537b4dcb12c7fa19e6b0e3ff3cf59c68259ee6f8f5b5292db3ebcedf9c9cfb281c28adcaa9a04@72.137.255.179:60588, enode://995472c711aaeabb40bfca0e3901fec76e934da6b7b63ac372845027308416abb622ccd409689e2a53e6e2dcbac3bacd973eacc2db60967660e994dc10d720fa@109.205.180.147:37842, enode://363a353e050862630ea27807c454eb118d5893600ea0cc1aa66fcdf427d0da458da50d5ac4c43b95205acaa2c21b949f7f1000158a2a63819926f71571172356@142.93.138.113:30303, enode://b0e97d2f1a37b2035a34b97f32fb31ddd93ae822b603c56b7f17cfb189631ea2ef17bfbed904f8bc564765634f2d9db0a128835178c8af9f1dde68ee6b5e2bf7@167.172.47.195:30303, enode://985d6066ef0bf6814debbef15e7529001ef63ceca9862034d9f42e0d216d05dcf09ae7de2abf020dfd582ac33d584785f8ebe02085b6acb4455f19c7fae713e8@188.166.33.30:30303, enode://19b64dca1f38cbaad3f8c16f08c888bb6d3095c8672fe7a7b5e67d8fbc35d8c3f07b9227b4c8ab83db9bf490c213a743d2f460f191853408a5bc846a5a716d89@46.101.129.218:52222"
    }
    else if(wallet.networkid == 61888){
      _chainflagname = '--crucible';
      _networkid = '61888';
      _mainnetenodes = ", enode://0ec6601481d306247570eb37a4afea48c64e4e732cb2c314df996ad92850ec52a9c3283a6c3c981fbe4447ea4888b26f67ef4ea53177c71c228496a5b09db8c1@173.212.202.226:30303, enode://d02285519beae603f99898592734303a57e128fb2308410761a7bc91e77af99f2f1cbac037c4fe2154225b7cb538d5b516c66015352886a4326b74d59224cca1@72.137.255.178:47422, enode://977e304183463414fa9ce158aea6b8b8d0c6062c1ea1167a496067cb77bdf0237f28d8a267efe4bf28ec7fac7720921ba7370bb510845247985cdddfaefa2dfe@141.98.153.127:37582, enode://7e7b8f546a5b961020bacca64fed5dc832d30c6b8f9d95ce1a91456804f9fe8101c80c533315870c21a97119f09f1a4a2479fffea9499a62c3b8a0516fc50006@72.137.255.178:58680, enode://d6c7e5d382cae46765ecd7eadfc3bf5a0a4ed15ab422b59bb51c1d6ed17a867adc45462068fd95987d09a4d2a41aa6a2ceae167c82476deffbae8bccfcc6b999@72.137.255.179:48294, enode://02c2c9c0a4ac4e5269a6821d072d1b1b1afd9d5f7b12d8b9581c240f146189a565baace858e5925241a0a2890cc56b41f28d4d7ac9b9344bb1a18c5976b40ad3@72.137.255.180:35122"
    }
    else {
      _networkid = wallet.networkid;
    }

    if (this.logGethEvents && this.wallet && !this.logStream) {
      this.logStream = fs.createWriteStream(path.join(this.wallet.datadirectory, "gethlog.txt"), {flags: "a"});
    }
    
    EticaGeth._writeLog('startGeth called!' + "\n");
    
    // let _blockchaindirectory = 'D:/EticaWalletDataDir/blockchaindata';
    //let _keystoredirectory = 'D:/EticaWalletDataDir/keystore';
    // get the path of get and execute the child process
    try {
      this.isRunning = true;
      const gethPath = path.join(this.binaries, "geth");

      const args = [
        "--allow-insecure-unlock",
        "--ws",
        "--ws.origins=*",
        "--ws.addr",
        ""+wallet.wsaddress+"",
        "--ws.port",
        ""+wallet.wsport+"",
        "--authrpc.port",
        "8545",
        "--port",
        ""+wallet.port+"",
        "--datadir="+wallet.blockchaindirectory+"",
        "--keystore="+wallet.keystoredirectory+"",
        "--ws.api",
        "eth,net,web3,personal",
        "--syncmode",
        "snap",
        "--bootnodes",
        ""+wallet.enode+""+_mainnetenodes+""
      ];

      if (_chainflagname != '') {
        args.unshift(_chainflagname);
      }
      else {
        args.unshift(wallet.networkid);
        args.unshift("--networkid");
      }

      this.gethProcess = child_process.spawn(gethPath, args);

      if (!this.gethProcess) {
        dialog.showErrorBox("Error starting application", "Geth failed to start!");
        app.quit();
      } else {
        this.gethProcess.on("error", function (err) {
          dialog.showErrorBox("Error starting application", "Geth failed to start!");
          app.quit();
        });
        this.gethProcess.on("close", function (err) {
          if (this.isRunning) {
            dialog.showErrorBox("Error running the node", "The node stoped working. The Wallet will close!");
            app.quit();
          }
        });
        this.gethProcess.stderr.on("data", function (data) {
        EticaGeth._writeLog(data.toString() + "\n");
        });
        this.gethProcess.stdout.on("data", function (data) {
        EticaGeth._writeLog(data.toString() + "\n");
        });
      }
    } catch (err) {
      dialog.showErrorBox("Error starting application", err.message);
      app.quit();
    }
  }

  initializeGeth(wallet, event) {
    
    const datadir = wallet.blockchaindirectory;
    const nodekeyPath = `${datadir}/geth/nodekey`;

    if (this.logGethEvents && wallet && !this.logStream) {
      this.logStream = fs.createWriteStream(path.join(wallet.datadirectory, "gethlog.txt"), {flags: "a"});
    }

    if (fs.existsSync(nodekeyPath)) {
       console.log('Geth data directory has already been initialized, abort');
       EticaGeth._writeLog("Geth data directory has already been initialized, abort" + "\n");
       event.sender.send('initializeGethResponse', 2);
       return false;
    } else {
       console.log('Geth data directory has not been initialized, keep going');
       EticaGeth._writeLog("Geth data directory has not been initialized, keep going" + "\n");
    }

    let genesisfile = '';
    let _networkid = '';

    if(wallet.type == 'mainnet'){
      _networkid = '61803';
      genesisfile = path.join(this.rootPath, "needs", "etica_genesis.json");
    }
    else if (wallet.networkid == 61888){
      _networkid = wallet.networkid;
      genesisfile = path.join(this.rootPath, "needs", "crucible_genesis.json");
    }
    else {
      _networkid = wallet.networkid;
      genesisfile = path.join(this.rootPath, "needs", "testnet_genesis.json");
    }

    try {
      const gethPath = path.join(this.binaries, "geth");
      //console.log('initialising geth --datadir', datadir);
      //console.log('initialising geth --networkid', _networkid);
      //console.log('initialising geth genesisfile', genesisfile);
      EticaGeth._writeLog('initialising geth --datadir'+ datadir + "\n");
      EticaGeth._writeLog('initialising geth --networkid'+ _networkid + "\n");
      EticaGeth._writeLog('initialising geth genesisfile'+ genesisfile + "\n");

      this.gethInitProcess = child_process.spawn(gethPath, [
        "--datadir="+datadir+"",
        "--networkid",
        ""+_networkid+"",
        "init",
         ""+genesisfile+""
      ]);

      if (!this.gethInitProcess) {
        dialog.showErrorBox("Error initialising Geth", "Geth to initialize this blockchain directory!");
      } else {
        this.gethInitProcess.on("error", function (err) {
          console.log(`err: ${err}`);
          EticaGeth._writeLog(`err initialising Geth: ${err}`);
          dialog.showErrorBox("Error initialising Geth", "Geth error when attempts to initialize with this blockchain directory!", err);
        });
        this.gethInitProcess.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
          EticaGeth._writeLog(`stdout initialising Geth: ${data}`);
        });
        this.gethInitProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
          EticaGeth._writeLog(`stderr initialising Geth: ${data}`);
        });
        this.gethInitProcess.on("close", function (code) {
            console.log(`gethInitProcess closed with code ${code}`);
            EticaGeth._writeLog(`gethInitProcess closed with code ${code}`);
        });
        this.gethInitProcess.on('exit', (code) => {
          console.log(`gethInitProcess exited with code ${code}`);
          EticaGeth._writeLog(`gethInitProcess closed with code ${code}`);
          event.sender.send('initializeGethResponse', code);
          // Do any necessary cleanup or data saving here
        });
      }
    } catch (err) {
      dialog.showErrorBox("Error initialising Geth", err.message);
      EticaGeth._writeLog(`Error initialising Geth: ${err}`);
    }
  }

  stopGeth() {
    console.log('stopGeth called');
    EticaGeth._writeLog('stopGeth called' + "\n");
    this.isRunning = false;
    this.wallet = null;

    if (os.type() == "Windows_NT") {
      const gethWrapePath = path.join(this.binaries, "WrapGeth.exe");
      child_process.spawnSync(gethWrapePath, [this.gethProcess.pid]);
    } else {
      this.gethProcess.kill("SIGTERM");
    }
  }

  getTempPw() {
    let _p = this.#walletpw;
    this.#walletpw = null;
    return _p;
  }

}

ipcMain.on("stopGeth", (event, arg) => {
  EticaGeth.stopGeth();
});

ipcMain.on("startGeth", (event, arg) => {
  EticaGeth.startGeth(arg);
});

ipcMain.on("initializeGeth", (event, arg) => {
  EticaGeth.initializeGeth(arg, event);
});

ipcMain.on("getRunningWallet", (event, arg) => {
  event.returnValue = EticaGeth.wallet;
});

ipcMain.on("getTempPw", (event, arg) => {
  event.returnValue = EticaGeth.getTempPw();
});

ipcMain.on("IsGethRunning", (event, arg) => {
  event.returnValue = EticaGeth.isRunning;
});


ipcMain.on("updateGethRunningWalletSettings", (event, arg) => {
  if(EticaGeth.wallet){
    EticaGeth.wallet = arg;
  }
});

EticaGeth = new Geth();
