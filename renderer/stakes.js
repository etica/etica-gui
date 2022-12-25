// In renderer process (web page).
const {ipcRenderer} = require("electron");

class EticaStakes {
  constructor() {
    this.addressList = [];
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

  renderStakesState() {
    EticaContract.getStakesData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      console.log('getStakesData data is ', data);
      EticaMainGUI.renderTemplate("stakes.html", data);
      $(document).trigger("render_stakes");
    });
  }

  validateSendForm() {
    if (EticaMainGUI.getAppState() == "stakes") {
      if (!$("#sendEtiFromAddress").val()) {
        EticaMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#sendEtiFromAddress").val())) {
        EticaMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      if (!$("#sendEtiToAddress").val()) {
        EticaMainGUI.showGeneralError("Recipient address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#sendEtiToAddress").val())) {
        EticaMainGUI.showGeneralError("Recipient address must be a valid address!");
        return false;
      }

      if (Number($("#sendEtiAmmount").val()) <= 0) {
        EticaMainGUI.showGeneralError("Send ammount must be greater then zero!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (EticaMainGUI.getAppState() == "send") {
      $("#sendEtiToAddressName").html("");
      $("#sendEtiToAddress").val("");
      $("#sendEtiAmmount").val(0);
    }
  }
}

$(document).on("render_stakes", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#sendEtiFromAddress").on("change", function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#sendEtiFromAddressName").html(addrName.trim());

    web3Local.eth.getBalance(this.value, function (error, balance) {
      $("#sendEtiMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));
    });
  });

  $("#btnSendEtiAll").off("click").on("click", function () {
    $("#sendEtiAmmount").focus();
    $("#sendEtiAmmount").val($("#sendEtiMaxAmmount").html());
  });

  $("#sendEtiToAddress").off("input").on("input", function () {
    var addressName = null;
    $("#sendEtiToAddressName").html("");
    addressName = EticaAddressBook.getAddressName($("#sendEtiToAddress").val());

    if (!addressName) {
      var wallets = EticaDatatabse.getWallets();
      addressName = wallets.names[$("#sendEtiToAddress").val()];
    }
    $("#sendEtiToAddressName").html(addressName);
  });

  $("#btnSendEti").off("click").on("click", function () {
    if (StakesEtica.validateSendForm()) {
      console.log('StakesEtica.validateSendForm() true');
      console.log('$("#sendEtiFromAddress").val()', $("#sendEtiFromAddress").val());
      console.log('$("#sendEtiToAddress").val()', $("#sendEtiToAddress").val());
      console.log('$("#sendEtiAmmount").val()', $("#sendEtiAmmount").val());
      EticaContract.getTranasctionFee_sendEti($("#sendEtiFromAddress").val(), $("#sendEtiToAddress").val(), $("#sendEtiAmmount").val(), function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        $("#dlgSendEtiWalletPassword").iziModal();
        $("#walletPasswordEti").val("");
        $("#fromEtiAddressInfo").html($("#sendEtiFromAddress").val());
        $("#toEtiAddressInfo").html($("#sendEtiToAddress").val());
        $("#valueToSendEtiInfo").html($("#sendEtiAmmount").val());
        $("#feeEtiToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgSendEtiWalletPassword").iziModal("open");

        function doSendTransaction() {
          $("#dlgSendEtiWalletPassword").iziModal("close");

          EticaContract.prepareTransaction_SendEti($("#walletPasswordEti").val(), $("#sendEtiFromAddress").val(), $("#sendEtiToAddress").val(), $("#sendEtiAmmount").val(), function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              StakesEtica.resetSendForm();

              iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});

              EticaBlockchain.getTransaction(data, function (error) {
                EticaMainGUI.showGeneralError(error);
              }, function (transaction) {
                ipcRenderer.send("storeTransaction", {
                  block: transaction.blockNumber,
                  txhash: transaction.hash.toLowerCase(),
                  fromaddr: transaction.from.toLowerCase(),
                  timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
                  toaddr: transaction.to.toLowerCase(),
                  value: transaction.value
                });
              });
            });
          });
        }

        $("#btnSendEtiWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgSendEtiWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });
});

// create new account variable
StakesEtica = new EticaStakes();

