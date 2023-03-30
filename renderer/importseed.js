const {ipcRenderer} = require("electron");
const bip39 = require("bip39");
const { hdkey } = require('ethereumjs-wallet');
const util = require('ethereumjs-util');
const crypto = require('crypto');
const HDKey = require('hdkey');
const path = require("path");
const fs = require("fs");

let imported_mnemonic;
let imported_mnemonic_array;
let user_mnemonic_order_array = [];
let address;
let pk;
let pw;
let masterSeed;


function normalizeString(str) {
  return str.trim().replace(/\s+/g, ' ');
}

function ImportNewSeed(){
   // reinitialize mnemonic
   imported_mnemonic = '';
   imported_mnemonic_array = [];
   user_mnemonic_order_array = [];

   $("#SetImportWalletInfoContainer").css('display', 'none');
   $("#ResetImportMnemonicDiv").css('display', 'none');
   $("#GoCheckImportMnemonicDiv").css('display', 'none');
   $("#NewImportEticaAddress").css('display', 'none');
   $("#CheckImportMnemonic").css('display', 'none');
   $("#InputMnemonicDiv").css('display', 'none');  


   for (let i = 1; i <= 24; i++) {
    imported_mnemonic_array.push($("#importword" + i).val());
  }
 
  imported_mnemonic = imported_mnemonic_array.join(' ');
  //imported_mnemonic = 'tip wear indicate blast novel human october misery fruit yard friend choose message fee luggage gas between absorb ticket shiver fever message mule develop';
 

  if (bip39.validateMnemonic(imported_mnemonic)) {
   // console.log('The mnemonic is valid!');
  } else {
   $("#InputMnemonicDiv").hide();  
   $("#ImportMnemonicDiv").hide();
   $("#HelperImportMnemonic").html("This mnemonic is invalid.");
   $("#NewImportMnemonic").css('display', 'block');
   $("#NewImportMnemonic").html(imported_mnemonic);
   $("#ResetImportMnemonicDiv").css('display', 'block');
    return false;
  }

   const passphrase = ''; // insert your optional passphrase here
   const seed = bip39.mnemonicToSeedSync(imported_mnemonic, passphrase);
 
 
 // Generate a key pair from the seed
 const hdWallet = hdkey.fromMasterSeed(seed);
 const hdMaster = hdkey.fromMasterSeed(Buffer.from(seed, 'hex'));


const _masterSeed = seed.toString('hex');
masterSeed = _masterSeed;


 const wallet = hdWallet.derivePath("m/44'/60'/0'/0/0").getWallet();
 const privateKey = wallet.getPrivateKey();
 const publicKey = wallet.getPublicKey();

 pk = privateKey.toString('hex');
 const privateKeyBuffer = Buffer.from(privateKey, 'hex');

 if (!util.isValidPrivate(privateKeyBuffer)) {
  EticaMainGUI.showGeneralErrorImportWallet("Error, Invalid private key!");
  return false;
 }
 
 // Calculate the Ethereum address from the public key
 let address_without0x = util.pubToAddress(publicKey, true).toString('hex');
 address = '0x' + address_without0x;
 
 
 $("#InputMnemonicDiv").hide();  
 $("#ImportMnemonicDiv").hide();
   $("#HelperImportMnemonic").html("This is your mnemonic (seed). <br> Next screen will ask you to verify the mnemonic");
   $("#NewImportMnemonic").css('display', 'block');
   $("#NewImportMnemonic").html(imported_mnemonic);
   $("#GoCheckImportMnemonicDiv").css('display', 'block');
   $("#NewImportEticaAddress").css('display', 'block');
   $("#NewImportEticaAddress").html('Etica address: '+address+'');
}


