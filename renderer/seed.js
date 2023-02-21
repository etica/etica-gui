const {ipcRenderer} = require("electron");
const bip39 = require("bip39");


 $("#GenerateMnemonic").off("click").on("click", function () {

  const strength = 256; // strength in bits, must be a multiple of 32
  const mnemonic = bip39.generateMnemonic(strength);

  console.log('Generated mnemonic:', mnemonic);

  const passphrase = ''; // insert your optional passphrase here
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);

  console.log('type of seed is', typeof seed);
  console.log('Generated seed:', seed.toString('hex'));

  $("#GenerateMnemonicDiv").hide();
  $("#HelperMnemonic").html("This is your seed.");
  $("#NewMnemonic").css('display', 'block');
  $("#NewMnemonic").html(mnemonic);
  $("#GoCheckMnemonicDiv").css('display', 'block');

  console.log('Generated mnemonic:', mnemonic);


  });