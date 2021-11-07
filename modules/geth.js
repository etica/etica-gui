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

  startGeth() {
    // get the path of get and execute the child process
    try {
      this.isRunning = true;
      const gethPath = path.join(this.binaries, "geth");
      this.gethProcess = child_process.spawn(gethPath, [
        "--ws",
        "--wsorigins",
        "*",
        "--wsaddr",
        "127.0.0.1",
        "--wsport",
        "8549",
        "--port",
        "30307",
        "--wsapi",
        "admin,db,eth,net,miner,personal,web3",
        "--networkid",
        "1313500",
        "--syncmode",
        "fast",
        "enode://2ede5452542cfe7738c5d18beff2749a25db0b5f4f54ae9920119e89fbcaaba2c520c8c59aa81cec209b859700a2f46bf3db32de9b10d7d79c64a5dacde91257@72.137.255.178:30306,enode://aa8fee1ab4be3c2d0bb7280926b0f6e39bb0ae059e7f27b91ac9a066ee0397dbedd9877d12a5183bf1912c14b463387a714dae8a2fc09654bdea89bc512c3a7f@72.137.255.181:30305,enode://58f90f827a937aa624a47bb6b4e533074fa5845e36237759a4a5dfe8e495b3b2a95b858e1a88b124cea376b7d167b89676f3211f4b86a0e78aa118ac0f343e9c@72.137.255.181:30305,enode://f92ae84be6d19fd7afe691cd88e5440489c6b039012f87e24ded093bdbc96e1991c28812ce0c180c0f3823eb8b561fb09e8f4c5c91e114bcd30c0ccb0cf25a23@192.168.0.161:30303,enode://58f90f827a937aa624a47bb6b4e533074fa5845e36237759a4a5dfe8e495b3b2a95b858e1a88b124cea376b7d167b89676f3211f4b86a0e78aa118ac0f343e9c@72.137.255.181:30305",
        "--ethstats",
        "wn:xerom@stats.mine2.live:3000"
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
          EthoGeth._writeLog(data.toString() + "\n");
        });
        this.gethProcess.stdout.on("data", function (data) {
          EthoGeth._writeLog(data.toString() + "\n");
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
  EthoGeth.stopGeth();
});

EthoGeth = new Geth();
