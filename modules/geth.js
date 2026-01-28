const {app, dialog, ipcMain} = require("electron");
const child_process = require("child_process");
const appRoot = require("app-root-path");
const path = require("path");
const fs = require("fs");
const os = require("os");

class Geth {

  #walletpw; // privateVariable

  // Mainnet bootstrap enodes (verified active as of 2026-01-28)
  // Run `node scripts/check-all-enodes.js` to verify and update
  static MAINNET_ENODES = [
    "enode://b0e97d2f1a37b2035a34b97f32fb31ddd93ae822b603c56b7f17cfb189631ea2ef17bfbed904f8bc564765634f2d9db0a128835178c8af9f1dde68ee6b5e2bf7@167.172.47.195:30303",
    "enode://363a353e050862630ea27807c454eb118d5893600ea0cc1aa66fcdf427d0da458da50d5ac4c43b95205acaa2c21b949f7f1000158a2a63819926f71571172356@142.93.138.113:30303",
    "enode://7f2d5370b11c604f348da0ce62ad21aafa32cf7136c94496dbf39bf261e6c317dea25e41dfc20894f89e30c4a4b1a76f52e3742fffd77c690f8d5e1c3ae1c2b4@62.72.177.101:30310",
    "enode://44024f1df7351de1e0de9484f9289cc49255ed8dea626acf18e8fe70fa87e42f7202e52c048a8ff24bebf0cb5cb5d97eaf3557bb6a32d9724f0a205b1dfea6d4@62.72.177.101:30303",
    "enode://05e849326b412dd1c22886a246f71f87268410724623e0defa93a7d658fae4ae2bcdf249c3044292062224d322834e39161649b2fcb879d8455f567e3213113a@62.72.177.101:30303",
    "enode://7deed4aa7e35420266ee09c11f0040c66977f86a85d8e45403215651974d0e0f491d0426c82dce96ccdb361d8b0431592eb591ecb7a66af5f950a2e539ceb0e5@156.67.29.122:30303",
    "enode://c74c0784a05533722cdbd10c4ebd99fc9effaf13b180f146183899ee380e7e30ea3f4da00454780d114408d0fe48856d99013473f6034730912e0b97fde3c4e4@128.199.38.119:30303",
    "enode://72626a3059948842b1b978bbdb7abc1e7427ace2cb7d94a719b4b1d114d4c57dbabb35b7270feb11c64d0d04f3a1a121624523b15efaf006c96b4c2e38fb35b1@167.86.96.115:30317",
    "enode://363a411c017a8a1413b1c8b96cb15340f871973d20c5d7436f5f771c8cd52ad4a55e2b634d866e02796aae70bef0b26c6c3aefdb8d1caab6c61ee378aebaf65d@46.101.129.218:30303",
    "enode://2d49074560bb529f6e21f1f4218ab51e0ded6528e27c1f7f9abec0f2b388bbb45a6b6f8ad16c287fa8e509e2c0c59b0d6778bcd8ec842ca0c745672cea568e4c@77.57.208.155:30303",
    "enode://68f47b809269209d4248356f4d5f0b618f2afd5f0db3f063eb5aca9c9fffefaa894ce87a64a13cee594bcb67c2f73d3a22da3ba7414b761afc73f6f230c28cf3@149.50.110.33:30303"
  ];

  // Crucible testnet bootstrap enodes
  static CRUCIBLE_ENODES = [
    "enode://0ec6601481d306247570eb37a4afea48c64e4e732cb2c314df996ad92850ec52a9c3283a6c3c981fbe4447ea4888b26f67ef4ea53177c71c228496a5b09db8c1@173.212.202.226:30303",
    "enode://d02285519beae603f99898592734303a57e128fb2308410761a7bc91e77af99f2f1cbac037c4fe2154225b7cb538d5b516c66015352886a4326b74d59224cca1@72.137.255.178:47422",
    "enode://977e304183463414fa9ce158aea6b8b8d0c6062c1ea1167a496067cb77bdf0237f28d8a267efe4bf28ec7fac7720921ba7370bb510845247985cdddfaefa2dfe@141.98.153.127:37582",
    "enode://7e7b8f546a5b961020bacca64fed5dc832d30c6b8f9d95ce1a91456804f9fe8101c80c533315870c21a97119f09f1a4a2479fffea9499a62c3b8a0516fc50006@72.137.255.178:58680",
    "enode://d6c7e5d382cae46765ecd7eadfc3bf5a0a4ed15ab422b59bb51c1d6ed17a867adc45462068fd95987d09a4d2a41aa6a2ceae167c82476deffbae8bccfcc6b999@72.137.255.179:48294",
    "enode://02c2c9c0a4ac4e5269a6821d072d1b1b1afd9d5f7b12d8b9581c240f146189a565baace858e5925241a0a2890cc56b41f28d4d7ac9b9344bb1a18c5976b40ad3@72.137.255.180:35122"
  ];

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

