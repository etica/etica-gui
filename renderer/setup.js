const {ipcRenderer} = require("electron");
const path = require("path");
const fs = require("fs");

let walletFilePath;
let ScannedFolderPath;
let wallets;

  $("#selectWalletFolder").off("click").on("click", async function () {

    try {
     let walletsfound = ipcRenderer.send("getWallets", {});
    } catch (error) {
      if (error.message === "NowalletFolderSelected") {
        // Handle user cancelation
       // console.log("Canceled wallet folder selection");
      } else {
        // Handle other errors
        console.error("Error selecting wallet folder:", error);
      }
    }

  });

  $("#selectWalletFolder").on("mouseover", async function () {

    $("#selectfolderhelper").css("display", "block");

  });

  $("#selectWalletFolder").on("mouseout", async function () {

    $("#selectfolderhelper").css("display", "none");

  });

  $("#selectWalletFolder2").off("click").on("click", async function () {

    try {
     let walletsfound = ipcRenderer.send("getWallets", {});
    } catch (error) {
      if (error.message === "NowalletFolderSelected") {
        // Handle user cancelation
      //  console.log("Canceled wallet folder selection");
      } else {
        // Handle other errors
        console.error("Error selecting wallet folder:", error);
      }
    }

  });


  $("#closewalletsfoundbox").off("click").on("click", function () {
    // reset in case fields were filled by preload wallet:
    $("#PreLoadWalletMode").val('');
    $("#PreLoadDirectory").val('');
    // go back to home screen:
    $("#checkeddirectorymsg").html("");
    $("#SelectWalletsfromListModal").css("display", "none");
  });

  $("#SetupBackBtnFromPreload").off("click").on("click", function () {
    // reset in case fields were filled by preload wallet:
    $("#PreLoadWalletMode").val('');
    $("#PreLoadDirectory").val('');
    // go back to home screen:
    $("#checkeddirectorymsg").html("");
    $("#SelectWalletsfromListModal").css("display", "none");
  });
  

  $("#SetupBackBtn").off("click").on("click", function () {
    // reset in case fields were filled by preload wallet:
    $("#PreLoadWalletMode").val('');
    $("#PreLoadDirectory").val('');
    // go back to wallets list:
    $("#setupconnection").css("display", "none");
    $("#setupwalletlist").css("display", "block");
  });





  const togglePassword = document.querySelector('#togglePassword');
  const password = document.querySelector('#SetupConnectPw');

  $("#togglePassword").off("click").on("click", function () {
    // toggle the type attribute
    const type = $("#SetupConnectPw").attr('type') === 'password' ? 'text' : 'password';
    $("#SetupConnectPw").attr('type', type);
    // toggle the eye slash icon
    this.classList.toggle('fa-eye-slash');
});

  $("#toggleResyncPassword").off("click").on("click", function () {
    // toggle the type attribute
    const type = $("#SetupResyncPw").attr('type') === 'password' ? 'text' : 'password';
    $("#SetupResyncPw").attr('type', type);
    // toggle the eye slash icon
    this.classList.toggle('fa-eye-slash');
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


    // Make sure UI showing wallets found list: 
    $("#setupconnection").css("display", "none");
    $("#setupwalletlist").css("display", "block");
    // Show Back Button that returns to wallets list instead of return to home screen:
    $("#SetupBackBtn").css("display", "block");
    $("#SetupBackBtnFromPreload").css("display", "none");

  }



  function selectwallet(walletName, walletAddress){

    $("#SetupConnectName").html(walletName);
    $("#SetupConnectAddress").val(walletAddress);

    $("#SetupConnectError").html('');
    $("#setupconnection").css("display", "block");
    $("#setupwalletlist").css("display", "none");

  }


  $("#SetupConnectBtn").off("click").on("click", function () {
    
    $("#SetupConnectionLoader").css("display", "block");
    $("#SetupConnectionBtns").css("display", "none");
    $("#SetupConnectError").html('');

    let pw = $("#SetupConnectPw").val();
    let address = $("#SetupConnectAddress").val();

    // if user is using popup with preload settings to connect to wallet
    if($("#PreLoadWalletMode").val() == 'preloadmode'){
      let preloaddirectory = $("#PreLoadDirectory").val();
      ipcRenderer.send("checkWalletDataDbPath", preloaddirectory);
    }
    // user is using a wallet selected from a folder
    else {
      const selected_wallet = wallets.find(onewallet => onewallet.masteraddress === address);
      ipcRenderer.send("checkWalletDataDbPath", selected_wallet.datadirectory);
    }

    connectwallet( address, pw);

  });


function connectwallet(_address, _pw){

  var walletAddress = _address;
  let wallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});
  
  if(wallet){
    ipcRenderer.send("setWalletDataDbPath", wallet.datadirectory);
    ipcRenderer.send("startGeth", wallet);
  }
  else{
    ipcRenderer.send("stopGeth", null);
    $("#SetupConnectError").html('error wallet not found in datadirectory');
    $("#SetupConnectionLoader").css("display", "none");
    $("#SetupConnectionBtns").css("display", "inline-flex");
    return false;
  }


