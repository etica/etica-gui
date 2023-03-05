const {ipcRenderer} = require("electron");
const path = require("path");

let walletFilePath;
let walletFolderPath;

  $("#selectWalletFolder").off("click").on("click", async function () {

    try {
      let selectwalletfolder= ipcRenderer.send("selectWalletFolder");
    } catch (error) {
      if (error.message === "NowalletFolderSelected") {
        // Handle user cancelation
        console.log("Canceled wallet folder selection");
      } else {
        // Handle other errors
        console.error("Error selecting wallet folder:", error);
      }
    }

  });


  $(".onewalletlist").off("click").on("click", function () {
    console.log('clicked on wallet name2');
  });

  $("#closewalletsfoundbox").off("click").on("click", function () {
    $("#checkeddirectorymsg").html("");
    $("#SelectWalletsfromListModal").css("display", "none");
  });

  async function ScanDirforWallets(){

    let checkwalletdirectory = ipcRenderer.send("checkWalletDataDbPath", walletFolderPath);
    let wallets = ipcRenderer.sendSync("getWallets", {});
    console.log('wallets founds are:', wallets);

    if(wallets && wallets.length > 0){

      wallets.forEach(onewallet => {
        $('#walletsList').append(`<li><a id="${onewallet.masteraddress}" data-address="${onewallet.masteraddress}" href="#" class="onewalletlist">${onewallet.name} (${onewallet.type})</a></li>`);
      });
  
      const links = document.querySelectorAll(".onewalletlist");
  
      // Add event listeners to each <a> element
      links.forEach(link => {
        link.addEventListener("click", function() {
         launchwallet(this.getAttribute("data-address"));
        });
      });
  
      $("#SelectWalletsfromListModal").css("display", "block");
      let _directorymsg = 'Etica wallets found in directory: '+ walletFolderPath;
      $("#checkeddirectorymsg").html(_directorymsg);

    }
    else {

      $("#SelectWalletsfromListModal").css("display", "block");
      let _directorymsg = 'Etica wallets found in directory: '+ walletFolderPath;
      $("#checkeddirectorymsg").html(_directorymsg);
      $('#walletsList').append('<p style="text-align:center;">No Etica wallets found in this directory</p>');

    }

  }


  function launchwallet(i){

    var walletAddress = i;
    let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});
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
  
  /*
  ipcRenderer.on("NowalletFolderSelected", (event, error) => {
    // Handle user cancelation
    console.log("User canceled wallet folder selection");
  }); */