  /**
   * Fisher-Yates shuffle algorithm to randomize array order.
   * This distributes load across bootstrap nodes by randomizing connection order.
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array (new array, original unchanged)
   */
  _shuffleArray(array) {
    const shuffled = [...array]; // Create a copy
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Load additional enodes from static-nodes.json if it exists.
   * @returns {Array} - Array of enode strings from static-nodes.json, or empty array if not found
   */
  _loadStaticNodes() {
    try {
      const staticNodesPath = path.join(this.rootPath, "needs", "static-nodes.json");
      if (fs.existsSync(staticNodesPath)) {
        const content = fs.readFileSync(staticNodesPath, 'utf8');
        const nodes = JSON.parse(content);
        if (Array.isArray(nodes)) {
          // Filter to only valid enode strings
          return nodes.filter(node => typeof node === 'string' && node.startsWith('enode://'));
        }
      }
    } catch (err) {
      console.log('Failed to load static-nodes.json:', err.message);
    }
    return [];
  }

  /**
   * Get randomized bootnode string for a given network type.
   * Combines hardcoded enodes with static-nodes.json, removes duplicates, and shuffles.
   * @param {string} networkType - 'mainnet', 'crucible', or 'custom'
   * @param {string} userEnode - User-configured enode (optional)
   * @returns {string} - Comma-separated enode string for --bootnodes flag
   */
  _getBootnodes(networkType, userEnode = null) {
    let enodes = [];

    // Get network-specific enodes
    if (networkType === 'mainnet') {
      enodes = [...Geth.MAINNET_ENODES];
    } else if (networkType === 'crucible') {
      enodes = [...Geth.CRUCIBLE_ENODES];
    }

    // Load and merge static-nodes.json (mainnet only)
    if (networkType === 'mainnet') {
      const staticNodes = this._loadStaticNodes();
      enodes = enodes.concat(staticNodes);
    }

    // Remove duplicates (by enode ID, not full URL in case ports differ)
    const seen = new Set();
    enodes = enodes.filter(enode => {
      // Extract enode ID (the part between enode:// and @)
      const match = enode.match(/enode:\/\/([a-fA-F0-9]+)@/);
      if (match) {
        const enodeId = match[1].toLowerCase();
        if (seen.has(enodeId)) {
          return false;
        }
        seen.add(enodeId);
        return true;
      }
      return true; // Keep if we can't parse (shouldn't happen)
    });

    // Shuffle to distribute load across nodes
    enodes = this._shuffleArray(enodes);

    // Add user enode at the beginning if provided (user's preferred node gets priority)
    if (userEnode && typeof userEnode === 'string' && userEnode.startsWith('enode://')) {
      // Remove user enode from list if it's already there (to avoid duplicate)
      const userMatch = userEnode.match(/enode:\/\/([a-fA-F0-9]+)@/);
      if (userMatch) {
        const userId = userMatch[1].toLowerCase();
        enodes = enodes.filter(e => {
          const m = e.match(/enode:\/\/([a-fA-F0-9]+)@/);
          return !m || m[1].toLowerCase() !== userId;
        });
      }
      enodes.unshift(userEnode);
    }

    return enodes.join(',');
  }

  startGeth(wallet) {
    console.log('startGeth called!');

    if(wallet.pw != ''){
      this.#walletpw = wallet.pw;
      wallet.pw = '';
    }
    this.wallet = wallet;

    let _networkid = '';
    let _chainflagname = '';
    let _networkType = 'custom';
    let _bootnodes = '';

    if(wallet.type == 'mainnet'){
      _chainflagname = '--etica';
      _networkid = '61803';
      _networkType = 'mainnet';
    }
    else if(wallet.networkid == 61888){
      _chainflagname = '--crucible';
      _networkid = '61888';
      _networkType = 'crucible';
    }
    else {
      _networkid = wallet.networkid;
      _networkType = 'custom';
    }

    // Get randomized bootnodes (combines hardcoded + static-nodes.json, shuffled for load distribution)
    _bootnodes = this._getBootnodes(_networkType, wallet.enode);

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
        _bootnodes
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


  // New function created specifically for the new Resync system, don't stop the process if Geth already initialised to allow users to resync with blockchain folders already initialised:
  initializeGethForResync(wallet, event) {
    
    const datadir = wallet.blockchaindirectory;
    const nodekeyPath = `${datadir}/geth/nodekey`;

    if (this.logGethEvents && wallet && !this.logStream) {
      this.logStream = fs.createWriteStream(path.join(wallet.datadirectory, "gethlog.txt"), {flags: "a"});
    }

    if (fs.existsSync(nodekeyPath)) {
       console.log('Since it is for resyncing with an existing initialised blockchain directory dont send error, keep going the process');
       //EticaGeth._writeLog("Geth data directory has already been initialized, abort" + "\n");
       event.sender.send('initializeGethResponse', 0);
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

ipcMain.on("initializeGethForResync", (event, arg) => {
  EticaGeth.initializeGethForResync(arg, event);
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