let stoploop = false;
let successconnect = false;
let restartGeth_counter = 1;
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
                  if (error.message.includes("could not decrypt")) {
                    ipcRenderer.send("stopGeth", null);
                    $("#SetupConnectError").html('wrong password');
                    $("#SetupConnectionLoader").css("display", "none");
                    $("#SetupConnectionBtns").css("display", "inline-flex");
                    console.error("Error unlocking account:", error);
                    return false;
                  } else {
                    // Handle other errors here
                    $("#SetupConnectError").html('error starting the node');
                    $("#SetupConnectionLoader").css("display", "none");
                    $("#SetupConnectionBtns").css("display", "inline-flex");
                    console.error("Error unlocking account:", error);
                    if(!successconnect){
                      ipcRenderer.send("stopGeth", null);
                    }
                    return false;
                  }
                }
              });

              let isunlocked = await EticaBlockchain.isUnlocked(_address);

              if(isunlocked == 'unlocked'){
                successconnect = true; // avoid late call to stopGeth by web3Local.eth.personal.unlockAccount() error because could get wallet stuck if called after last startgeth
               // console.log('password verified');
                web3Local.currentProvider.connection.close();
                ipcRenderer.send("stopGeth", null);
                
                wallet.pw = _pw;
                launchwallet(wallet);

              }

              else {
                //console.log('wallet not unlocked');
                //ipcResult = ipcRenderer.send("stopGeth", null);
                //$("#SetupConnectError").html('wallet not unlocked yet');
                return false;
              }

            }

          } else{
            console.log('web3Local.eth.net.isListening() error is:', error);
            restartGeth_counter = restartGeth_counter + 1;
            // InitWeb3 = setInterval() is called every 2 secs
            // so restartGeth() will be called every 12 seconds
            // every 12 seconds if failing to connect to wsport we restart Geth:
            if( (restartGeth_counter % 6 === 0) && !stoploop){
              restartGeth(wallet, restartGeth_counter);
            }
            
          }
        });
      } catch (err) {
        ipcRenderer.send("stopGeth", null);
        clearInterval(InitWeb3);
        $("#SetupConnectError").html(err);
        $("#SetupConnectionLoader").css("display", "none");
        $("#SetupConnectionBtns").css("display", "inline-flex");
      }
    }, 2000);


}


  
function launchwallet(wallet){
    
    // Save preload wallet for preload popup with last wallet used next opening wallet //
    let preloadw = {};
    preloadw.keyword = 'LastWalletUsed';
    preloadw.walletname = wallet.name;
    preloadw.walletdirectory = wallet.datadirectory;
    preloadw.blockchaindirectory = wallet.blockchaindirectory; 
    preloadw.walletaddress = wallet.masteraddress;
    ipcRenderer.send("InsertOrUpdateWalletPreload", preloadw);
    // Save preload wallet for preload popup with last wallet used next opening wallet //

    // launch wallet
    let setwalletdirectory = ipcRenderer.send("setWalletDataDbPath", wallet.datadirectory);
    ipcRenderer.send("startGeth", wallet);
    ipcRenderer.send("SetReloadWindowsOn"); // will reload page from reloadshandler.js in case of blank page error (only hhappens rare times on computers with hardware limits)
    window.location.replace('./index.html');

}


