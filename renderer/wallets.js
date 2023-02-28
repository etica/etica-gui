const {ipcRenderer} = require("electron");
const bip39 = require("bip39");
const { hdkey } = require('ethereumjs-wallet');
const util = require('ethereumjs-util');
const crypto = require('crypto');

class Wallets {
  constructor() {
    this.addressList = [];
    this.runningwallet = {};

  /*  $.getJSON("https://min-api.cryptocompare.com/data/price?fsym=EGAZ&tsyms=USD", function (price) {
      EticaWallets._setPrice(price.USD);
    }); */
  }

  /*
  _setPrice(price) {
    this.price = price;
  } */

  Setrunningwallet(_wallet) {
    this.runningwallet = _wallet;
  } 

  Getrunningwallet(_wallet) {
    return this.runningwallet;
  } 

  getAddressList() {
    return this.addressList;
  }

  clearAddressList() {
    this.addressList = [];
  }

  getAddressExists(address) {
    if (address) {
      return this.addressList.indexOf(address.toLowerCase()) > -1;
    } else {
      return false;
    }
  }

  addAddressToList(address) {
    if (address) {
      this.addressList.push(address.toLowerCase());
    }
  }

  enableButtonTooltips() {
    EticaUtils.createToolTip("#btnNewAddress", "Create New Address");
    EticaUtils.createToolTip("#btnRefreshAddress", "Refresh Address List");
    EticaUtils.createToolTip("#btnExportAccounts", "Export Addresses");
  }

