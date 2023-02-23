const {ipcRenderer} = require("electron");
const bip39 = require("bip39");
const { hdkey } = require('ethereumjs-wallet');
const util = require('ethereumjs-util');

let mnemonic;
let user_mnemonic_order_array = [];
let address;


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
 
   console.log('Generated mnemonic:', mnemonic);
 
   const passphrase = ''; // insert your optional passphrase here
   const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
 
   console.log('type of seed is', typeof seed);
   console.log('Generated seed:', seed.toString('hex'));
 
 
 // Generate a key pair from the seed
 const hdWallet = hdkey.fromMasterSeed(seed);
 const wallet = hdWallet.derivePath("m/44'/60'/0'/0/0").getWallet();
 const privateKey = wallet.getPrivateKey();
 const publicKey = wallet.getPublicKey();
 
 console.log('Private key:', privateKey.toString('hex'));
 console.log('Public key:', publicKey.toString('hex'));
 
 // Calculate the Ethereum address from the public key
 let address_without0x = util.pubToAddress(publicKey, true).toString('hex');
 address = '0x' + address_without0x;
 
 console.log('Ethereum address:', '0x' + address);
 
 
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


  $("#GoCheckMnemonic").off("click").on("click", function () {

    $(".mnemonicwords").show();

    $("#NewMnemonic").css('display', 'none');
    $("#GoCheckMnemonicDiv").css('display', 'none');
    $("#NewEticaAddress").css('display', 'none');
    $("#CheckMnemonic").css('display', 'block');

    $("#HelperMnemonic").html("Select words in right order");

    // extract words:

    const initialWords = mnemonic.split(' ');
    console.log('initialWords is', initialWords);


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
    console.log('user_mnemonic_order_array is', user_mnemonic_order_array);

    if(user_mnemonic_order_array.length == 24){
      // check mnemonic:
      let usermnemonic = user_mnemonic_order_array.join(' ');

      console.log('usermnemonic is: ', usermnemonic);

      if(normalizeString(mnemonic) === normalizeString(usermnemonic)){
       console.log('validmnemonic');
       $("#CheckMnemonic").css('display', 'none');
       $("#HelperMnemonic").html("Your mnemonic is verified. Click on <br> You can now initialize a new wallet with this seed. <br> (If you already have other wallets it will not suppress them)");
    

      }
      else {
        console.log('invalidmnemonic');
        $("#HelperMnemonic").html("You provided a wrong word order for this mnemonic. Please try again");
        $("#ResetMnemonicDiv").css('display', 'block');
      }


    }

  });


  $("#CreateWallet").off("click").on("click", function () {

    console.log('Vlicked on CeateWallet');

    // creates wallet from seed
    let NewWallet = {};

    NewWallet.name = $("#walletname").val();
    NewWallet.type = $("input[name='wallettype']:checked").val();
    //NewWallet.masteraddress = address; Warning, dont forget to replace by address aftr tests
    NewWallet.masteraddress = '0x6700221A184408BC7654b670f3B6790e0A7eF78a';
    
    NewWallet.blockchaindirectory = $("#blockchaindirectory").val();
    NewWallet.keystoredirectory = ''+$("#walletdirectory").val()+'/keystores/'+NewWallet.masteraddress+'';
    NewWallet.datadirectory = ''+$("#walletdirectory").val()+'/walletdata/'+NewWallet.masteraddress+'';

    /* Used if advanced settings:
    NewWallet.blockchaindirectory = $("#blockchaindirectory").val();
    NewWallet.keystoredirectory = $("#keystoredirectory").val();
    NewWallet.datadirectory = $("#datadirectory").val();

    */

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

    console.log('NewWallet is: ', NewWallet);

    ipcRenderer.send("storeWallet", NewWallet);    

    let _wallet = ipcRenderer.sendSync("getWallet", {masteraddress: NewWallet.masteraddress});
    console.log('retrieved _wallet is: ', _wallet);

    window.location.replace('./../../../index.html');

    ipcResult = ipcRenderer.send("startGeth", _wallet);


  });

  $("#ResetMnemonic").off("click").on("click", function () {

   GenerateNewSeed();

  });