function restartGeth(wallet, counter){
  console.log('restarting Geth');
  var _restarttimes = counter/6;
  $("#SetupConnectError").html('failed to connect on wsport '+wallet.wsport+' . Restarting Geth, please wait ('+_restarttimes+')');
  ipcRenderer.send("stopGeth", null);
  // wait 600 ms before calling startGeth
  setTimeout(() => {
    ipcRenderer.send("startGeth", wallet);
  }, 600);
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


  $("#SetupShowWalletSettingsBox").off("click").on("click", function () {
    
    $("#setupupdatesettings").css("display", "block");
    $("#setupconnection").css("display", "none");
    $("#SetupConnectionBtns").css("display", "none");
    $("#SetupConnectError").html('');

    $("#SetupUpdateWalletSettingsBtn").css("display", "inline-flex");
    $("#SetupUpdateSettingsSuccess").html('');


    let address = $("#SetupConnectAddress").val();

    // if user is using popup with preload settings to connect to wallet
    if($("#PreLoadWalletMode").val() == 'preloadmode'){
      let preloaddirectory = $("#PreLoadDirectory").val();
      ipcRenderer.send("checkWalletDataDbPath", preloaddirectory);
    }
    // user is using a wallet selected from a folder
    else {
      const selected_wallet = wallets.find(onewallet => onewallet.masteraddress === address);
      ipcRenderer.send("checkWalletDataDbPath", selected_wallet.datadirectory);
    }

    var walletAddress = address;
    let _wallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});

    console.log('address:', address)
    console.log('_wallet:', _wallet)

    $("#setupsettingsWalletWsAddress").val(_wallet.wsaddress);
    $("#setupsettingsWalletPort").val(_wallet.port);
    $("#setupsettingsWalletWsPort").val(_wallet.wsport);
    $("#setupsettingsWalletEnode").val(_wallet.enode);

  });

  $("#SetupSettingsBackBtn").off("click").on("click", function () {

    $("#setupsettingsWalletWsAddress").val('');
    $("#setupsettingsWalletPort").val('');
    $("#setupsettingsWalletWsPort").val('');

    $("#setupsettingsWalletEnode").val('');

    $("#setupupdatesettings").css("display", "none");
    $("#setupconnection").css("display", "block");
    $("#SetupConnectionBtns").css("display", "inline-flex");
    $("#SetupConnectError").html('')

  });

  $("#SetupUpdateWalletSettingsBtn").off("click").on("click", function () {
    
    $("#SetupConnectionLoader").css("display", "none");
    $("#SetupConnectionBtns").css("display", "none");
    $("#SetupConnectError").html('');

    let address = $("#SetupConnectAddress").val();

    // if user is using popup with preload settings to connect to wallet
    if($("#PreLoadWalletMode").val() == 'preloadmode'){
      let preloaddirectory = $("#PreLoadDirectory").val();
      ipcRenderer.send("checkWalletDataDbPath", preloaddirectory);
    }
    // user is using a wallet selected from a folder
    else {
      const selected_wallet = wallets.find(onewallet => onewallet.masteraddress === address);
      ipcRenderer.send("checkWalletDataDbPath", selected_wallet.datadirectory);
    }

    updateenode(address);

  });


  function updateenode(_address){

  var walletAddress = _address;
  let NewWallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});
  
  if(NewWallet){
    
    ipcRenderer.send("setWalletDataDbPath", NewWallet.datadirectory);

    let enodeUrl = $("#setupsettingsWalletEnode").val();
    
    if (!(typeof enodeUrl === "string" && enodeUrl.startsWith("enode://"))) {
      $("#SetupUpdateSettingsError").html('Enode is invalid. An enode url should start with enode://');
      return false;
    } 

    NewWallet.enode = enodeUrl;

    // Wallet port:
    if($("#setupsettingsWalletPort").val() && $("#setupsettingsWalletPort").val() != ''){
      NewWallet.port= $("#setupsettingsWalletPort").val();
    }
    else{
      $("#SetupUpdateSettingsError").html('port cannot be empty!');
      return false;
    }
    
    
    // Wallet wsport:
    if($("#setupsettingsWalletWsPort").val() && $("#setupsettingsWalletWsPort").val() != ''){
      NewWallet.wsport= $("#setupsettingsWalletWsPort").val();
    }
    else{
      $("#SetupUpdateSettingsError").html('ws.port cannot be empty!');
      return false;
    }

    ipcRenderer.send("updateWalletAdvancedSettings", NewWallet); 

    // retrieve updated wallet to pass it to Geth:
    // Check if the event listener has already been added before adding it again and create issue multiple popups
     if (!ipcRenderer.listenerCount("updateWalletAdvancedSettingsResponse")) {
        ipcRenderer.on("updateWalletAdvancedSettingsResponse", (event, updatedWallet) => {
          // `updatedWallet` contains the response from the `updateWalletAdvancedSettings` event
          $("#SetupUpdateSettingsSuccess").html('settings updated');
          $("#SetupUpdateWalletSettingsBtn").css("display", "none");
        });
    }

  }
  else{
    $("#SetupUpdateSettingsError").html('error no wallet selected');
    return false;
  }


  }


  // ------------------------- RESYNC WALLET SYSTEM | END  ----------------------------------- //

  $("#SetupShowWalletResyncBox").off("click").on("click", function () {
    
    
    $("#setupresyncwallet").css("display", "block");
    $("#setupconnection").css("display", "none");
    $("#SetupConnectionBtns").css("display", "none");
    $("#SetupConnectError").html('');

    $("#SetupResyncWalletSettingsBtn").css("display", "inline-flex");
    $("#SetupResyncSettingsSuccess").html('');


    let address = $("#SetupConnectAddress").val();

    // if user is using popup with preload settings to connect to wallet
    if($("#PreLoadWalletMode").val() == 'preloadmode'){
      let preloaddirectory = $("#PreLoadDirectory").val();
      ipcRenderer.send("checkWalletDataDbPath", preloaddirectory);
    }
    // user is using a wallet selected from a folder
    else {
      const selected_wallet = wallets.find(onewallet => onewallet.masteraddress === address);
      ipcRenderer.send("checkWalletDataDbPath", selected_wallet.datadirectory);
    }

    $("#SetupResyncWalletAddress").html(address);
    var walletAddress = address;
    let _wallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});

    $("#SetupResyncWalletName").html(_wallet.name);

    $("#setupresyncnewblockchain").val('');

  });

  $("#SetupResyncBackBtn").off("click").on("click", function () {

    $("#setupresyncnewblockchain").val('');

    $("#setupresyncwallet").css("display", "none");
    $("#setupconnection").css("display", "block");
    $("#SetupConnectionBtns").css("display", "inline-flex");
    $("#SetupConnectError").html('')

  });


  $("#SetupResyncWalletSettingsBtn").off("click").on("click", function () {
    
    $("#SetupResyncLoader").css("display", "block");
    $("#SetupResyncBtns").css("display", "none");
    $("#SetupResyncSettingsError").html('');

    let pw = $("#SetupResyncPw").val();
    let address = $("#SetupConnectAddress").val();

    if (!$("#SetupResyncPw").val()) {
      $("#SetupResyncSettingsError").html('Please enter wallet password.');
      $("#SetupResyncLoader").css("display", "none");
      $("#SetupResyncBtns").css("display", "inline-flex");
      return false;
    }

    if (!$("#setupresyncnewblockchain").val()) {
      $("#SetupResyncSettingsError").html('Please enter blockchain directory.');
      $("#SetupResyncLoader").css("display", "none");
      $("#SetupResyncBtns").css("display", "inline-flex");
      return false;
    }

    if(!path.isAbsolute($("#setupresyncnewblockchain").val())){
      $("#SetupResyncSettingsError").html('Blockchain directory must be an absolute path.');
      $("#SetupResyncLoader").css("display", "none");
      $("#SetupResyncBtns").css("display", "inline-flex");
      return false;
    }

    // if user is using popup with preload settings to connect to wallet
    if($("#PreLoadWalletMode").val() == 'preloadmode'){
      let preloaddirectory = $("#PreLoadDirectory").val();
      ipcRenderer.send("checkWalletDataDbPath", preloaddirectory);
    }
    // user is using a wallet selected from a folder
    else {
      const selected_wallet = wallets.find(onewallet => onewallet.masteraddress === address);
      ipcRenderer.send("checkWalletDataDbPath", selected_wallet.datadirectory);
    }


    let _wallet = ipcRenderer.sendSync("getWallet", {masteraddress: address});
    if(_wallet){
      resyncblockhain(address, pw);
    }
    else {
      $("#SetupResyncSettingsError").html('Wallet not found.');
      $("#SetupResyncLoader").css("display", "none");
      $("#SetupResyncBtns").css("display", "inline-flex");
      return false;
    }

    //resyncblockhain(address, pw);

  });

  $("#SelectResyncblockchaindirectory").off("click").on("click", async function () {

    try {
     let blockchainpath = ipcRenderer.send("assignBlockchainFoldertoWalletResyncSetup", {});
    } catch (error) {
      if (error.message === "NoNewBlockchainFolderAssignedResyncSetup") {
        // Handle user cancelation
       // console.log("Canceled wallet folder selection");
      } else {
        // Handle other errors
        console.error("Error selecting wallet folder:", error);
      }
    }

  });


  ipcRenderer.on("NewBlockchainFolderAssignedResyncSetup", (event, _folderpath) => {
    $("#setupresyncnewblockchain").val(_folderpath);
  });


  function resyncblockhain(_address, _pw){

    var walletAddress = _address;
    let NewWallet = ipcRenderer.sendSync("getWallet", {masteraddress: walletAddress});
    
    if(NewWallet){
  
      let newBlockchainFolder = $("#setupresyncnewblockchain").val();
      
      if (!(typeof newBlockchainFolder === "string")) {
        $("#SetupResyncSettingsError").html('Invalid new blockchain directory');
        return false;
      } 


      // if folder doesnt exist, create folder to avoid geth executable chmod permission issue on linux:
      try {
        if (!fs.existsSync(NewWallet.blockchaindirectory)) {
          fs.mkdirSync(NewWallet.blockchaindirectory, { recursive: true }); // creates folder
          console.log("Folder created!");
        }
      } catch (err) {
        console.error("Error creating directory:", err);
        $("#SetupResyncSettingsError").html('Error while creating directory. Please create the directory and try again.');
        $("#SetupResyncLoader").css("display", "none");
        $("#SetupResyncBtns").css("display", "inline-flex");
      }


      ipcRenderer.send("setWalletDataDbPath", NewWallet.datadirectory);
      NewWallet.blockchaindirectory = newBlockchainFolder;

      const responseHandler = (event, code) => {
        ipcRenderer.removeListener("initializeGethResponse", responseHandler);
        
        if(code == 0) {
          startresyncedwallet(NewWallet, _pw, newBlockchainFolder);
        }
        // case 2 should never happen because initializeGethForResync() doesnt return error if node already initialised to let users resync with existing blockchain directories
        else if(code == 2) {
          $("#SetupResyncSettingsError").html('This blockchain directory has already been initialized, please select an empty directory.');
          $("#SetupResyncLoader").css("display", "none");
          $("#SetupResyncBtns").css("display", "inline-flex");
        } else {
          $("#SetupResyncSettingsError").html('blockchain directory error, please select another blockchain directory.');
          $("#SetupResyncLoader").css("display", "none");
          $("#SetupResyncBtns").css("display", "inline-flex");
        }
      };
  
      ipcRenderer.on("initializeGethResponse", responseHandler);
      ipcRenderer.send("initializeGethForResync", NewWallet);

    }
    else{
      $("#SetupResyncSettingsError").html('error no wallet selected');
      return false;
    }
  
  
    }


    function startresyncedwallet(_wallet, _pw, _newBlockchainFolder){

      if(_wallet){
        _wallet.pw = _pw;
        ipcRenderer.send("setWalletDataDbPath", _wallet.datadirectory);
        ipcRenderer.send("startGeth", _wallet);
      }
      else{
        ipcRenderer.send("stopGeth", null);
        $("#SetupResyncSettingsError").html('error wallet not found');
        $("#SetupResyncLoader").css("display", "none");
        $("#SetupResyncBtns").css("display", "inline-flex");
        return false;
      }
    
    
    let stoploop = false;
    let successconnect = false;
    let restartGeth_counter = 1;
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
                  let _address = _wallet.masteraddress;
                  await web3Local.eth.personal.unlockAccount(_address, _pw, function (error, result) { 
                    if (error) {
                      if (error.message.includes("could not decrypt")) {
                        ipcRenderer.send("stopGeth", null);
                        $("#SetupResyncSettingsError").html('wrong password');
                        $("#SetupResyncLoader").css("display", "none");
                        $("#SetupResyncBtns").css("display", "inline-flex");
                        console.error("Error unlocking account:", error);
                        return false;
                      } else if(error.message.includes("no key for given address or file")){

                        $("#SetupResyncSettingsError").html('No keystore registered for this wallet address. Cannot resync, need to Import as new wallet instead.');
                        $("#SetupResyncLoader").css("display", "none");
                        $("#SetupResyncBtns").css("display", "inline-flex");
                        console.error("Error unlocking account:", error);
                        if(!successconnect){
                          ipcRenderer.send("stopGeth", null);
                        }
                        return false;
                      }
                      else {
                        // Handle other errors here
                        $("#SetupResyncSettingsError").html('error starting the new node');
                        $("#SetupResyncLoader").css("display", "none");
                        $("#SetupResyncBtns").css("display", "inline-flex");
                        console.error("Error unlocking account:", error);
                        if(!successconnect){
                          ipcRenderer.send("stopGeth", null);
                        }
                        return false;
                      }
                    }
                  });
    
                  let isunlocked = await EticaBlockchain.isUnlocked(_address);
    
                  if(isunlocked == 'unlocked'){
                    successconnect = true; // avoid late call to stopGeth by web3Local.eth.personal.unlockAccount() error because could get wallet stuck if called after last startgeth
                   // console.log('password verified');

                    // if reaches here means pw ok and new blockchain directory successfully initiated, thus we actualize the wallet blockchain directory:
                    _wallet.blockchaindirectory = _newBlockchainFolder;
                    ipcRenderer.send("storeWallet", _wallet);  
                    
                    // stop geth before launching wallet:
                    web3Local.currentProvider.connection.close();
                    ipcRenderer.send("stopGeth", null);
                    
                    _wallet.pw = _pw;
                    launchwallet(_wallet);
    
                  }
    
                  else {
                    //console.log('wallet not unlocked');
                    //ipcResult = ipcRenderer.send("stopGeth", null);
                    //$("#SetupConnectError").html('wallet not unlocked yet');
                    return false;
                  }
    
                }
    
              } else{
                console.log('web3Local.eth.net.isListening() error is:', error);
                restartGeth_counter = restartGeth_counter + 1;
                // InitWeb3 = setInterval() is called every 2 secs
                // so restartGeth() will be called every 12 seconds
                // every 12 seconds if failing to connect to wsport we restart Geth:
                if( (restartGeth_counter % 6 === 0) && !stoploop){
                  restartGeth(_wallet, restartGeth_counter);
                }
                
              }
            });
          } catch (err) {
            ipcRenderer.send("stopGeth", null);
            clearInterval(InitWeb3);
            $("#SetupResyncSettingsError").html(err);
            $("#SetupResyncLoader").css("display", "none");
            $("#SetupResyncBtns").css("display", "inline-flex");
          }
        }, 2000);
    
    
    }  

    // ------------------------- RESYNC WALLET SYSTEM | END  ----------------------------------- //

  ipcRenderer.on("ScanedFolderWalletsFound", (event, _res) => {
    wallets = _res.wallets;
    ScannedFolderPath = _res.folderPath;
    ScanDirforWallets();
  });
  
  function loadpreloadwallet() {

  $("#PreLoadWalletMode").val('');
  $("#PreLoadDirectory").val('');

  let walletpreload = ipcRenderer.sendSync("getWalletPreload", "LastWalletUsed");


  if(walletpreload && walletpreload.walletname &&  walletpreload.walletdirectory && walletpreload.walletaddress){

    $("#PreLoadWalletMode").val('preloadmode');
    $("#PreLoadDirectory").val(walletpreload.walletdirectory);
    $("#SetupConnectAddress").val(walletpreload.walletaddress);
    $("#SetupConnectName").html(walletpreload.walletname);


    $("#SelectWalletsfromListModal").css("display", "block");
    $("#setupconnection").css("display", "block");
    $("#setupwalletlist").css("display", "none");
    $("#checkeddirectorymsg").html("");
    $("#SetupBackBtn").css("display", "none");
    $("#SetupBackBtnFromPreload").css("display", "block");

  }

  else {

    $("#checkeddirectorymsg").html("");
    $("#SelectWalletsfromListModal").css("display", "none");

  }

  }

  loadpreloadwallet();

  /*
  ipcRenderer.on("NowalletFolderSelected", (event, error) => {
    // Handle user cancelation
    console.log("User canceled wallet folder selection");
  }); */