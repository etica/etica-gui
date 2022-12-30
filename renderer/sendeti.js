// In renderer process (web page).
const {ipcRenderer} = require("electron");

class SendEti {
  constructor() {}

  renderSendState() {
    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaMainGUI.renderTemplate("sendeti.html", data);
      $(document).trigger("render_sendEti");
    });
  }

  validateSendForm() {
    if (EticaMainGUI.getAppState() == "sendEti") {
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

$(document).on("render_sendEti", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#sendEtiFromAddress").on("change", async function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#sendEtiFromAddressName").html(addrName.trim());

    let balance = await EticaContract.balanceEti(this.value);
    $("#sendEtiMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));
  
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

  $("#btnLookForToAddressEti").off("click").on("click", function () {
    EticaBlockchain.getAddressListData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (addressList) {
      var addressBook = EticaAddressBook.getAddressList();

      for (var key in addressBook) {
        if (addressBook.hasOwnProperty(key)) {
          var adddressObject = {};
          adddressObject.address = key;
          adddressObject.name = addressBook[key];
          addressList.addressData.push(adddressObject);
        }
      }

      $("#dlgAddressListEti").iziModal({width: "800px"});
      EticaMainGUI.renderTemplate("addresslist.html", addressList, $("#dlgAddressListEtiBody"));
      $("#dlgAddressListEti").iziModal("open");

      $(".btnSelectToAddress").off("click").on("click", function () {
        $("#sendEtiToAddressName").html($(this).attr("data-name"));
        $("#sendEtiToAddress").val($(this).attr("data-wallet"));
        $("#dlgAddressListEti").iziModal("close");
      });

      $("#addressListFilter").off("input").on("input", function (e) {
        EticaUtils.filterTable($("#addressTable"), $("#addressListFilter").val());
      });

      $("#btnClearSearchField").off("click").on("click", function () {
        EticaUtils.filterTable($("#addressTable"), "");
        $("#addressListFilter").val("");
      });
    });
  });

  $("#btnAddToAddressBookEti").off("click").on("click", function () {
    if (EticaBlockchain.isAddress($("#sendEtiToAddress").val())) {
      $("#dlgEtiAddAddressToBook").iziModal();
      $("#inputAddressNameEti").val("");
      $("#dlgEtiAddAddressToBook").iziModal("open");

      function doAddAddressToAddressBook() {
        EticaAddressBook.setAddressName($("#sendEtiToAddress").val(), $("#inputAddressNameEti").val());
        $("#dlgEtiAddAddressToBook").iziModal("close");

        iziToast.success({title: "Success", message: "Address was added to address book", position: "topRight", timeout: 2000});
      }
    } else {
      EticaMainGUI.showGeneralError("Recipient address is not valid!");
    }

    $("#btnAddAddressToBookConfirmEti").off("click").on("click", function () {
      doAddAddressToAddressBook();
    });

    $("#dlgEtiAddAddressToBook").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doAddAddressToAddressBook();
      }
    });
  });

  $("#btnSendEti").off("click").on("click", function () {
    if (EtiSend.validateSendForm()) {
      console.log('EtiSend.validateSendForm() true');
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
              EtiSend.resetSendForm();

              iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});

             /* EticaBlockchain.getTransaction(data, function (error) {
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
              }); */

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
EtiSend = new SendEti();

