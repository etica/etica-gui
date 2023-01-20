// In renderer process (web page).
const {ipcRenderer} = require("electron");

class CreateChunk {
  constructor() {}

  renderSendState() {
    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaMainGUI.renderTemplate("createchunk.html", data);
      $(document).trigger("render_createChunk");
    });
  }

  validateSendForm() {
    if (EticaMainGUI.getAppState() == "createChunk") {
      if (!$("#createChunkFromAddress").val()) {
        EticaMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#createChunkFromAddress").val())) {
        EticaMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      
      // check disease hash exists:
      if (!JSON.stringify($("#createChunkDiseaseHash").val())) {
        EticaMainGUI.showGeneralError("This disease hash is invalid!");
        return false;
      }

      // check title name is in right format:
      if (!JSON.stringify($("#createChunkTitle").val())) {
        EticaMainGUI.showGeneralError("This disease name is invalid!");
        return false;
      }

      // check chunk title name doesnt already exists for this disease:
      if (!JSON.stringify($("#createChunkTitle").val())) {
        EticaMainGUI.showGeneralError("This chunk Title already exists!");
        return false;
      }

      // check description is in right format:
      if (!JSON.stringify($("#createChunkDescription").val())) {
        EticaMainGUI.showGeneralError("This description is invalid!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (EticaMainGUI.getAppState() == "createChunk") {
      $("#createChunkFromAddress").val("");
      $("#createChunkTitle").val("");
    }
  }
}

$(document).on("render_createChunk", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#createChunkFromAddress").on("change", async function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#createChunkFromAddressName").html(addrName.trim());

    let balance = await EticaContract.balanceEti(this.value);
    $("#createChunkMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));

  });

  $("#btnCreateChunk").off("click").on("click", function () {
    if (ChunkCreate.validateSendForm()) {

      EticaContract.getTranasctionFee_createchunk($("#createChunkFromAddress").val(), $("#createChunkDiseaseHash").val(), $("#createChunkTitle").val(), $("#createChunkDescription").val(), function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        $("#dlgCreateChunkiWalletPassword").iziModal();
        $("#CreateChunkwalletPassword").val("");
        $("#fromEtiAddressInfo").html($("#createChunkFromAddress").val());
        $("#valueToCreateChunkDiseaseHash").html($("#createChunkDiseaseHash").val());
        $("#valueToCreateChunkTitle").html($("#createChunkTitle").val());
        $("#valueToCreateChunkDescription").html($("#createChunkDescription").val());
        $("#feeEtiToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCreateChunkiWalletPassword").iziModal("open");

        function doSendTransaction() {
          $("#dlgCreateChunkiWalletPassword").iziModal("close");

          EticaContract.prepareTransaction_createchunk($("#CreateChunkwalletPassword").val(), $("#createChunkFromAddress").val(), $("#createChunkDiseaseHash").val(), $("#createChunkTitle").val(), $("#createChunkDescription").val(), function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              ChunkCreate.resetSendForm();

              iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});

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

        $("#btnCreateChunkWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgCreateChunkiWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });
});

// create new chunk
ChunkCreate = new CreateChunk();

