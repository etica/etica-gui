const {ipcRenderer} = require("electron");
const bip39 = require("bip39");
const { hdkey } = require('ethereumjs-wallet');
const util = require('ethereumjs-util');
const crypto = require('crypto');
const HDKey = require('hdkey');

let mnemonic;
let user_mnemonic_order_array = [];
let address;
let pk;
let pw;
let masterSeed;


function normalizeString(str) {
  return str.trim().replace(/\s+/g, ' ');
}

function GenerateNewSeed(){
   // reinitialize mnemonic
   mnemonic = '';
   user_mnemonic_order_array = [];

   $("#SetWalletInfoContainer").css('display', 'none');
   $("#ResetMnemonicDiv").css('display', 'none');
   $("#GoCheckMnemonicDiv").css('display', 'none');
   $("#NewEticaAddress").css('display', 'none');
   $("#CheckMnemonic").css('display', 'none');
 
 
   const strength = 256; // strength in bits, must be a multiple of 32
   mnemonic = bip39.generateMnemonic(strength);
 
   const passphrase = ''; // insert your optional passphrase here
   const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
 
 
 // Generate a key pair from the seed
 const hdWallet = hdkey.fromMasterSeed(seed);
 const hdMaster = hdkey.fromMasterSeed(Buffer.from(seed, 'hex'));


 /*
 // Derive the extended private key for the HD master node
 const privateExtendedKey = hdMaster.privateExtendedKey();

 const PK = HDKey.fromExtendedKey(privateExtendedKey);
 const _masterPrivateKey = PK.privateKey.toString('hex');

masterPrivateKey = _masterPrivateKey; */

const _masterSeed = seed.toString('hex');
masterSeed = _masterSeed;


 const wallet = hdWallet.derivePath("m/44'/60'/0'/0/0").getWallet();
 const privateKey = wallet.getPrivateKey();
 const publicKey = wallet.getPublicKey();
 
 /*
 console.log('Generated seed:', seed.toString('hex'));
 console.log('Private key:', privateKey.toString('hex'));
 console.log('Public key:', publicKey.toString('hex'));
 console.log('Private key String:', privateKeyString); 
 */

 pk = privateKey.toString('hex');
 const privateKeyBuffer = Buffer.from(privateKey, 'hex');

 if (!util.isValidPrivate(privateKeyBuffer)) {
  EticaMainGUI.showGeneralErrorNewWallet("Error, Invalid private key!");
  return false;
 }
 
 // Calculate the Ethereum address from the public key
 let address_without0x = util.pubToAddress(publicKey, true).toString('hex');
 address = '0x' + address_without0x;
 
 
   $("#GenerateMnemonicDiv").hide();
   $("#HelperMnemonic").html("This is your mnemonic (seed)");
   $("#NewMnemonic").css('display', 'block');
   $("#NewMnemonic").html(mnemonic);
   $("#GoCheckMnemonicDiv").css('display', 'block');
 
   $("#NewEticaAddress").css('display', 'block');
   $("#NewEticaAddress").html('Etica address: '+address+'');
}


