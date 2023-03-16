// In renderer process (web page).
const {ipcRenderer} = require("electron");

class CreateDisease {
  constructor() {}

  renderSendState() {
    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaMainGUI.renderTemplate("createdisease.html", data);
      $(document).trigger("render_createDisease");
    });
  }

  validateSendForm() {
    if (EticaMainGUI.getAppState() == "createDisease") {
      if (!$("#createDiseaseFromAddress").val()) {
        EticaMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#createDiseaseFromAddress").val())) {
        EticaMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      // check disease name is right format:
      if (!$("#createDiseaseName").val()) {
        EticaMainGUI.showGeneralError("Please enter a disease name!");
        return false;
      }

      // check disease name is available:
      if (!JSON.stringify($("#createDiseaseName").val())) {
        EticaMainGUI.showGeneralError("This disease name already exists!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (EticaMainGUI.getAppState() == "createDisease") {
      $("#createDiseaseFromAddress").val("");
      $("#createDiseaseName").val("");
    }
  }
}

$(document).on("render_createDisease", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#createDiseaseFromAddress").on("change", async function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#createDiseaseFromAddressName").html(addrName.trim());

    let balance = await EticaContract.balanceEti(this.value);
    $("#createDiseaseMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));

  });

  $("#btnCreateDisease").off("click").on("click", async function () {
    if (DiseaseCreate.validateSendForm()) {


      let disease_exists = await EticaContract.getdiseasehashbyName($("#createDiseaseName").val());

      if(disease_exists != '0x0000000000000000000000000000000000000000000000000000000000000000'){
        EticaMainGUI.showGeneralError("This disease name already exists!");
        return false;
      }


      EticaContract.getTranasctionFee_createdisease($("#createDiseaseFromAddress").val(), $("#createDiseaseName").val(), function (error) {
        EticaMainGUI.showGeneralError(error);
      }, async function (data) {

        let isunlocked = await EticaBlockchain.isUnlocked($("#sendEtiFromAddress").val());

        $("#CreateDiseasewalletPassword").show();
        $(".sendTXPass").show();
        $(".sendTXdivider").show();

        if(isunlocked == 'unlocked'){
          $("#dlgCreateDiseaseWalletPassword").iziModal();
        $("#CreateDiseasewalletPassword").val("");
        $("#CreateDiseasewalletPassword").hide();
        $(".sendTXPass").hide();
        $(".sendTXdivider").hide();
        $("#fromEtiAddressInfo").html($("#createDiseaseFromAddress").val());
        $("#valueToCreateDiseaseInfo").html($("#createDiseaseName").val());
        $("#feeEtiToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCreateDiseaseWalletPassword").iziModal("open");
        }
        else{
          // Ask password
          $("#dlgCreateDiseaseWalletPassword").iziModal();
        $("#CreateDiseasewalletPassword").val("");
        $("#fromEtiAddressInfo").html($("#createDiseaseFromAddress").val());
        $("#valueToCreateDiseaseInfo").html($("#createDiseaseName").val());
        $("#feeEtiToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCreateDiseaseWalletPassword").iziModal("open");
        }


        function doSendTransaction() {
          $("#dlgCreateDiseaseWalletPassword").iziModal("close");

          let _password = null;
          if(isunlocked != 'unlocked') {
            _password = $("#CreateDiseasewalletPassword").val();
          }

          EticaContract.prepareTransaction_createdisease(_password, $("#createDiseaseFromAddress").val(), $("#createDiseaseName").val(), function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              DiseaseCreate.resetSendForm();

              iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});

              // unlock accounts
              let _wallet = ipcRenderer.sendSync("getRunningWallet");

                if(_wallet.autounlock){
                      EticaBlockchain.unlockAccounts(_password, _wallet.unlocktime);
                }

            /*  EticaBlockchain.getTransaction(data, function (error) {
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

        $("#btnCreateDiseaseWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgCreateDiseaseWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });
});

// create new disease
DiseaseCreate = new CreateDisease();

