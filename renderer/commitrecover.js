// In renderer process (web page).
const {ipcRenderer} = require("electron");

class CommitRecover {
  constructor() {}

  renderRecoverCommit(commitvote=null) {
    EticaBlockchain.getAccountsData(function (error) {
     // EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaMainGUI.renderTemplate("commitrecover.html", data);
      $(document).trigger("render_commitRecover");
    });

  }

  validateSendForm() {

      if (!$("#commitRecoverFromAddress").val()) {
        EticaMainGUI.showGeneralError("Voter address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#commitRecoverFromAddress").val())) {
        EticaMainGUI.showGeneralError("Voter address must be a valid address!");
        return false;
      }

      // check Proposal Hash exists:
      const bytes32Regex = /^(0x)?[0-9a-fA-F]{64}$/;
      if (JSON.stringify($("#commitRecoverProposalHash").val()) && !bytes32Regex.test($("#commitRecoverProposalHash").val()) && !$("#commitRecoverProposalHash").val().startsWith("0x")) {
        EticaMainGUI.showGeneralError("This Proposal hash is invalid, please enter a bytes32 value");
        return false;
      }

      // check title name is in right format:
      if (!JSON.stringify($("#commitRecoverPrivacy").val())) {
        EticaMainGUI.showGeneralError("This disease name is invalid!");
        return false;
      }

      // check description is in right format:
      if (!JSON.stringify($("#commitRecoverChoice").val())) {
        EticaMainGUI.showGeneralError("This description is invalid!");
        return false;
      }

      return true;

  }


  validateRecoverLostForm() {

    if (!$("#commitRecoverFromAddress").val()) {
      EticaMainGUI.showGeneralError("Voter address must be specified!");
      return false;
    }

    if (!EticaBlockchain.isAddress($("#commitRecoverFromAddress").val())) {
      EticaMainGUI.showGeneralError("Voter address must be a valid address!");
      return false;
    }

    // check Proposal Hash exists:
    const bytes32Regex = /^(0x)?[0-9a-fA-F]{64}$/;
    if (JSON.stringify($("#commitRecoverLostVotehash").val()) && !bytes32Regex.test($("#commitRecoverLostVotehash").val()) && !$("#commitRecoverLostVotehash").val().startsWith("0x")) {
      EticaMainGUI.showGeneralError("The commit hash is invalid, please enter a bytes32 value");
      return false;
    }

    return true;

}


  resetSendForm() {
    if (EticaMainGUI.getAppState() == "commitRecover") {
      $("#commitRecoverFromAddress").val("");
      $("#commitRecoverPrivacy").val("");
    }
  }

  calculateHash(_proposalhash, _choice, _voter, _vary) {

      let _votehash = web3Local.utils.keccak256(web3Local.eth.abi.encodeParameters([ "bytes32", "bool", "address", "string" ], [_proposalhash, _choice, _voter, _vary]));
      return _votehash;
  }

}