$("#InitializeWallet").off("click").on("click", function () {

  $("#CreateSeedContainer").css('display', 'none');
  $("#SetWalletInfoContainer").css('display', 'block');

});


 $("#GenerateMnemonic").off("click").on("click", function () {

  GenerateNewSeed();

  });

  $("input[name='wallettype']").click(function() {

    if ($("#wallettestnet").is(":checked")) {
      // testnet wallet:
      $("#NewWalletNetworkIdDiv").css('display', 'block');
      $("#NewWalletEnodeDiv").css('display', 'block');
      $("#NewWalletContractAddressDiv").css('display', 'block');
    } else {
      // mainnet wallet, not necessary & user can update settings once wallet created:
      $("#NewWalletNetworkIdDiv").css('display', 'none');
      $("#NewWalletEnodeDiv").css('display', 'none');
      $("#NewWalletContractAddressDiv").css('display', 'none');
    }
    
});  


  $("#GoCheckMnemonic").off("click").on("click", function () {

    $(".mnemonicwords").show();

    $("#NewMnemonic").css('display', 'none');
    $("#GoCheckMnemonicDiv").css('display', 'none');
    $("#NewEticaAddress").css('display', 'none');
    $("#CheckMnemonic").css('display', 'block');

    $("#HelperMnemonic").html("Select words in right order");

    // extract words:

    const initialWords = mnemonic.split(' ');


// Shuffle the indices using the Fisher-Yates shuffle algorithm
const indices = Array.from(Array(24).keys());
for (let i = indices.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [indices[i], indices[j]] = [indices[j], indices[i]];
}

// Rearrange the words according to the shuffled indices
const reorderedWords = indices.map(index => initialWords[index]);
$("#word1").html(reorderedWords[0]);
$("#word2").html(reorderedWords[1]);
$("#word3").html(reorderedWords[2]);
$("#word4").html(reorderedWords[3]);
$("#word5").html(reorderedWords[4]);
$("#word6").html(reorderedWords[5]);
$("#word7").html(reorderedWords[6]);
$("#word8").html(reorderedWords[7]);
$("#word9").html(reorderedWords[8]);
$("#word10").html(reorderedWords[9]);
$("#word11").html(reorderedWords[10]);
$("#word12").html(reorderedWords[11]);
$("#word13").html(reorderedWords[12]);
$("#word14").html(reorderedWords[13]);
$("#word15").html(reorderedWords[14]);
$("#word16").html(reorderedWords[15]);
$("#word17").html(reorderedWords[16]);
$("#word18").html(reorderedWords[17]);
$("#word19").html(reorderedWords[18]);
$("#word20").html(reorderedWords[19]);
$("#word21").html(reorderedWords[20]);
$("#word22").html(reorderedWords[21]);
$("#word23").html(reorderedWords[22]);
$("#word24").html(reorderedWords[23]);


  });


  $(".mnemonicwords").off("click").on("click", function () {
    user_mnemonic_order_array.push($(this).html());
    $(this).hide();

    if(user_mnemonic_order_array.length == 24){
      // check mnemonic:
      let usermnemonic = user_mnemonic_order_array.join(' ');

      if(normalizeString(mnemonic) === normalizeString(usermnemonic)){
       $("#CheckMnemonic").css('display', 'none');
       $("#HelperMnemonic").html("Your mnemonic is verified. ");
       $("#InitializeWalletDiv").css('display', 'block');

      }
      else {
       // console.log('invalidmnemonic');
        $("#HelperMnemonic").html("You provided a wrong word order for this mnemonic. Please try again");
        $("#ResetMnemonicDiv").css('display', 'block');
      }


    }

  });


  $("#CreateWallet").off("click").on("click", function () {

    // creates wallet from seed
    let NewWallet = {};

    pw = $("#walletpassword").val();
    
    if(!$("#walletname").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Wallet name cannot be empty!");
      return false;
    }

    if(!$("#blockchaindirectory").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Blockchain directory name cannot be empty!");
      return false;
    }

    if(!$("#walletdirectory").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Wallet directory name cannot be empty!");
      return false;
    }

    
    if($("input[name='wallettype']:checked").val() == 'testnet' && !$("#NewWalletNetworkId").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Blockchain Network ID cannot be empty!");
      return false;
    }
    
    if($("input[name='wallettype']:checked").val() == 'testnet' && !$("#NewWalletEnode").val()){
      let enodeUrl = $("#NewWalletEnode").val();
      if (!(typeof enodeUrl === "string" && enodeUrl.startsWith("enode://"))) {
        EticaMainGUI.showGeneralError('Enode is invalid. An enode url should start with enode://');
        return false;
      }
    }

    if($("input[name='wallettype']:checked").val() == 'testnet' && !$("#NewWalletContractAddress").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Etica smart contract address cannot be empty!");
      return false;
    }

    
    if(!$("#walletpassword").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Password cannot be empty!");
      return false;
    }

    if($("#walletpassword").val() != $("#walletpasswordconf").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Passwords do not match!");
      return false;
    }

    if (pw != $("#walletpassword").val()){
      EticaMainGUI.showGeneralErrorNewWallet("Error, try again!"); // should never happen but extra security measure in case $("#walletpassword").val() changes value unexpectedly
      return false;
    }

    NewWallet.name = $("#walletname").val();
    NewWallet.type = $("input[name='wallettype']:checked").val();
    //NewWallet.masteraddress = address; Warning, dont forget to replace by address aftr tests
    NewWallet.masteraddress = address;
    
    NewWallet.blockchaindirectory = $("#blockchaindirectory").val();
    NewWallet.keystoredirectory = ''+$("#walletdirectory").val()+'/keystores/'+NewWallet.masteraddress+'/keystore';
    NewWallet.datadirectory = ''+$("#walletdirectory").val()+'/walletdata/'+NewWallet.masteraddress+'';

    /* Used if advanced settings:
    NewWallet.blockchaindirectory = $("#blockchaindirectory").val();
    NewWallet.keystoredirectory = $("#keystoredirectory").val();
    NewWallet.datadirectory = $("#datadirectory").val();

    */

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

// Store the encrypted master private key, salt, and initialization vector (iv)

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
    if($("#NewWalletNetworkId").val() == "61803"){
      EticaMainGUI.showGeneralErrorImportWallet("Error, NetworkId can't be equal to mainnet NetworkId (61803) for a Testnet wallet!");
      return false;
    }
    else{
      NewWallet.enode = $("#NewWalletEnode").val();
      NewWallet.networkid = $("#NewWalletNetworkId").val();
      NewWallet.wsport = "8551";
      NewWallet.wsaddress =  "127.0.0.1";
      NewWallet.port = "30317";
      NewWallet.contractaddress = $("#NewWalletContractAddress").val();
    }
    }

    NewWallet.autounlock = true; // wallet set to autounlock by default
    NewWallet.unlocktime = 10 * 60; // 10 minutes (in seconds) 

    NewWallet.seedcreationtype = 'newseed';
    NewWallet.seedblockheight = null;

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

  $("#ResetMnemonic").off("click").on("click", function () {

   GenerateNewSeed();

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
                //EticaMainGUI.showGeneralErrorNewWallet(error);
                console.log('New seed importFromPrivateKey error:', error);
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
                  preloadw.walletaddress = _wallet.masteraddress;
                  ipcRenderer.send("InsertOrUpdateWalletPreload", preloadw);

                  // move to setup:
                  window.location.replace('./../../../setup.html');
          
                } else {
                  //EticaMainGUI.showGeneralErrorNewWallet("Error importing account from private key!");
                  console.log('New seed Error importing account from private key!');
                }
              });

            }

          }
        });
      } catch (err) {
       // EticaMainGUI.showGeneralErrorNewWallet(err);
       console.log('New seed InitializeWeb3toImportAccount try error: ', err);
      }
    }, 2000);
    
    }


    // ASSIGN FOLDERS TO NEW WALLET //

    $("#walletdirectory").off("click").on("click", async function () {

      try {
       let walletpath = ipcRenderer.send("assignWalletFoldertoNewWallet", {});
      } catch (error) {
        if (error.message === "NoNewWalletFolderAssigned") {
          // Handle user cancelation
         // console.log("Canceled wallet folder selection");
        } else {
          // Handle other errors
          console.error("Error selecting wallet folder:", error);
        }
      }
  
    });

    $("#blockchaindirectory").off("click").on("click", async function () {

      try {
       let blockchainpath = ipcRenderer.send("assignBlockchainFoldertoNewWallet", {});
      } catch (error) {
        if (error.message === "NoNewBlockchainFolderAssigned") {
          // Handle user cancelation
         // console.log("Canceled wallet folder selection");
        } else {
          // Handle other errors
          console.error("Error selecting wallet folder:", error);
        }
      }
  
    });

    ipcRenderer.on("NewWalletFolderAssigned", (event, _folderpath) => {
      $("#walletdirectory").val(_folderpath);
    });

    ipcRenderer.on("NewBlockchainFolderAssigned", (event, _folderpath) => {
      $("#blockchaindirectory").val(_folderpath);
    });

    // ASSIGN FOLDERS TO NEW WALLET //