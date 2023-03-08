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

  $("#selectWalletFolder2").off("click").on("click", async function () {

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

  $("#SetupBackBtn").off("click").on("click", function () {
    $("#setupconnection").css("display", "none");
    $("#setupwalletlist").css("display", "block");
  });

  async function ScanDirforWallets(){


    if(wallets && wallets.length > 0){

      $('#walletsList').html('');
      wallets.forEach(onewallet => {
        $('#walletsList').append(`<li><a id="${onewallet.masteraddress}" data-address="${onewallet.masteraddress}" data-name="${onewallet.name}" href="#" class="onewalletlist">${onewallet.name} (${onewallet.type})</a></li>`);
      });
  
      const links = document.querySelectorAll(".onewalletlist");
  
      // Add event listeners to each <a> element
      links.forEach(link => {
        link.addEventListener("click", function() {
         selectwallet(this.getAttribute("data-name"), this.getAttribute("data-address"));
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



  function selectwallet(walletName, walletAddress){

    console.log('selectwallet called');
    $("#SetupConnectName").html(walletName);
    $("#SetupConnectAddress").val(walletAddress);

    $("#setupconnection").css("display", "block");
    $("#setupwalletlist").css("display", "none");

  }


  $("#SetupConnectBtn").off("click").on("click", function () {
    
    let pw = $("#SetupConnectPw").val();
    let address = $("#SetupConnectAddress").val();
    console.log('pw is', pw);
    console.log('address is', address);
    connectwallet( address, pw);

  });


function connectwallet(_address, _pw){


  const selected_wallet = wallets.find(onewallet => onewallet.masteraddress === _address);

  let checkwalletdirectory = ipcRenderer.send("checkWalletDataDbPath", selected_wallet.datadirectory);
  var walletAddress = _address;
  let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});
  
  if(wallet){
    let setwalletdirectory = ipcRenderer.send("setWalletDataDbPath", wallet.datadirectory);
    let ipcResult = ipcRenderer.send("startGeth", wallet);
  }
  else{
    $("#SetupConnectError").html('error wallet not found in datadirectory');
    return false;
  }


let stoploop = false;
    var InitWeb3 = setInterval(async function () {
      try {

        let _provider = new Web3.providers.WebsocketProvider("ws://localhost:8551");
        web3Local = new Web3(_provider);

        web3Local.eth.net.isListening(async function (error, success) {
          //Geth is ready
          if (!error) {
            clearInterval(InitWeb3);

            if(!stoploop){
              stoploop == true;

              await web3Local.eth.personal.unlockAccount(_address, _pw, function (error, result) { 
                if (error) {
                  console.log("Wrong password for the selected address!");
                  console.log("Wrong password for the selected address!", error);
                  $("#SetupConnectError").html('Wrong password for the selected wallet!');
                  return false;
                }
              });

              let isunlocked = await EticaBlockchain.isUnlocked(_address);

              if(isunlocked == 'unlocked'){

                console.log('password verified');
                web3Local.currentProvider.connection.close();
                
                wallet.pw = _pw;
                launchwallet(wallet);

              }

              else {
                console.log('password not verified');
                $("#SetupConnectError").html('Wrong password!');
                return false;
              }

            }

          }
        });
      } catch (err) {
        console.log('err :::::', err);
        $("#SetupConnectError").html(err);
      }
    }, 2000);


}


  
function launchwallet(wallet){
  
    let setwalletdirectory = ipcRenderer.send("setWalletDataDbPath", wallet.datadirectory);
    let ipcResult = ipcRenderer.send("startGeth", wallet);
    window.location.replace('./index.html');

}

/*
function former_used_wallets.find_wallet_launchwallet(i){

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
  */

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