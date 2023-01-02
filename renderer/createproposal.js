// In renderer process (web page).
const {ipcRenderer} = require("electron");

class CreateProposal {
  constructor() {}

  renderSendState() {
    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaMainGUI.renderTemplate("createproposal.html", data);
      $(document).trigger("render_createProposal");
    });
  }

  validateSendForm() {
    if (EticaMainGUI.getAppState() == "createProposal") {
      if (!$("#createProposalFromAddress").val()) {
        EticaMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#createProposalFromAddress").val())) {
        EticaMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      
      // check disease hash exists:
      if (!JSON.stringify($("#createProposalDiseaseHash").val())) {
        EticaMainGUI.showGeneralError("This disease hash is invalid!");
        return false;
      }

      // check title name is in right format:
      if (!JSON.stringify($("#createProposalTitle").val())) {
        EticaMainGUI.showGeneralError("This disease name is invalid!");
        return false;
      }

      // check chunk title name doesnt already exists for this disease:
      if (!JSON.stringify($("#createProposalTitle").val())) {
        EticaMainGUI.showGeneralError("This chunk Title already exists!");
        return false;
      }

      // check description is in right format:
      if (!JSON.stringify($("#createProposalDescription").val())) {
        EticaMainGUI.showGeneralError("This description is invalid!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (EticaMainGUI.getAppState() == "createProposal") {
      $("#createProposalFromAddress").val("");
      $("#createProposalTitle").val("");
    }
  }
}

$(document).on("render_createProposal", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#createProposalFromAddress").on("change", async function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#createProposalFromAddressName").html(addrName.trim());

    let balance = await EticaContract.balanceEti(this.value);
    $("#createProposalMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));

  });

  $("#btnCreateProposal").off("click").on("click", function () {
    if (ProposalCreate.validateSendForm()) {

      EticaContract.getTranasctionFee_createproposal($("#createProposalFromAddress").val(), $("#createProposalDiseaseHash").val(), $("#createProposalTitle").val(), $("#createProposalDescription").val(), $("#createProposalRawReleaseHash").val(), $("#createProposalFreefield").val(), $("#createProposalChunkId").val(), function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        $("#dlgCreateProposalWalletPassword").iziModal();
        $("#CreateProposalwalletPassword").val("");
        $("#fromEtiAddressInfo").html($("#createProposalFromAddress").val());
        $("#valueToCreateProposalDiseaseHash").html($("#createProposalDiseaseHash").val());
        $("#valueToCreateProposalTitle").html($("#createProposalTitle").val());
        $("#valueToCreateProposalDescription").html($("#createProposalDescription").val());
        $("#valueToCreateProposalChunkId").html($("#createProposalChunkId").val());
        $("#valueToCreateProposalRawReleaseHash").html($("#createProposalRawReleaseHash").val());
        $("#valueToCreateProposalFreefield").html($("#createProposalFreefield").val());
        $("#feeEtiToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCreateProposalWalletPassword").iziModal("open");

        function doSendTransaction() {
          $("#dlgCreateProposalWalletPassword").iziModal("close");

          EticaContract.prepareTransaction_createproposal($("#CreateProposalwalletPassword").val(), $("#createProposalFromAddress").val(), $("#createProposalDiseaseHash").val(), $("#createProposalTitle").val(), $("#createProposalDescription").val(), $("#createProposalRawReleaseHash").val(), $("#createProposalFreefield").val(), $("#createProposalChunkId").val(), function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              ProposalCreate.resetSendForm();

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

        $("#btnCreateProposalWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgCreateProposalWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });
});

// create new proposal
ProposalCreate = new CreateProposal();

