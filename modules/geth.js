const {app, dialog, ipcMain} = require("electron");
const child_process = require("child_process");
const appRoot = require("app-root-path");
const path = require("path");
const fs = require("fs");
const os = require("os");

class Geth {
  constructor() {
    this.isRunning = false;
    this.gethProcess = null;
    this.logGethEvents = false;
    this.wallet = null;
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
    console.log('startGeth called');
    this.wallet = wallet;

    let _networkid = '';
    if(wallet.type == 'mainnet'){
      _networkid = '61803';
    }
    else {
      _networkid = wallet.networkid;
    }

    // let _blockchaindirectory = 'D:/EticaWalletDataDir/blockchaindata';
    //let _keystoredirectory = 'D:/EticaWalletDataDir/keystore';
    // get the path of get and execute the child process
    try {
      this.isRunning = true;
      const gethPath = path.join(this.binaries, "geth");
      /*this.gethProcess = child_process.spawn(gethPath, [
        "--allow-insecure-unlock",
        "--ws",
        "--ws.origins",
        "*",
        "--ws.addr",
        "127.0.0.1",
        "--ws.port",
        "8551",
        "--port",
        "30317",
        "--datadir=./.etica",
        "--ws.api",
        "admin,eth,net,miner,personal,web3",
        "--networkid",
        "61803",
        "--syncmode",
        "snap",
        "--ethstats",
        "wall:etica@72.137.255.182:3100",
        "--bootnodes",
        "enode://98e3be4308da968b5e3fff851294b4f179c0542a8bdf6d981fb298d493b63ac0a31f35a67ab99bc0fcc293b38c120ddcc3ba659bb97554e8dfb0c2439f6601f3@72.137.255.180:30320",
      ]); */

      /* PROD
      this.gethProcess = child_process.spawn(gethPath, [
        "--allow-insecure-unlock",
        "--ws",
        "--ws.origins",
        "*",
        "--ws.addr",
        "127.0.0.1",
        "--ws.port",
        "8551",
        "--port",
        "30317",
        "--datadir=./.etica",
        "--ws.api",
        "admin,eth,net,miner,personal,web3",
        "--networkid",
        "61803",
        "--syncmode",
        "snap",
        "--bootnodes",
        "enode://b0e97d2f1a37b2035a34b97f32fb31ddd93ae822b603c56b7f17cfb189631ea2ef17bfbed904f8bc564765634f2d9db0a128835178c8af9f1dde68ee6b5e2bf7@167.172.47.195:30303",
      ]); PROD */

      // LOCAL DEV NODE FOR TESTING //
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
        ""+wallet.enode+""
      ]); // LOCAL DEV NODE FOR TESTING //

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

  stopGeth() {
    this.isRunning = false;

    if (os.type() == "Windows_NT") {
      const gethWrapePath = path.join(this.binaries, "WrapGeth.exe");
      child_process.spawnSync(gethWrapePath, [this.gethProcess.pid]);
    } else {
      this.gethProcess.kill("SIGTERM");
    }
  }
}

ipcMain.on("stopGeth", (event, arg) => {
  EticaGeth.stopGeth();
});

ipcMain.on("startGeth", (event, arg) => {
  EticaGeth.startGeth(arg);
});

ipcMain.on("getRunningWallet", (event, arg) => {
  event.returnValue = EticaGeth.wallet;
});

EticaGeth = new Geth();
