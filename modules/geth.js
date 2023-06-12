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

    if (this.logGethEvents) {
      this.logStream = fs.createWriteStream(path.join(app.getPath("userData"), "gethlog.txt"), {flags: "a"});
    }

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
    if (this.logGethEvents) {
      this.logStream.write(text);
    }
  }

  startGeth(wallet) {
    console.log('startGeth called!');
    //EticaGeth._writeLog('startGeth called!' + "\n");
    if(wallet.pw != ''){
      this.#walletpw = wallet.pw;
      wallet.pw = '';
    }
    this.wallet = wallet;
    let _mainnetenodes = '';

    let _networkid = '';
    if(wallet.type == 'mainnet'){
      _networkid = '61803';
      _mainnetenodes = ", enode://19b64dca1f38cbaad3f8c16f08c888bb6d3095c8672fe7a7b5e67d8fbc35d8c3f07b9227b4c8ab83db9bf490c213a743d2f460f191853408a5bc846a5a716d89@127.0.0.1:30303, enode://985d6066ef0bf6814debbef15e7529001ef63ceca9862034d9f42e0d216d05dcf09ae7de2abf020dfd582ac33d584785f8ebe02085b6acb4455f19c7fae713e8@188.166.33.30:30303, enode://45dd40d3be1f059f30a89716dc085181a0081dbb41160da06e34c7d1a3bab04d94e8b1b88ecd98a997acb922cccc55e487ec3d59d87d63b5b25c129b9e5e05b4@72.137.255.179:30319"
    }
    else {
      _networkid = wallet.networkid;
    }

    if (this.logGethEvents && this.wallet) {
      this.logStream = fs.createWriteStream(path.join(this.wallet.datadirectory, "gethlog.txt"), {flags: "a"});
    }

    // let _blockchaindirectory = 'D:/EticaWalletDataDir/blockchaindata';
    //let _keystoredirectory = 'D:/EticaWalletDataDir/keystore';
    // get the path of get and execute the child process
    try {
      this.isRunning = true;
      const gethPath = path.join(this.binaries, "geth");

      this.gethProcess = child_process.spawn(gethPath, [
        "--allow-insecure-unlock",
        "--ws",
        "--ws.origins",
        "*",
        "--ws.addr",
        ""+wallet.wsaddress+"",
        "--ws.port",
        ""+wallet.wsport+"",
        "--port",
        ""+wallet.port+"",
        "--datadir="+wallet.blockchaindirectory+"",
        "--keystore="+wallet.keystoredirectory+"",
        "--ws.api",
        "admin,eth,net,miner,personal,web3",
        "--networkid",
        ""+_networkid+"",
        "--syncmode",
        "snap",
        "--bootnodes",
        ""+wallet.enode+""+_mainnetenodes+""
      ]);

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
         // EticaGeth._writeLog(data.toString() + "\n");
        });
        this.gethProcess.stdout.on("data", function (data) {
         // EticaGeth._writeLog(data.toString() + "\n");
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

    if (fs.existsSync(nodekeyPath)) {
       console.log('Geth data directory has already been initialized, abort');
      // EticaGeth._writeLog("Geth data directory has already been initialized, abort" + "\n");
       event.sender.send('initializeGethResponse', 2);
       return false;
    } else {
       console.log('Geth data directory has not been initialized, keep going');
      // EticaGeth._writeLog("Geth data directory has not been initialized, keep going" + "\n");
    }

    let genesisfile = '';
    let _networkid = '';

    if(wallet.type == 'mainnet'){
      _networkid = '61803';
      genesisfile = path.join(this.rootPath, "needs", "etica_genesis.json");
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
      //EticaGeth._writeLog('initialising geth --datadir'+ datadir + "\n");
      //EticaGeth._writeLog('initialising geth --networkid'+ _networkid + "\n");
      //EticaGeth._writeLog('initialising geth genesisfile'+ genesisfile + "\n");

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
          //EticaGeth._writeLog(`err initialising Geth: ${err}`);
          dialog.showErrorBox("Error initialising Geth", "Geth error when attempts to initialize with this blockchain directory!", err);
        });
        this.gethInitProcess.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
          //EticaGeth._writeLog(`stdout initialising Geth: ${data}`);
        });
        this.gethInitProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
          //EticaGeth._writeLog(`stderr initialising Geth: ${data}`);
        });
        this.gethInitProcess.on("close", function (code) {
            console.log(`gethInitProcess closed with code ${code}`);
           // EticaGeth._writeLog(`gethInitProcess closed with code ${code}`);
        });
        this.gethInitProcess.on('exit', (code) => {
          console.log(`gethInitProcess exited with code ${code}`);
          // EticaGeth._writeLog(`gethInitProcess closed with code ${code}`);
          event.sender.send('initializeGethResponse', code);
          // Do any necessary cleanup or data saving here
        });
      }
    } catch (err) {
      dialog.showErrorBox("Error initialising Geth", err.message);
     // EticaGeth._writeLog(`Error initialising Geth: ${err}`);
    }
  }

  stopGeth() {
    console.log('stopGeth called');
    //EticaGeth._writeLog('stopGeth called' + "\n");
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