$(document).on("render_commitRecover", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#btnCommitRecover").css('display', 'none');
  $("#warningMsgCommitRecoverSetSystem2").css('display', 'none');

  $("#commitRecoverFromAddress").on("change", async function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#commitRecoverFromAddressName").html(addrName.trim());

    let balance = await EticaContract.balanceEti(this.value);
    $("#commitRecoverEtiAvailable").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));
    

  });


  $("#btnCommitRecoverSetSystem1").off("click").on("click", async function () {

    
    $("#btnCommitRecoverLost").css('display', 'none');
    $("#btnCommitRecoverLostExistence").css('display', 'none');
    $("#btnCommitRecoverLostDiv").css('display', 'none');
    $("#commitRecoverLostVotehashDiv").css('display', 'none');
    $("#commitRecoverLostVotehash").val("");

    $("#commitRecoverHash").html("");          
    $("#commitRecoverExistingAmount").html("");
    $("#commitRecoverExistingTimestamp").html("");


    $("#btnCommitRecover").css('display', 'none');
    $("#btnCommitRecoverExistence").css('display', 'inline-flex');
    $("#btnCommitRecoverDiv").css('display', 'block');
    $("#commitRecoverChoiceDiv").css('display', 'block');
    $("#commitRecoverProposalHashDiv").css('display', 'block');
    $("#commitRecoverPrivacyDiv").css('display', 'block');

    $("#btnCommitRecoverSetSystem1").addClass("button6");
    $("#btnCommitRecoverSetSystem2").addClass("button5");
    $("#btnCommitRecoverSetSystem1").removeClass("button5");
    $("#btnCommitRecoverSetSystem2").removeClass("button6");

    $("#warningMsgCommitRecoverSetSystem1").css('display', 'block');
    $("#warningMsgCommitRecoverSetSystem2").css('display', 'none');
    
  });


  $("#btnCommitRecoverSetSystem2").off("click").on("click", async function () {

    $("#btnCommitRecoverLost").css('display', 'none');
    $("#btnCommitRecoverLostExistence").css('display', 'inline-flex');
    $("#btnCommitRecoverLostDiv").css('display', 'block');
    $("#commitRecoverLostVotehashDiv").css('display', 'block');
    $("#commitRecoverProposalHash").val("");
    $("#commitRecoverPrivacy").val("");

    $("#commitRecoverHash").html("");          
    $("#commitRecoverExistingAmount").html("");
    $("#commitRecoverExistingTimestamp").html("");


    $("#btnCommitRecover").css('display', 'none');
    $("#btnCommitRecoverExistence").css('display', 'none');
    $("#btnCommitRecoverDiv").css('display', 'none');
    $("#commitRecoverChoiceDiv").css('display', 'none');
    $("#commitRecoverProposalHashDiv").css('display', 'none');
    $("#commitRecoverPrivacyDiv").css('display', 'none');

    $("#btnCommitRecoverSetSystem1").addClass("button5");
    $("#btnCommitRecoverSetSystem2").addClass("button6");
    $("#btnCommitRecoverSetSystem1").removeClass("button6");
    $("#btnCommitRecoverSetSystem2").removeClass("button5");

    $("#warningMsgCommitRecoverSetSystem1").css('display', 'none');
    $("#warningMsgCommitRecoverSetSystem2").css('display', 'block');

  });




  $("#btnCommitRecover").off("click").on("click", function () {
    if (RecoverCommit.validateSendForm()) {

      let vote_checked_choice = null;
      let vote_checked_choice_text = null;
      if (document.getElementById('commitRecoverApprovalChoice').checked && !document.getElementById('commitRecoverDisapprovalChoice').checked) {
        vote_checked_choice = true;
        vote_checked_choice_text = 'Approve';
      }
      if (!document.getElementById('commitRecoverApprovalChoice').checked && document.getElementById('commitRecoverDisapprovalChoice').checked) {
        vote_checked_choice = false;
        vote_checked_choice_text = 'Disapprove';
      }

      // if vote choice is not true or false it means there was an issue getting the vote choice from interface, we abort:
      if(vote_checked_choice != true && vote_checked_choice != false){
        EticaMainGUI.showGeneralError('Please select a Vote choice to Approve or Disapprove the proposal');
        return;
      }

      var fromaddress = $("#commitRecoverFromAddress").val();

      let commitvotehash = RecoverCommit.calculateHash($("#commitRecoverProposalHash").val(), vote_checked_choice, fromaddress, $("#commitRecoverPrivacy").val());
      
      EticaContract.getTranasctionFee_recovercommit(fromaddress, $("#commitRecoverProposalHash").val(), vote_checked_choice, $("#commitRecoverPrivacy").val(), function (error) {
        EticaMainGUI.showGeneralError(error);
      }, async function (data) {


        let isunlocked = await EticaBlockchain.isUnlocked(fromaddress);

        $("#CommitRecoverwalletPasswordDiv").show();
        $(".sendTXPass").show();
        $(".sendTXdivider").show();

        if(isunlocked == 'unlocked'){
          $("#dlgCommitRecoverWalletPassword").iziModal({width: "70%"});
        $("#CommitRecoverwalletPassword").val("");
        $("#CommitRecoverwalletPasswordDiv").hide();
        $(".sendTXPass").hide();
        $(".sendTXdivider").hide();
        $("#fromCommitRecoverAddressInfo").html(fromaddress);
        $("#valueToCommitRecoverProposalHash").html($("#commitRecoverProposalHash").val());
        $("#valueToCommitRecoverPrivacy").html($("#commitRecoverPrivacy").val());
        $("#valueToCommitRecoverChoice").html(vote_checked_choice_text);
        $("#valueToCommitRecoverAmount").html($("#commitRecoverAmount").val());
        $("#valueToCommitRecoverHash").html(commitvotehash);
        $("#feeCommitRecoverToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCommitRecoverWalletPassword").iziModal("open");
        }
        else{
          // Ask password
          $("#dlgCommitRecoverWalletPassword").iziModal({width: "70%"});
        $("#CommitRecoverwalletPassword").val("");
        $("#fromCommitRecoverAddressInfo").html(fromaddress);
        $("#valueToCommitRecoverProposalHash").html($("#commitRecoverProposalHash").val());
        $("#valueToCommitRecoverPrivacy").html($("#commitRecoverPrivacy").val());
        $("#valueToCommitRecoverChoice").html(vote_checked_choice_text);
        $("#valueToCommitRecoverAmount").html($("#commitRecoverAmount").val());
        $("#valueToCommitRecoverHash").html(commitvotehash);
        $("#feeCommitRecoverToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCommitRecoverWalletPassword").iziModal("open");
        }


        // save votes parameters:
        ipcRenderer.send("storeHashinput", {
          commithash: commitvotehash,
          voter: fromaddress,
          proposalhash: $("#commitRecoverProposalHash").val(),
          choice: vote_checked_choice,
          vary: $("#commitRecoverPrivacy").val()
        });

        function doSendTransaction() {
          $("#dlgCommitRecoverWalletPassword").iziModal("close");

          let _password = null;
          if(isunlocked != 'unlocked') {
            _password = $("#CommitRecoverwalletPassword").val();
          }

          EticaContract.prepareTransaction_recovercommit(_password, fromaddress, $("#commitRecoverProposalHash").val(), vote_checked_choice, $("#commitRecoverPrivacy").val(), function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              RecoverCommit.resetSendForm();

              iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});

              // unlock accounts
              let _wallet = ipcRenderer.sendSync("getRunningWallet");

                if(_wallet.autounlock && isunlocked != 'unlocked'){
                            EticaBlockchain.unlockAccounts(_password, _wallet.unlocktime);
                  }

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

        $("#btnCommitRecoverWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgCommitRecoverWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });


  $("#btnCommitRecoverExistence").off("click").on("click", async function () {

    $("#btnCommitRecoverLost").css('display', 'none');
    $("#btnCommitRecoverLostExistence").css('display', 'none');
    $("#btnCommitRecoverLostDiv").css('display', 'none');

    if (RecoverCommit.validateSendForm()) {
      let vote_checked_choice = null;
      let vote_checked_choice_text = null;
      if (document.getElementById('commitRecoverApprovalChoice').checked && !document.getElementById('commitRecoverDisapprovalChoice').checked) {
        vote_checked_choice = true;
        vote_checked_choice_text = 'Approve';
      }
      if (!document.getElementById('commitRecoverApprovalChoice').checked && document.getElementById('commitRecoverDisapprovalChoice').checked) {
        vote_checked_choice = false;
        vote_checked_choice_text = 'Disapprove';
      }

      // if vote choice is not true or false it means there was an issue getting the vote choice from interface, we abort:
      if(vote_checked_choice != true && vote_checked_choice != false){
        EticaMainGUI.showGeneralError('Please select a Vote choice to Approve or Disapprove the proposal');
        return;
      }

      var fromaddress = $("#commitRecoverFromAddress").val();

      let commitvotehash = RecoverCommit.calculateHash($("#commitRecoverProposalHash").val(), vote_checked_choice, fromaddress, $("#commitRecoverPrivacy").val());
      const _commit = await EticaContract.getcommit(fromaddress, commitvotehash);
        
        if(_commit && _commit.timestamp > 0){
          $("#commitRecoverHash").html(commitvotehash);          
          $("#commitRecoverExistingAmount").html(parseFloat(web3Local.utils.fromWei(_commit.amount, "ether")) + '<span style="font-family: cinzelmedium;">ETI</span>');
          $("#commitRecoverExistingTimestamp").html(_commit.timestamp);
          $("#commitRecoverExistingMessage").html("");
          $("#btnCommitRecover").css('display', 'inline-flex');
        }
        else {
          $("#commitRecoverHash").html(commitvotehash);
          $("#commitRecoverExistingAmount").html("0");
          $("#commitRecoverExistingTimestamp").html("0");
          $("#commitRecoverExistingMessage").html("No commit active on this hash");
          $("#btnCommitRecover").css('display', 'none');
        }


    }
  });


  $("#btnCommitRecoverLostExistence").off("click").on("click", async function () {

    $("#btnCommitRecover").css('display', 'none');
    $("#btnCommitRecoverExistence").css('display', 'none');
    $("#btnCommitRecoverDiv").css('display', 'none');


    if (RecoverCommit.validateRecoverLostForm()) {

      var fromaddress = $("#commitRecoverFromAddress").val();
      var commitvotehash = $("#commitRecoverLostVotehash").val();


      const _commit = await EticaContract.getcommit(fromaddress, commitvotehash);
        
        if(_commit && _commit.timestamp > 0){
          $("#commitRecoverHash").html(commitvotehash);          
          $("#commitRecoverExistingAmount").html(parseFloat(web3Local.utils.fromWei(_commit.amount, "ether")) + '&nbsp;<span style="font-family: cinzelmedium;">ETI</span>');
          $("#commitRecoverExistingTimestamp").html(_commit.timestamp);
          $("#commitRecoverExistingMessage").html("");
          $("#btnCommitRecoverLost").css('display', 'inline-flex');
        }
        else {
          $("#commitRecoverHash").html(commitvotehash);
          $("#commitRecoverExistingAmount").html("0");
          $("#commitRecoverExistingTimestamp").html("0");
          $("#commitRecoverExistingMessage").html("No commit active on this hash");
          $("#btnCommitRecoverLost").css('display', 'none');
        }

    }

  });

  $("#btnCommitRecoverLost").off("click").on("click", function () {
    if (RecoverCommit.validateRecoverLostForm()) {

      var fromaddress = $("#commitRecoverFromAddress").val();

      var commitvotehash = $("#commitRecoverLostVotehash").val();
      
      EticaContract.getTranasctionFee_recoverlostcommit(fromaddress, commitvotehash, function (error) {
        EticaMainGUI.showGeneralError(error);
      }, async function (data) {


        let isunlocked = await EticaBlockchain.isUnlocked(fromaddress);

        $("#CommitRecoverLostwalletPasswordDiv").show();
        $(".sendTXPass").show();
        $(".sendTXdivider").show();

        if(isunlocked == 'unlocked'){
          $("#dlgCommitRecoverLostWalletPassword").iziModal({width: "70%"});
        $("#CommitRecoverLostwalletPassword").val("");
        $("#CommitRecoverLostwalletPasswordDiv").hide();
        $(".sendTXPass").hide();
        $(".sendTXdivider").hide();
        $("#fromCommitRecoverLostAddressInfo").html(fromaddress);
        $("#valueToCommitRecoverLostAmount").html($("#commitRecoverAmount").val());
        $("#valueToCommitRecoverLostHash").html(commitvotehash);
        $("#feeCommitRecoverLostToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCommitRecoverLostWalletPassword").iziModal("open");
        }
        else{
          // Ask password
          $("#dlgCommitRecoverLostWalletPassword").iziModal({width: "70%"});
        $("#CommitRecoverLostwalletPassword").val("");
        $("#fromCommitRecoverLostAddressInfo").html(fromaddress);
        $("#valueToCommitRecoverLostAmount").html($("#commitRecoverAmount").val());
        $("#valueToCommitRecoverLostHash").html(commitvotehash);
        $("#feeCommitRecoverLostToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgCommitRecoverLostWalletPassword").iziModal("open");
        }


        function doSendTransaction() {
          $("#dlgCommitRecoverLostWalletPassword").iziModal("close");

          let _password = null;
          if(isunlocked != 'unlocked') {
            _password = $("#CommitRecoverLostwalletPassword").val();
          }

          EticaContract.prepareTransaction_recoverlostcommit(_password, fromaddress, commitvotehash, function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              RecoverCommit.resetSendForm();

              iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});

              // unlock accounts
              let _wallet = ipcRenderer.sendSync("getRunningWallet");

                if(_wallet.autounlock && isunlocked != 'unlocked'){
                            EticaBlockchain.unlockAccounts(_password, _wallet.unlocktime);
                  }            
            
            });
          });
        }

        $("#btnCommitRecoverLostWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgCommitRecoverLostWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });



});


RecoverCommit = new CommitRecover();

