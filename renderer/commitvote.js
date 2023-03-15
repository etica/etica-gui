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

      if (Number($("#commitVoteAmount").val()) <= 0) {
        EticaMainGUI.showGeneralError("Commit ammount must be greater than zero!");
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
      $("#commitVoteAmount").val(0);
    }
  }

  calculateHash(_proposalhash, _choice, _voter, _vary) {

      let _votehash = web3Local.utils.keccak256(web3Local.eth.abi.encodeParameters([ "bytes32", "bool", "address", "string" ], [_proposalhash, _choice, _voter, _vary]));
      return _votehash;
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
    $("#commitVoteEtiAvailable").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));
    let bosoms = await EticaContract.balanceBosoms(this.value);
    $("#commitVoteMaxAmount").html(parseFloat(web3Local.utils.fromWei(bosoms, "ether")));

  });

  $("#btnCommitVoteAll").off("click").on("click", function () {
    $("#commitVoteAmount").focus();
    $("#commitVoteAmount").val($("#commitVoteMaxAmount").html());
  });

  $("#btnCommitVote").off("click").on("click", function () {
    if (VoteCommit.validateSendForm()) {

      let vote_checked_choice = null;
      let vote_checked_choice_text = null;
      console.log("document.getElementById('commitVoteApprovalChoice').checked", document.getElementById('commitVoteApprovalChoice').checked);
      console.log("document.getElementById('commitVoteDisapprovalChoice').checked", document.getElementById('commitVoteDisapprovalChoice').checked);
      console.log("document.getElementById('commitVoteApprovalChoice').value", document.getElementById('commitVoteApprovalChoice').value);
      console.log("document.getElementById('commitVoteDisapprovalChoice').value", document.getElementById('commitVoteDisapprovalChoice').value);
      if (document.getElementById('commitVoteApprovalChoice').checked && !document.getElementById('commitVoteDisapprovalChoice').checked) {
        vote_checked_choice = true;
        vote_checked_choice_text = 'Approve';
      }
      if (!document.getElementById('commitVoteApprovalChoice').checked && document.getElementById('commitVoteDisapprovalChoice').checked) {
        vote_checked_choice = false;
        vote_checked_choice_text = 'Disapprove';
      }

      // if vote choice is not true or false it means there was an issue getting the vote choice from interface, we abort:
      if(vote_checked_choice != true && vote_checked_choice != false){
        EticaMainGUI.showGeneralError('Please select a Vote choice to Approve or Disapprove the proposal');
        return;
      }

      let commitvotehash = VoteCommit.calculateHash($("#commitVoteProposalHash").val(), vote_checked_choice, $("#commitVoteFromAddress").val(), $("#commitVotePrivacy").val());
      console.log('commitvotehash returned value is: ', commitvotehash);
      console.log('$("#commitVoteAmount").val() is: ', $("#commitVoteAmount").val());
      
      EticaContract.getTranasctionFee_commitvote($("#commitVoteFromAddress").val(), commitvotehash, $("#commitVoteAmount").val(), function (error) {
        EticaMainGUI.showGeneralError(error);
      }, async function (data) {


        let isunlocked = await EticaBlockchain.isUnlocked($("#sendEtiFromAddress").val());

        $("#CommitVotewalletPassword").show();
        $(".sendTXPass").show();
        $(".sendTXdivider").show();

        if(isunlocked == 'unlocked'){
          $("#dlgCommitVoteWalletPassword").iziModal({width: "70%"});
        $("#CommitVotewalletPassword").val("");
        $("#CommitVotewalletPassword").hide();
        $(".sendTXPass").hide();
        $(".sendTXdivider").hide();
        $("#fromCommitVoteAddressInfo").html($("#commitVoteFromAddress").val());
        $("#valueToCommitVoteProposalHash").html($("#commitVoteProposalHash").val());
        $("#valueToCommitVotePrivacy").html($("#commitVotePrivacy").val());
        $("#valueToCommitVoteChoice").html(vote_checked_choice_text);
        $("#valueToCommitVoteAmount").html($("#commitVoteAmount").val());
        $("#valueToCommitVoteHash").html(commitvotehash);
        $("#feeCommitVoteToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCommitVoteWalletPassword").iziModal("open");
        }
        else{
          // Ask password
          $("#dlgCommitVoteWalletPassword").iziModal({width: "70%"});
        $("#CommitVotewalletPassword").val("");
        $("#fromCommitVoteAddressInfo").html($("#commitVoteFromAddress").val());
        $("#valueToCommitVoteProposalHash").html($("#commitVoteProposalHash").val());
        $("#valueToCommitVotePrivacy").html($("#commitVotePrivacy").val());
        $("#valueToCommitVoteChoice").html(vote_checked_choice_text);
        $("#valueToCommitVoteAmount").html($("#commitVoteAmount").val());
        $("#valueToCommitVoteHash").html(commitvotehash);
        $("#feeCommitVoteToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCommitVoteWalletPassword").iziModal("open");
        }


        // save votes parameters:
        ipcRenderer.send("storeHashinput", {
          commithash: commitvotehash,
          voter: $("#commitVoteFromAddress").val(),
          proposalhash: $("#commitVoteProposalHash").val(),
          choice: vote_checked_choice,
          vary: $("#commitVotePrivacy").val()
        });

        function doSendTransaction() {
          $("#dlgCommitVoteWalletPassword").iziModal("close");

          let _password = null;
          if(isunlocked != 'unlocked') {
            _password = $("#CommitVotewalletPassword").val();
          }

          EticaContract.prepareTransaction_commitvote(_password, $("#commitVoteFromAddress").val(), commitvotehash, $("#commitVoteAmount").val(), function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              VoteCommit.resetSendForm();

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