$("#InitializeImportWallet").off("click").on("click", function () {

  $("#ImportSeedContainer").css('display', 'none');
  $("#SetImportWalletInfoContainer").css('display', 'block');

});


 $("#ImportMnemonic").off("click").on("click", function () {

  ImportNewSeed();

  });


  $("input[name='importwallettype']").click(function() {

      if ($("#importwallettestnet").is(":checked")) {
        // testnet wallet:
        $("#importwalletNetworkIdDiv").css('display', 'block');
        $("#importwalletEnodeDiv").css('display', 'block');
        $("#importwalletContractAddressDiv").css('display', 'block');
      } else {
        // mainnet wallet, not necessary & user can update settings once wallet created:
        $("#importwalletNetworkIdDiv").css('display', 'none');
        $("#importwalletEnodeDiv").css('display', 'none');
        $("#importwalletContractAddressDiv").css('display', 'none');
      }

  });  


  $("#GoCheckImportMnemonic").off("click").on("click", function () {

    $(".mnemonicwords").show();

    $("#NewImportMnemonic").css('display', 'none');
    $("#GoCheckImportMnemonicDiv").css('display', 'none');
    $("#NewImportEticaAddress").css('display', 'none');
    $("#CheckImportMnemonic").css('display', 'block');

    $("#HelperImportMnemonic").html("Select words in right order");

    // extract words:

    const initialWords = imported_mnemonic.split(' ');


// Shuffle the indices using the Fisher-Yates shuffle algorithm
const indices = Array.from(Array(24).keys());
for (let i = indices.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [indices[i], indices[j]] = [indices[j], indices[i]];
}

// Rearrange the words according to the shuffled indices
const reorderedWords = indices.map(index => initialWords[index]);
$("#mnemonicword1").html(reorderedWords[0]);
$("#mnemonicword2").html(reorderedWords[1]);
$("#mnemonicword3").html(reorderedWords[2]);
$("#mnemonicword4").html(reorderedWords[3]);
$("#mnemonicword5").html(reorderedWords[4]);
$("#mnemonicword6").html(reorderedWords[5]);
$("#mnemonicword7").html(reorderedWords[6]);
$("#mnemonicword8").html(reorderedWords[7]);
$("#mnemonicword9").html(reorderedWords[8]);
$("#mnemonicword10").html(reorderedWords[9]);
$("#mnemonicword11").html(reorderedWords[10]);
$("#mnemonicword12").html(reorderedWords[11]);
$("#mnemonicword13").html(reorderedWords[12]);
$("#mnemonicword14").html(reorderedWords[13]);
$("#mnemonicword15").html(reorderedWords[14]);
$("#mnemonicword16").html(reorderedWords[15]);
$("#mnemonicword17").html(reorderedWords[16]);
$("#mnemonicword18").html(reorderedWords[17]);
$("#mnemonicword19").html(reorderedWords[18]);
$("#mnemonicword20").html(reorderedWords[19]);
$("#mnemonicword21").html(reorderedWords[20]);
$("#mnemonicword22").html(reorderedWords[21]);
$("#mnemonicword23").html(reorderedWords[22]);
$("#mnemonicword24").html(reorderedWords[23]);


  });


  $(".mnemonicwords").off("click").on("click", function () {
    user_mnemonic_order_array.push($(this).html());
    $(this).hide();

    if(user_mnemonic_order_array.length == 24){
      // check mnemonic:
      let usermnemonic = user_mnemonic_order_array.join(' ');

      if(normalizeString(imported_mnemonic) === normalizeString(usermnemonic)){
       $("#CheckImportMnemonic").css('display', 'none');
       $("#HelperImportMnemonic").html("Your mnemonic is verified. ");
       $("#InitializeImportWalletDiv").css('display', 'block');

      }
      else {
        //console.log('invalidmnemonic');
        $("#HelperImportMnemonic").html("You provided a wrong word order for this mnemonic. Please try again");
        $("#ResetImportMnemonicDiv").css('display', 'block');
      }
    }

  });



  $("#GoSetBlockHeight").off("click").on("click", function () {

    pw = $("#importwalletpassword").val();

    if(!$("#importwalletname").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Wallet name cannot be empty!");
      return false;
    }

    if(!$("#importblockchaindirectory").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Blockchain directory name cannot be empty!");
      return false;
    }

    if(!path.isAbsolute($("#importblockchaindirectory").val())){
      EticaMainGUI.showGeneralErrorImportWallet("Blockchain directory must be an absolute path!");
      return false;
    }

    if(!$("#importwalletdirectory").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Wallet directory name cannot be empty!");
      return false;
    }

    if(!path.isAbsolute($("#importwalletdirectory").val())){
      EticaMainGUI.showGeneralErrorImportWallet("Wallet directory must be an absolute path!");
      return false;
    }


    if($("input[name='importwallettype']:checked").val() == 'testnet' && !$("#importwalletNetworkId").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Blockchain Network ID cannot be empty!");
      return false;
    }
    
    if($("input[name='importwallettype']:checked").val() == 'testnet' && !$("#importwalletEnode").val()){
      let enodeUrl = $("#importwalletEnode").val();
      if (!(typeof enodeUrl === "string" && enodeUrl.startsWith("enode://"))) {
        EticaMainGUI.showGeneralError('Enode is invalid. An enode url should start with enode://');
        return false;
      }
    }

    if($("input[name='importwallettype']:checked").val() == 'testnet' && !$("#importwalletContractAddress").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Etica smart contract address cannot be empty!");
      return false;
    }

    
    if(!$("#importwalletpassword").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Password cannot be empty!");
      return false;
    }

    if($("#importwalletpassword").val() != $("#importwalletpasswordconf").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Passwords do not match!");
      return false;
    }

    if (pw != $("#importwalletpassword").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Error, Passwords do not match!"); // should never happen but extra security measure in case $("#importwalletpassword").val() changes value unexpectedly
      return false;
    }

    $("#SetImportWalletInfoContainer").css('display', 'none');
    $("#SetBlockHeightContainer").css('display', 'block');

  });

  $("#BacktoSetImportWalletInfo").off("click").on("click", function () {

    $("#SetImportWalletInfoContainer").css('display', 'block');
    $("#SetBlockHeightContainer").css('display', 'none');

  });


  $("#ImportWallet").off("click").on("click", function () {

    // creates wallet from seed
    let NewWallet = {};

    pw = $("#importwalletpassword").val();
    
    // CHECK FIELDS AGAIN (ALREADY CHECKED BUT ADD CHECK IN CASE FIELDS CAHNGED WHILE IN BLOCK HAIGHT SCREEN) //
    if(!$("#importwalletname").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Wallet name cannot be empty!");
      return false;
    }

    if(!$("#importblockchaindirectory").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Blockchain directory name cannot be empty!");
      return false;
    }

    if(!path.isAbsolute($("#importblockchaindirectory").val())){
      EticaMainGUI.showGeneralErrorImportWallet("Blockchain directory must be an absolute path!");
      return false;
    }

    if(!$("#importwalletdirectory").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Wallet directory name cannot be empty!");
      return false;
    }

    if(!path.isAbsolute($("#importwalletdirectory").val())){
      EticaMainGUI.showGeneralErrorImportWallet("Wallet directory must be an absolute path!");
      return false;
    }


    if($("input[name='importwallettype']:checked").val() == 'testnet' && !$("#importwalletNetworkId").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Blockchain Network ID cannot be empty!");
      return false;
    }
    
    if($("input[name='importwallettype']:checked").val() == 'testnet' && !$("#importwalletEnode").val()){
      let enodeUrl = $("#importwalletEnode").val();
      if (!(typeof enodeUrl === "string" && enodeUrl.startsWith("enode://"))) {
        EticaMainGUI.showGeneralError('Enode is invalid. An enode url should start with enode://');
        return false;
      }
    }

    if($("input[name='importwallettype']:checked").val() == 'testnet' && !$("#importwalletContractAddress").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Etica smart contract address cannot be empty!");
      return false;
    }

    
    if(!$("#importwalletpassword").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Password cannot be empty!");
      return false;
    }

    if($("#importwalletpassword").val() != $("#importwalletpasswordconf").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Passwords do not match!");
      return false;
    }

    if (pw != $("#importwalletpassword").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Error, Passwords do not match!"); // should never happen but extra security measure in case $("#importwalletpassword").val() changes value unexpectedly
      return false;
    }

    if($("#importwalletBlockHeight").val() && Number($("#importwalletBlockHeight").val()) < 0){
      EticaMainGUI.showGeneralErrorImportWallet("Block height must be a block number. If you dont know your seed block height just let this field to 0");
      return false;
    }

    // CHECK FIELDS AGAIN DONE (ALREADY CHECKED BUT ADD CHECK IN CASE FIELDS CAHNGED WHILE IN BLOCK HAIGHT SCREEN) //

    NewWallet.name = $("#importwalletname").val();
    NewWallet.type = $("input[name='importwallettype']:checked").val();
    NewWallet.masteraddress = address;
    
    NewWallet.blockchaindirectory = $("#importblockchaindirectory").val();
    NewWallet.keystoredirectory = ''+$("#importwalletdirectory").val()+'/keystores/'+NewWallet.masteraddress+'/keystore';
    NewWallet.datadirectory = ''+$("#importwalletdirectory").val()+'/walletdata/'+NewWallet.masteraddress+'';

    /* Used if advanced settings:
    NewWallet.blockchaindirectory = $("#blockchaindirectory").val();
    NewWallet.keystoredirectory = $("#keystoredirectory").val();
    NewWallet.datadirectory = $("#datadirectory").val();

    */

    // if folder doesnt exist, create folder to avoid geth executable chmod permission issue on linux:
    try {
      if (!fs.existsSync(NewWallet.blockchaindirectory)) {
        fs.mkdirSync(NewWallet.blockchaindirectory, { recursive: true });
        console.log("Folder created!");
      } 
    } catch (err) {
      console.error("Error creating directory:", err);
      EticaMainGUI.showGeneralErrorNewWallet("Error while creating directory. Please create directory and try again. Directory: ", NewWallet.blockchaindirectory);
    }


// ------ ENCRYPT Master seed ---- //

// Generate a 128-bit salt
const salt = crypto.randomBytes(16);

// Derive a 256-bit encryption key from the passphrase and salt
const encryptionKey = crypto.pbkdf2Sync(pw, salt, 100000, 32, 'sha256');

// Use the encryption key to encrypt the master seeed

const iv = crypto.randomBytes(16);
const cipherAlgorithm = 'aes-256-cbc';
const cipher = crypto.createCipheriv(cipherAlgorithm, Buffer.from(encryptionKey), iv);
let encryptedMasterSeed = cipher.update(masterSeed);
encryptedMasterSeed = Buffer.concat([encryptedMasterSeed, cipher.final()]);


NewWallet.encryptedMaster = encryptedMasterSeed.toString('hex');
NewWallet.salt = salt.toString('hex');
NewWallet.vector = iv.toString('hex');

// ---- ENCRYPT Master seed ----- //

    if(NewWallet.type == 'mainnet'){
      // set mainnet values
      NewWallet.enode = 'enode://b0e97d2f1a37b2035a34b97f32fb31ddd93ae822b603c56b7f17cfb189631ea2ef17bfbed904f8bc564765634f2d9db0a128835178c8af9f1dde68ee6b5e2bf7@167.172.47.195:30303';
      NewWallet.networkid = "61803";
      NewWallet.wsport = "8551";
      NewWallet.wsaddress =  "127.0.0.1";
      NewWallet.port = "30317";
      NewWallet.contractaddress = "0x34c61EA91bAcdA647269d4e310A86b875c09946f";
    }
    else {
     // Testnet values entered by user
    if($("#importwalletNetworkId").val() == "61803"){
      EticaMainGUI.showGeneralErrorImportWallet("Error, NetworkId can't be equal to mainnet NetworkId (61803) for a Testnet wallet!");
      return false;
    }
    else{
      NewWallet.enode = $("#importwalletEnode").val();
      NewWallet.networkid = $("#importwalletNetworkId").val();
      NewWallet.wsport = "8551";
      NewWallet.wsaddress =  "127.0.0.1";
      NewWallet.port = "30317";
      NewWallet.contractaddress = $("#importwalletContractAddress").val();
    }
    }


    NewWallet.autounlock = true; // wallet set to autounlock by default
    NewWallet.unlocktime = 10 * 60; // 10 minutes (in seconds) 

    NewWallet.seedcreationtype = 'importedseed';


    let _blockheight = $("#importwalletBlockHeight").val();
    const _seedblockheight = Number(_blockheight);
    if (!isNaN(_seedblockheight) && _seedblockheight > 0) {
      NewWallet.seedblockheight = _seedblockheight; 
    }
    else {
      NewWallet.seedblockheight = 0;
    }

    let setwalletdirectory = ipcRenderer.send("setWalletDataDbPath", NewWallet.datadirectory);

    ipcRenderer.send("storeWallet", NewWallet);    

    let _wallet = ipcRenderer.sendSync("getWallet", {masteraddress: NewWallet.masteraddress});
    ipcRenderer.send("initializeGeth", _wallet);

    if (!ipcRenderer.listenerCount("initializeGethResponse")) {
      ipcRenderer.on("initializeGethResponse", (event, code) => {
       // console.log('code response is', code);
        _wallet.pw = pw;
        ipcRenderer.send("startGeth", _wallet);
        _wallet.pw = '';
        InitializeWeb3toImportAccount(_wallet);
      }); 
    }

  });

  $("#ResetImportMnemonic").off("click").on("click", function () {

    imported_mnemonic = '';
    imported_mnemonic_array = '';
    user_mnemonic_order_array = [];
    address = '';
    pk = '';
    pw = '';
    masterSeed = '';

    $("#InputMnemonicDiv").show();  
    $("#ImportMnemonicDiv").show();
    $("#HelperImportMnemonic").html("Enter a valid mnemonic seed. Etica GUI will generate wallet addresses from the seed. Your seed allows you to restore your wallet from any other computer.");
    $("#NewImportMnemonic").html('');
    $("#NewImportMnemonic").css('display', 'none');
    $("#GoCheckImportMnemonicDiv").css('display', 'none');
    $("#NewImportEticaAddress").html('');
    $("#NewImportEticaAddress").css('display', 'none');
    $("#ResetImportMnemonicDiv").css('display', 'none');

  });


  function InitializeWeb3toImportAccount(_wallet) {
    let stoploop = false;
    var InitWeb3 = setInterval(async function () {
      try {

        let _provider = new Web3.providers.WebsocketProvider("ws://localhost:8551");
        web3Local = new Web3(_provider);

        web3Local.eth.net.isListening(function (error, success) {
          //Geth is ready
          if (!error) {
            clearInterval(InitWeb3);

            if(!stoploop){
              stoploop == true;
              var newaccount = EticaBlockchain.importFromPrivateKey(pk, pw, function (error) {
                //EticaMainGUI.showGeneralErrorImportWallet(error);
                console.log('Import seed Error importFromPrivateKey:', error);
              }, function (account) {
                if (account) {

                  pk = '';
                  pw = '';
  
                  // close web3Local connection then
                  web3Local.currentProvider.connection.close();
                  // stopGeth
                  ipcRenderer.send("stopGeth", null);
                  
                  // save preload for  wallet preload settings connection:
                  let preloadw = {};
                  preloadw.keyword = 'LastWalletUsed';
                  preloadw.walletname = _wallet.name;
                  preloadw.walletdirectory = _wallet.datadirectory;
                  preloadw.blockchaindirectory = _wallet.blockchaindirectory; 
                  preloadw.walletaddress = _wallet.masteraddress;
                  ipcRenderer.send("InsertOrUpdateWalletPreload", preloadw);

                  // move to setup:
                  window.location.replace('./../../../setup.html');

                  /* Removed direct connection to wallet, 
                  because redrirect to setup instead (above)
                  (same as redirect to setup but removes ipcRenderer.send("stopGeth", null);)
                  Former code:
                  // close web3Local connection then
                  web3Local.currentProvider.connection.close();
                  // move to index:
                  window.location.replace('./../../../index.html');
                  Removed direct connection to wallet */
          
                } else {
                  //EticaMainGUI.showGeneralErrorImportWallet("Error importing account from private key!");
                  console.log('Import seed Error importing account from private key!');
                }
              });

            }

          }
        });
      } catch (err) {
        //EticaMainGUI.showGeneralErrorImportWallet(err);
        console.log('Import seed InitializeWeb3toImportAccount try error: ', err);
      }
    }, 2000);
    
    }


        // ASSIGN FOLDERS TO NEW WALLET //

        $("#importwalletdirectory").off("click").on("click", async function () {

          try {
           let walletpath = ipcRenderer.send("assignWalletFoldertoWalletImport", {});
          } catch (error) {
            if (error.message === "NoNewWalletFolderAssignedImport") {
              // Handle user cancelation
             // console.log("Canceled wallet folder selection");
            } else {
              // Handle other errors
              console.error("Error selecting wallet folder:", error);
            }
          }
      
        });
    
        $("#importblockchaindirectory").off("click").on("click", async function () {
    
          try {
           let blockchainpath = ipcRenderer.send("assignBlockchainFoldertoWalletImport", {});
          } catch (error) {
            if (error.message === "NoNewBlockchainFolderAssignedImport") {
              // Handle user cancelation
             // console.log("Canceled wallet folder selection");
            } else {
              // Handle other errors
              console.error("Error selecting wallet folder:", error);
            }
          }
      
        });
    
        ipcRenderer.on("NewWalletFolderAssignedImport", (event, _folderpath) => {
          $("#importwalletdirectory").val(_folderpath);
        });
    
        ipcRenderer.on("NewBlockchainFolderAssignedImport", (event, _folderpath) => {
          $("#importblockchaindirectory").val(_folderpath);
        });


        // use this function to pre fill directories fields:
        function loadpreloadwallet() {
        
          let walletpreload = ipcRenderer.sendSync("getWalletPreload", "LastWalletUsed");      
        
          if(walletpreload && walletpreload.walletdirectory){
            let walletfolder = path.dirname(path.dirname(walletpreload.walletdirectory)); // removes walletdata/address subfolders
            $("#importwalletdirectory").val(walletfolder);
          }

          if(walletpreload && walletpreload.blockchaindirectory){
            $("#importblockchaindirectory").val(walletpreload.blockchaindirectory);
          }
        
          }
        
          loadpreloadwallet();
    
        // ASSIGN FOLDERS TO NEW WALLET //