  validateNewAccountForm() {
    if (EticaMainGUI.getAppState() == "account") {
      if (!$("#walletPasswordFirst").val()) {
        EticaMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if (!$("#walletPasswordSecond").val()) {
        EticaMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if ($("#walletPasswordFirst").val() !== $("#walletPasswordSecond").val()) {
        EticaMainGUI.showGeneralError("Passwords do not match!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  validateImportFromKeyForm() {
    if (EticaMainGUI.getAppState() == "account") {
      if (!$("#inputPrivateKey").val()) {
        EticaMainGUI.showGeneralError("Private key cannot be empty!");
        return false;
      }

      if (!$("#keyPasswordFirst").val()) {
        EticaMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if (!$("#keyPasswordSecond").val()) {
        EticaMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if ($("#keyPasswordFirst").val() !== $("#keyPasswordSecond").val()) {
        EticaMainGUI.showGeneralError("Passwords do not match!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  renderWalletsState() {
    // clear the list of addresses
    EticaWallets.clearAddressList();

    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      data.addressData.forEach(element => {
        EticaWallets.addAddressToList(element.address);
      });

      let _runningwallet = ipcRenderer.sendSync("getRunningWallet");
      EticaWallets.Setrunningwallet(_runningwallet);
      console.log('runningwallet is', EticaWallets.Getrunningwallet());

      console.log('node version: ', process.version);

      // render the wallets current state
      EticaMainGUI.renderTemplate("wallets.html", data);
      $(document).trigger("render_wallets");
      EticaWallets.enableButtonTooltips();

    });
  }
}

// the event to tell us that the wallets are rendered
$(document).on("render_wallets", function () {
  if ($("#addressTable").length > 0) {
    new Tablesort(document.getElementById("addressTable"));
    $("#addressTable").floatThead();
  }

  $("#btnNewAddress").off("click").on("click", async function () {
    $("#dlgCreateWalletPassword").iziModal();
    $("#walletPasswordFirst").val("");
    $("#walletPasswordSecond").val("");
    $("#dlgCreateWalletPassword").iziModal("open");

    async function doCreateNewWallet() {
      $("#dlgCreateWalletPassword").iziModal("close");


      if (EticaWallets.validateNewAccountForm()) {

        let password = $("#walletPasswordFirst").val();

        // get master privatekey from password:
        var datadir = EticaWallets.Getrunningwallet().keystoredirectory;
        var address= EticaWallets.Getrunningwallet().masteraddress;


        const encryptedData = Buffer.from(EticaWallets.Getrunningwallet().encryptedMaster, 'hex');
        const iv = Buffer.from(EticaWallets.Getrunningwallet().vector, 'hex');
        const salt = Buffer.from(EticaWallets.Getrunningwallet().salt, 'hex');

        // Derive the encryption key using pbkdf2Sync with the loaded salt
       const iterations = 100000;
       const keyLength = 32;
       const hashFunction = 'sha256';
       const encryptionKey = crypto.pbkdf2Sync(
        password, // or any other passphrase used for encryption
        salt,
        iterations,
        keyLength,
        hashFunction
      );

        // Create a cipher using createDecipheriv with AES-256-CBC mode
           const cipherAlgorithm = 'aes-256-cbc';
           const decipher = crypto.createDecipheriv(cipherAlgorithm, encryptionKey, iv);

           let decryptedData = decipher.update(encryptedData);
           decryptedData = Buffer.concat([decryptedData, decipher.final()]);

           const masterPrivateKey = decryptedData.toString('hex');

        // get index of new account:
           let accounts = await EticaBlockchain.AsyncgetAccounts();
           console.log('accounts is:', accounts);
           const newindex = accounts.length;
           console.log('new index is:', newindex);

        // create new address:

        const hdwallet = hdkey.fromMasterSeed(Buffer.from(masterPrivateKey, 'hex'));
        const newWallet = hdwallet.derivePath("m/44'/60'/0'/0/"+newindex+"").getWallet();

        const PrivateKey = newWallet.getPrivateKey();
        const newPrivateKeyString = PrivateKey.toString('hex');


        EticaBlockchain.importFromPrivateKey(newPrivateKeyString, password, function (error) {
          EticaMainGUI.showGeneralError(error);
        }, function (account) {

          EticaWallets.addAddressToList(account);
          EticaWallets.renderWalletsState();
          iziToast.success({title: "Created", message: "New wallet address was successfully created", position: "topRight", timeout: 5000});

        });


        
      }
    }

    $("#btnCreateWalletConfirm").off("click").on("click", function () {
      doCreateNewWallet();
    });

    $("#dlgCreateWalletPassword").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doCreateNewWallet();
      }
    });
  }); 

  $(".btnShowAddressTransactions").off("click").on("click", function () {
    EticaTransactions.setFilter($(this).attr("data-wallet"));
    EticaMainGUI.changeAppState("transactions");
    EticaTransactions.renderTransactions();
  });

  $(".btnShowQRCode").off("click").on("click", function () {
    var QRCodeAddress = $(this).attr("data-address");
    $("#dlgShowAddressQRCode").iziModal();
    $("#addrQRCode").html("");
    $("#addrQRCode").qrcode(QRCodeAddress);
    $("#dlgShowAddressQRCode").iziModal("open");

    $("#btnScanQRCodeClose").off("click").on("click", function () {
      $("#dlgShowAddressQRCode").iziModal("close");
    });
  });

  $(".btnChangWalletName").off("click").on("click", function () {
    var walletAddress = $(this).attr("data-wallet");
    var walletName = $(this).attr("data-name");

    $("#dlgChangeWalletName").iziModal();
    $("#inputWalletName").val(walletName);
    $("#dlgChangeWalletName").iziModal("open");

    function doChangeWalletName() {
      var addressesnames = EticaDatabase.getAddressesNames();

      // set the wallet name from the dialog box
      addressesnames.names[walletAddress] = $("#inputWalletName").val();
      EticaDatabase.setAddressesNames(addressesnames);

      $("#dlgChangeWalletName").iziModal("close");
      EticaWallets.renderWalletsState();
    }

    $("#btnChangeWalletNameConfirm").off("click").on("click", function () {
      doChangeWalletName();
    });

    $("#dlgChangeWalletName").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doChangeWalletName();
      }
    });
  });

  $("#btnRefreshAddress").off("click").on("click", function () {
    EticaWallets.renderWalletsState();
  });

  $("#btnExportAccounts").off("click").on("click", function () {
    ipcRenderer.send("exportAccounts", {});
  });

  /*
  $("#btnImportAccounts").off("click").on("click", function () {
    var ImportResult = ipcRenderer.sendSync("importAccounts", {});

    if (ImportResult.success) {
      iziToast.success({title: "Imported", message: ImportResult.text, position: "topRight", timeout: 2000});
    } else if (ImportResult.success == false) {
      EticaMainGUI.showGeneralError(ImportResult.text);
    }
  });

  $("#btnImportFromPrivateKey").off("click").on("click", function () {
    $("#dlgImportFromPrivateKey").iziModal();
    $("#inputPrivateKey").val("");
    $("#dlgImportFromPrivateKey").iziModal("open");

    function doImportFromPrivateKeys() {
      $("#dlgImportFromPrivateKey").iziModal("close");

      if (EticaWallets.validateImportFromKeyForm()) {
        var account = EticaBlockchain.importFromPrivateKey($("#inputPrivateKey").val(), $("#keyPasswordFirst").val(), function (error) {
          EticaMainGUI.showGeneralError(error);
        }, function (account) {
          if (account) {
            EticaWallets.renderWalletsState();
            iziToast.success({title: "Imported", message: "Account was succesfully imported", position: "topRight", timeout: 2000});
          } else {
            EticaMainGUI.showGeneralError("Error importing account from private key!");
          }
        });
      }
    }

    $("#btnImportFromPrivateKeyConfirm").off("click").on("click", function () {
      doImportFromPrivateKeys();
    });

    $("#dlgImportFromPrivateKey").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doImportFromPrivateKeys();
      }
    });
  });
  */

  $(".textAddress").off("click").on("click", function () {
    EticaMainGUI.copyToClipboard($(this).html());

    iziToast.success({title: "Copied", message: "Address was copied to clipboard", position: "topRight", timeout: 2000});
  });
});

// event that tells us that geth is ready and up
$(document).on("onGethReady", function () {
  EticaMainGUI.changeAppState("account");
  EticaWallets.renderWalletsState();
});

$(document).on("onNewAccountTransaction", function () {
  if (EticaMainGUI.getAppState() == "account") {
    EticaWallets.renderWalletsState();
  }
});

EticaWallets = new Wallets();
