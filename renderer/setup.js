const {ipcRenderer} = require("electron");
const path = require("path");

let walletFilePath;
let ScannedFolderPath;
let wallets;

  $("#selectWalletFolder").off("click").on("click", async function () {

    try {
     let walletsfound = ipcRenderer.send("getWallets", {});
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


  $("#closewalletsfoundbox").off("click").on("click", function () {
    $("#checkeddirectorymsg").html("");
    $("#SelectWalletsfromListModal").css("display", "none");
  });

  async function ScanDirforWallets(){


    if(wallets && wallets.length > 0){

      $('#walletsList').html('');
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
      let _directorymsg = 'Etica wallets found in directory: '+ ScannedFolderPath;
      $("#checkeddirectorymsg").html(_directorymsg);

    }
    else {

      $("#SelectWalletsfromListModal").css("display", "block");
      let _directorymsg = 'Etica wallets found in directory: '+ ScannedFolderPath;
      $("#checkeddirectorymsg").html(_directorymsg);
      $('#walletsList').html('<p style="text-align:center;">No Etica wallets found in this directory</p>');

    }

  }


  function launchwallet(i){

    const selected_wallet = wallets.find(onewallet => onewallet.masteraddress === i);

    let checkwalletdirectory = ipcRenderer.send("checkWalletDataDbPath", selected_wallet.datadirectory);
    var walletAddress = i;
    let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});
    
    if(wallet){
      let setwalletdirectory = ipcRenderer.send("setWalletDataDbPath", wallet.datadirectory);
      let ipcResult = ipcRenderer.send("startGeth", wallet);
      window.location.replace('./index.html');
    }

  }

  ipcRenderer.on("ScanedFolderWalletsFound", (event, _res) => {
    wallets = _res.wallets;
    ScannedFolderPath = _res.folderPath;
    ScanDirforWallets();
  });
  
  /*
  ipcRenderer.on("NowalletFolderSelected", (event, error) => {
    // Handle user cancelation
    console.log("User canceled wallet folder selection");
  }); */