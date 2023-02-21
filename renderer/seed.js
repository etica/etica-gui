const {ipcRenderer} = require("electron");
const bip39 = require("bip39");
const { hdkey } = require('ethereumjs-wallet');
const util = require('ethereumjs-util');


 $("#GenerateMnemonic").off("click").on("click", function () {

  const strength = 256; // strength in bits, must be a multiple of 32
  const mnemonic = bip39.generateMnemonic(strength);

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
const address = '0x' + address_without0x;

console.log('Ethereum address:', '0x' + address);


  $("#GenerateMnemonicDiv").hide();
  $("#HelperMnemonic").html("This is your seed");
  $("#NewMnemonic").css('display', 'block');
  $("#NewMnemonic").html(mnemonic);
  $("#GoCheckMnemonicDiv").css('display', 'block');

  $("#NewEticaAddress").css('display', 'block');
  $("#NewEticaAddress").html('Etica address: '+address+'');


  });