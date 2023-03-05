const {ipcRenderer} = require("electron");
const bip39 = require("bip39");
const { hdkey } = require('ethereumjs-wallet');
const util = require('ethereumjs-util');
const crypto = require('crypto');
const HDKey = require('hdkey');

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
    console.log('$("#word" + i).html() is', $("#word" + i).val());
    console.log('imported_mnemonic_array is: ', imported_mnemonic_array);
  }
 
  imported_mnemonic = imported_mnemonic_array.join(' ');
  console.log('imported_mnemonic is -> ', imported_mnemonic);
  //imported_mnemonic = 'tip wear indicate blast novel human october misery fruit yard friend choose message fee luggage gas between absorb ticket shiver fever message mule develop';
 

  if (bip39.validateMnemonic(imported_mnemonic)) {
    console.log('The mnemonic is valid!');
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
console.log('_masterSeed is:', _masterSeed);
masterSeed = _masterSeed;


 const wallet = hdWallet.derivePath("m/44'/60'/0'/0/0").getWallet();
 const privateKey = wallet.getPrivateKey();
 const publicKey = wallet.getPublicKey();

 pk = privateKey.toString('hex');
 const privateKeyBuffer = Buffer.from(privateKey, 'hex');

 if (!util.isValidPrivate(privateKeyBuffer)) {
  EticaMainGUI.showGeneralErrorImportWallet("Erroor, Invalid private key!");
  return false;
 }
 
 // Calculate the Ethereum address from the public key
 let address_without0x = util.pubToAddress(publicKey, true).toString('hex');
 address = '0x' + address_without0x;
 
 
 $("#InputMnemonicDiv").hide();  
 $("#ImportMnemonicDiv").hide();
   $("#HelperImportMnemonic").html("This is your mnemonic (seed). <br> Next screen will ask you to verify the mnemonic");
   $("#NewImportMnemonic").css('display', 'block');
   console.log('imported_mnemonic is :::::', imported_mnemonic);
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
        console.log('invalidmnemonic');
        $("#HelperImportMnemonic").html("You provided a wrong word order for this mnemonic. Please try again");
        $("#ResetImportMnemonicDiv").css('display', 'block');
      }


    }

  });


  $("#ImportWallet").off("click").on("click", function () {

    // creates wallet from seed
    let NewWallet = {};

    pw = $("#importwalletpassword").val();
    
    if(!$("#importwalletname").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Wallet name cannot be empty!");
      return false;
    }

    if(!$("#importblockchaindirectory").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Blockchain directory name cannot be empty!");
      return false;
    }

    if(!$("#importwalletdirectory").val()){
      EticaMainGUI.showGeneralErrorImportWallet("Wallet directory name cannot be empty!");
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
      EticaMainGUI.showGeneralErrorImportWallet("Error, try again!"); // should never happen but extra security measure in case $("#importwalletpassword").val() changes value unexpectedly
      return false;
    }

    NewWallet.name = $("#importwalletname").val();
    NewWallet.type = $("input[name='wallettype']:checked").val();
    //NewWallet.masteraddress = address; Warning, dont forget to replace by address aftr tests
    NewWallet.masteraddress = address;
    
    NewWallet.blockchaindirectory = $("#importblockchaindirectory").val();
    NewWallet.keystoredirectory = ''+$("#importwalletdirectory").val()+'/keystores/'+NewWallet.masteraddress+'/keystore';
    NewWallet.datadirectory = ''+$("#importwalletdirectory").val()+'/walletdata/'+NewWallet.masteraddress+'';

    /* Used if advanced settings:
    NewWallet.blockchaindirectory = $("#blockchaindirectory").val();
    NewWallet.keystoredirectory = $("#keystoredirectory").val();
    NewWallet.datadirectory = $("#datadirectory").val();

    */

// ------ ENCRYPT Master seed ---- //

// Generate a 128-bit salt
const salt = crypto.randomBytes(16);

// Derive a 256-bit encryption key from the passphrase and salt
console.log('deriving a 256-bit encryption key from password and salt');
console.log('pw is', pw);
console.log('salt is', salt);
const encryptionKey = crypto.pbkdf2Sync(pw, salt, 100000, 32, 'sha256');
console.log('encrypting with encryptionKey string format', encryptionKey.toString('hex'));

// Use the encryption key to encrypt the master seeed

const iv = crypto.randomBytes(16);
const cipherAlgorithm = 'aes-256-cbc';
const cipher = crypto.createCipheriv(cipherAlgorithm, Buffer.from(encryptionKey), iv);
let encryptedMasterSeed = cipher.update(masterSeed);
encryptedMasterSeed = Buffer.concat([encryptedMasterSeed, cipher.final()]);

// Store the encrypted master private key, salt, and initialization vector (iv)
console.log('Encrypted Master Private Key:', encryptedMasterSeed.toString('hex'));
console.log('Salt:', salt.toString('hex'));
console.log('Initialization Vector (iv):', iv.toString('hex'));
// ENCRYPT Master seed


NewWallet.encryptedMaster = encryptedMasterSeed.toString('hex');
NewWallet.salt = salt.toString('hex');
NewWallet.vector = iv.toString('hex');

// ---- ENCRYPT Master seed ----- //

    if(NewWallet.type == 'mainnet'){
      // set mainnet values
      NewWallet.enode = '';
      NewWallet.networkid = "";
      NewWallet.wsport = "8551";
      NewWallet.wsaddress =  "127.0.0.1";
      NewWallet.port = "30317";
    }
    else {
     // Testnet values entered by user
     NewWallet.enode = 'enode://56427938056c62a4a3f3bd1d7411e590ed8667e69712d3eb7474293f0bbf94aa4c1d11cb3a8b6ce0a86c31c4a6b1048796eaa8afb984b66be4990a10cf1dc9e7@127.0.0.1:30303';
    NewWallet.networkid = "686970";
    NewWallet.wsport = "8551";
    NewWallet.wsaddress =  "127.0.0.1";
    NewWallet.port = "30317";

    }

    ipcRenderer.send("storeWallet", NewWallet);    

    let _wallet = ipcRenderer.sendSync("getWallet", {masteraddress: NewWallet.masteraddress});

    ipcResult = ipcRenderer.send("startGeth", _wallet);

    InitializeWeb3toImportAccount();

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


  function InitializeWeb3toImportAccount() {
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
                EticaMainGUI.showGeneralErrorImportWallet(error);
              }, function (account) {
                if (account) {

                  pk = '';
                  pw = '';
  
                  // close web3Local connection then
                  web3Local.currentProvider.connection.close();
                  // move to index:
                  window.location.replace('./../../../index.html');
          
                } else {
                  EticaMainGUI.showGeneralErrorImportWallet("Error importing account from private key!");
                }
              });

            }

          }
        });
      } catch (err) {
        EticaMainGUI.showGeneralErrorImportWallet(err);
      }
    }, 2000);
    
    }