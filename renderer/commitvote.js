// In renderer process (web page).
const {ipcRenderer} = require("electron");

class CommitVote {
  constructor() {}

  renderSendState() {
    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaMainGUI.renderTemplate("commitvote.html", data);
      $(document).trigger("render_commitVote");
    });
  }

  validateSendForm() {
    if (EticaMainGUI.getAppState() == "commitVote") {
      if (!$("#commitVoteFromAddress").val()) {
        EticaMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#commitVoteFromAddress").val())) {
        EticaMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      
      // check Proposal Hash exists:
      if (!JSON.stringify($("#commitVoteProposalHash").val())) {
        EticaMainGUI.showGeneralError("This Proposal Hash is invalid!");
        return false;
      }

      // check title name is in right format:
      if (!JSON.stringify($("#commitVotePrivacy").val())) {
        EticaMainGUI.showGeneralError("This disease name is invalid!");
        return false;
      }

      // check chunk title name doesnt already exists for this disease:
      if (!JSON.stringify($("#commitVotePrivacy").val())) {
        EticaMainGUI.showGeneralError("This chunk Title already exists!");
        return false;
      }

      // check description is in right format:
      if (!JSON.stringify($("#commitVoteChoice").val())) {
        EticaMainGUI.showGeneralError("This description is invalid!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (EticaMainGUI.getAppState() == "commitVote") {
      $("#commitVoteFromAddress").val("");
      $("#commitVotePrivacy").val("");
    }
  }
}

$(document).on("render_commitVote", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#commitVoteFromAddress").on("change", async function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#commitVoteFromAddressName").html(addrName.trim());

    let balance = await EticaContract.balanceEti(this.value);
    $("#commitVoteMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));

  });

  $("#btnCommitVote").off("click").on("click", function () {
    if (VoteCommit.validateSendForm()) {

      EticaContract.getTranasctionFee_commitvote($("#commitVoteFromAddress").val(), $("#commitVoteProposalHash").val(), $("#commitVotePrivacy").val(), $("#commitVoteChoice").val(), function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        $("#dlgCommitVoteWalletPassword").iziModal();
        $("#walletPasswordEti").val("");
        $("#fromEtiAddressInfo").html($("#commitVoteFromAddress").val());
        $("#valueToCommitVoteProposalHash").html($("#commitVoteProposalHash").val());
        $("#valueToCommitVotePrivacy").html($("#commitVotePrivacy").val());
        $("#valueToCommitVoteChoice").html($("#commitVoteChoice").val());
        $("#feeEtiToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCommitVoteWalletPassword").iziModal("open");

        function doSendTransaction() {
          $("#dlgCommitVoteWalletPassword").iziModal("close");

          EticaContract.prepareTransaction_commitvote($("#walletPasswordEti").val(), $("#commitVoteFromAddress").val(), $("#commitVoteProposalHash").val(), $("#commitVotePrivacy").val(), $("#commitVoteChoice").val(), function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              VoteCommit.resetSendForm();

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

        $("#btnCommitVoteWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgCommitVoteWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });
});

// create new proposal
VoteCommit = new CommitVote();

