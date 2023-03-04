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
      $('#walletsList').append(`<li class="onewalletli"><a data-address="${onewallet.masteraddress}" href="#" class="onewalletlist">${onewallet.name}</a></li>`);
    });

    $("#SelectWalletsfromListModal").css("display", "block");
    let _directorymsg = 'Etica wallets found in directory: '+ walletFolderPath;
    $("#checkeddirectorymsg").html(_directorymsg);

    // if directory verified and write user password, set all ds to walletdirectory and launch geth, then relocate to index.html:
    //let setwalletdirectory = ipcRenderer.sendSync("setWalletDataDbPath", {walletFilePath: walletFilePath});
    //ipcResult = ipcRenderer.send("startGeth", wallet);
  });

  $("#selectWalletFolder").off("click").on("click", function () {
    let selectwallet = ipcRenderer.sendSync("selectWalletFolder");
  });


  $(".onewalletli").off("click").on("click", function () {
    console.log('clicked on wallet name');
    var walletAddress = $(this).attr("data-address");

    console.log('getting wallet with walletAddress:', walletAddress);

    let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});
    console.log('wallets found is:', wallet);

    let setwalletdirectory = ipcRenderer.sendSync("setWalletDataDbPath", {walletFilePath: wallet.datadirectory});
    let ipcResult = ipcRenderer.send("startGeth", wallet);
    window.location.replace('./../../../index.html');


    // use if connection with password, check unlock wallet with password before launching wallet:
    function doLaunchWallet() {
      

// if directory verified and write user password, set all ds to walletdirectory and launch geth, then relocate to index.html:
    //let setwalletdirectory = ipcRenderer.sendSync("setWalletDataDbPath", {walletFilePath: walletFilePath});
    //ipcResult = ipcRenderer.send("startGeth", wallet);


    }

    $("#btnChangeAddressNameConfirm").off("click").on("click", function () {
      LaunchWallet();
    });

    $("#dlgChangeAddressName").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        LaunchWallet();
      }
    });
  });


  $(".onewalletlist").off("click").on("click", function () {
    console.log('clicked on wallet name2');
  });

  async function ScanDirforWallets(){

    let checkwalletdirectory = ipcRenderer.send("checkWalletDataDbPath", walletFolderPath);
    
    let wallets = ipcRenderer.sendSync("getWallets", {});
    console.log('wallets founds are:', wallets);
    let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: wallets[0].masteraddress});
    console.log('wallets found is:', wallet);

    wallets.forEach(onewallet => {
      $('#walletsList').append(`<li><a id="${onewallet.masteraddress}" data-address="${onewallet.masteraddress}" href="#" class="onewalletlist">${onewallet.name} (${onewallet.type})</a></li>`);
    });

    const links = document.querySelectorAll(".onewalletlist");

// Add event listeners to each <a> element
links.forEach(link => {
  link.addEventListener("click", function() {
    testone(this.getAttribute("data-address"));
  });
});

    $("#SelectWalletsfromListModal").css("display", "block");
    let _directorymsg = 'Etica wallets found in directory: '+ walletFolderPath;
    $("#checkeddirectorymsg").html(_directorymsg);

  }

  function testone(i){
    console.log('testone called');
    console.log('testone called with address', i);

    console.log('clicked on wallet name');
    var walletAddress = i;

    console.log('getting wallet with walletAddress:', walletAddress);

    let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});
    console.log('wallets found is:', wallet);

    let setwalletdirectory = ipcRenderer.send("setWalletDataDbPath", wallet.datadirectory);
    let ipcResult = ipcRenderer.send("startGeth", wallet);
    window.location.replace('./index.html');

  }

  
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
    ScanDirforWallets();
  });


  ipcRenderer.on("walletDataLoaded", (event, _walletData) => {
    // Do something with the walletFilePath, such as load the wallet data
    console.log("walletDataLoaded:", _walletData);

  });