const {ipcRenderer} = require("electron");

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

    let wallets = ipcRenderer.sendSync("getWallets", {});
    console.log('wallets are:', wallets);
    let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: wallets[0].masteraddress});
    console.log('wallets is:', wallet);
    ipcResult = ipcRenderer.send("startGeth", wallet);
  });