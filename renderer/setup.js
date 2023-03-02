const {ipcRenderer} = require("electron");
const path = require("path");

let walletFilePath;
let walletFolderPath;

 $("#launchWallet").off("click").on("click", function () {

    
  /*let wallet = {};

    wallet.name = "Wallet D",
    wallet.masteraddress = "0x76925DBe657C695A32a804a22106CFFb0057Fd96",
    wallet.infos = "",
    wallet.blockchaindirectory = 'D:/EticaWalletDataDir/blockchaindata';
    wallet.keystoredirectory = 'D:/EticaWalletDataDir/keystore';
    wallet.datadirectory = 'D:/EticaWalletDataDir/datadirectory';
    wallet.enode = 'enode://56427938056c62a4a3f3bd1d7411e590ed8667e69712d3eb7474293f0bbf94aa4c1d11cb3a8b6ce0a86c31c4a6b1048796eaa8afb984b66be4990a10cf1dc9e7@127.0.0.1:30303';
    wallet.type = "testnet";
    wallet.networkid = "686970";
    wallet.wsport = "8551";
    wallet.wsaddress =  "127.0.0.1";
    wallet.port = "30317"; */


    let checkwalletdirectory = ipcRenderer.send("checkWalletDataDbPath", walletFolderPath);
    
    let wallets = ipcRenderer.sendSync("getWallets", {});
    console.log('wallets founds are:', wallets);
    let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: wallets[0].masteraddress});
    console.log('wallets found is:', wallet);

    wallets.forEach(onewallet => {
      $('#walletsList').append(`<li id="${onewallet.masteraddress}" class="onewalletlist">${onewallet.name}</li>`);
    });

    $("#SelectWalletsfromListModal").css("display", "block");

    // if directory verified and write user password, set all ds to walletdirectory and launch geth, then relocate to index.html:
    //let setwalletdirectory = ipcRenderer.sendSync("setWalletDataDbPath", {walletFilePath: walletFilePath});
    //ipcResult = ipcRenderer.send("startGeth", wallet);
  });

  $("#selectWalletFolder").off("click").on("click", function () {
    let selectwallet = ipcRenderer.sendSync("selectWalletFolder");
  });

  
/*
  ipcRenderer.on("walletFileSelected", (event, _walletFilePath) => {
    // Do something with the walletFilePath, such as load the wallet data
    console.log("Wallet file selected:", _walletFilePath);
    walletFilePath = _walletFilePath;

    console.log("walletFilePath is now:", walletFilePath);

    walletFolderPath = path.dirname(walletFilePath);
    console.log("walletFolderPath is now:", walletFolderPath);
  }); */


  ipcRenderer.on("walletFolderSelected", (event, _walletFolderPath) => {
    // Do something with the walletFilePath, such as load the wallet data

    console.log("walletFolderPath is updating");

    walletFolderPath = _walletFolderPath;
    console.log("walletFolderPath is now:", _walletFolderPath);
  });


  ipcRenderer.on("walletDataLoaded", (event, _walletData) => {
    // Do something with the walletFilePath, such as load the wallet data
    console.log("walletDataLoaded:", _walletData);

  });