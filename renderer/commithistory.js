const {ipcRenderer} = require("electron");

class CommitHistory {
  constructor() {}

  setAddressName(address, name) {
    var addressBook = EticaDatabase.getAddresses();

    // set the wallet name from the dialog box
    addressBook.names[address.toUpperCase()] = name;
    EticaDatabase.setAddresses(addressBook);
  }

  getAddressName(address) {
    var addressBook = EticaDatabase.getAddresses();
    // set the wallet name from the dialog box
    return addressBook.names[address.toUpperCase()] || "";
  }

  getAddressList() {
    var addressBook = EticaDatabase.getAddresses();
    return addressBook.names;
  }

  deleteAddress(address) {
    var addressBook = EticaDatabase.getAddresses();
    delete addressBook.names[address];
    EticaDatabase.setAddresses(addressBook);
  }



  calculateHash(_proposalhash, _choice, _voter, _vary) {

      let _votehash = web3Local.utils.keccak256(web3Local.eth.abi.encodeParameters([ "bytes32", "bool", "address", "string" ], [_proposalhash, _choice, _voter, _vary]));
      return _votehash;
  }
  
  enableButtonTooltips() {}

  renderCommitHistory() {

    var renderData = {};
    renderData.commitData = ipcRenderer.sendSync("getCommits");

    renderData.commitData.forEach(function (element) {
      if(element['valueeti']){
        element['valueeti'] = web3Local.utils.fromWei(element['valueeti'], "ether");
      }
      if(element['rewardamount']){
        element['rewardamount'] = web3Local.utils.fromWei(element['rewardamount'], "ether");
      }
      if(element['slashamount']){
        element['slashamount'] = web3Local.utils.fromWei(element['slashamount'], "ether");
      }
      if(element['slashduration']){
        element['slashduration'] = moment.duration(element['slashduration'], 'seconds').humanize();
      }
      if(element['fee']){
        element['fee'] = web3Local.utils.fromWei(element['fee'], "ether");
      }
    });

    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      renderData.sumBalanceEti = data.sumBalanceEti;
      renderData.sumBalance = data.sumBalance;
      data.commitData = renderData.commitData;
      
      EticaMainGUI.renderTemplate("commithistory.html", data);
      $(document).trigger("render_commithistory");
      EticaCommitHistory.enableButtonTooltips();
    
  });
  }


  resetRevealForm() {
    if (EticaMainGUI.getAppState() == "commitHistory") {
      $("#dlgRevealCommitWalletPassword").iziModal();
      $("#RevealCommitwalletPassword").val("");
      $("#fromRevealAddressInfo").val();
      $("#valueOfRevealCommitProposalHash").val();
      $("#valueOfRevealCommitPrivacy").val();
      $("#valueOfRevealCommitChoice").val();
      $("#valueOfRevealCommitAmount").val();
      $("#valueOfRevealCommitHash").val();
      $("#feeRevealCommitToPayInfo").val();
    }
  }

  resetClaimForm() {
    if (EticaMainGUI.getAppState() == "commitHistory") {
      $("#dlgClaimCommitWalletPassword").iziModal();
      $("#ClaimCommitwalletPassword").val("");
      $("#fromClaimAddressInfo").val();
      $("#valueOfClaimCommitProposalHash").val();
      $("#feeClaimCommitToPayInfo").val();
    }
  }

}

// the event to tell us that the wallets are rendered
$(document).on("render_commithistory", function () {
  if ($("#addressTable").length > 0) {
    new Tablesort(document.getElementById("addressTable"));
    $("#addressTable").floatThead();
  }

  $("#btnNewAddress2").off("click").on("click", function () {
    $("#dlgCreateAddressAndName").iziModal();
    $("#addressName").val("");
    $("#addressHash").val("");
    $("#dlgCreateAddressAndName").iziModal("open");

    function doCreateNewWallet() {
      $("#dlgCreateAddressAndName").iziModal("close");

      if (!EticaBlockchain.isAddress($("#addressHash").val())) {
        EticaMainGUI.showGeneralError("Address must be a valid address!");
      } else {
        EticaCommitHistory.setAddressName($("#addressHash").val(), $("#addressName").val());
        EticaCommitHistory.renderCommitHistory();

        iziToast.success({title: "Created", message: "New address was successfully created", position: "topRight", timeout: 5000});
      }
    }

    $("#btnCreateAddressConfirm").off("click").on("click", function () {
      doCreateNewWallet();
    });

    $("#dlgCreateAddressAndName").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doCreateNewWallet();
      }
    });
  });

  $(".btnAddCommitInputs").off("click").on("click", function () {
    var commitvotehash = $(this).attr("data-votehash");
    var commitvoter = $(this).attr("data-voter");

    $("#dlgAddCommitInputs").iziModal();
    $("#CommitVoter").val(commitvoter);
    $("#CommitVoteHash").val(commitvotehash);

    // reset input fields:
    $("#inputProposalHash").val("");
    $("#inputPrivacy").val("");
    document.getElementById('inputVoteApprovalChoice').checked = false;
    document.getElementById('inputVoteDisapprovalChoice').checked = false;

    $("#dlgAddCommitInputs").iziModal("open");

    async function doAddParameterstoCommit() {
      //EticaCommitHistory.setAddressName(walletAddress, $("#inputAddressName").val());

      let commitproposalhash = $("#inputProposalHash").val();
      let commitprivacyphrase = $("#inputPrivacy").val();

    // load proposal info:
      let _proposal = await EticaContract.proposals(commitproposalhash);
    // check existence of proposal:
    if(_proposal == null || _proposal.length === 0 || (_proposal[1] != commitproposalhash)){
      EticaMainGUI.showGeneralError('Wrong Proposal hash. There is no Proposal with this hash on the blockchain');
      return;
    }
   // load proposal info done succesfully
      
      let vote_checked_choice = null;
      let vote_checked_choice_text = null;
      if (document.getElementById('inputVoteApprovalChoice').checked && !document.getElementById('inputVoteDisapprovalChoice').checked) {
        vote_checked_choice = true;
        vote_checked_choice_text = 'Approve';
      }
      if (!document.getElementById('inputVoteApprovalChoice').checked && document.getElementById('inputVoteDisapprovalChoice').checked) {
        vote_checked_choice = false;
        vote_checked_choice_text = 'Disapprove';
      }

      // if vote choice is not true or false it means there was an issue getting the vote choice from interface, we abort:
      if(vote_checked_choice != true && vote_checked_choice != false){
        EticaMainGUI.showGeneralError('Please select a Vote choice to Approve or Disapprove the proposal');
        return;
      }

      

      let calculatedhash = EticaCommitHistory.calculateHash(commitproposalhash, vote_checked_choice, commitvoter, commitprivacyphrase);

       if(calculatedhash !=  commitvotehash){
        EticaMainGUI.showGeneralError('Wrong parameters. The hash of these parameters do not match with the commit hash.');
        return;
      }

       if(calculatedhash == commitvotehash){

        let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
        let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
        let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
        let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);

        let _proposaldata = await EticaContract.propsdatas(commitproposalhash);
        _hashproposaltitle = _proposal[6];
        let _propend = _proposaldata[1]; // endtime
        let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
        let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
        _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
        
        let _period = await EticaContract.periods(_proposal[3]);
        let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);   
        let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");


        var _UpdatedCommit = {
        votehash: commitvotehash,
        voter: commitvoter,
        choice: vote_checked_choice,
        vary: commitprivacyphrase,
        proposalhash: commitproposalhash,
        proposaltitle: _hashproposaltitle,
        proposalend: _hashproposalend,
        proposaldeadline: _hashproposaldeadline,
        timestampclaimable: _timestamp_claimable,
        status: 1
        };

        ipcRenderer.send("updateCommit", _UpdatedCommit);

       }
      
      $("#dlgAddCommitInputs").iziModal("close");
      EticaCommitHistory.renderCommitHistory();
    }

    $("#btnAddCommitInputsConfirm").off("click").on("click", function () {
      doAddParameterstoCommit();
    });

    $("#dlgAddCommitInputs").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doAddParameterstoCommit();
      }
    });
  });




  $(".btnRevealCommit").off("click").on("click", function () {
    var commitvotehash = $(this).attr("data-votehash");
    var commitvoter = $(this).attr("data-voter");

    let _commit = ipcRenderer.sendSync("getCommit", {votehash: commitvotehash, voter:commitvoter});

           
                  if(!_commit || _commit.votehash != commitvotehash){
                    EticaMainGUI.showGeneralError('No vote parameters saved for this vote.');
                    return;
                  }

                  EticaContract.getTranasctionFee_revealvote(_commit.voter, _commit.proposalhash, _commit.choice, _commit.vary, function (error) {
                    EticaMainGUI.showGeneralError(error);
                  }, async function (data) {



                    let isunlocked = await EticaBlockchain.isUnlocked($("#sendEtiFromAddress").val());

                    $("#RevealCommitwalletPassword").show();
                    $(".sendTXPass").show();
                    $(".sendTXdivider").show();
            
                    if(isunlocked == 'unlocked'){
                      $("#dlgRevealCommitWalletPassword").iziModal({width: "70%"});
                      $("#RevealCommitwalletPassword").val("");
                      $("#RevealCommitwalletPassword").hide();
                      $("#fromRevealAddressInfo").html(_commit.voter);
                      $("#valueOfRevealCommitProposalHash").html(_commit.proposalhash);
                      $("#valueOfRevealCommitPrivacy").html(_commit.vary);
                      $("#valueOfRevealCommitChoice").html(_commit.choice);
                      $("#valueOfRevealCommitAmount").html(web3Local.utils.fromWei(_commit.valueeti, "ether"));
                      $("#valueOfRevealCommitHash").html(commitvotehash);
                      $("#feeRevealCommitToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                      $(".sendTXPass").hide();
                      $(".sendTXdivider").hide();
                      $("#dlgRevealCommitWalletPassword").iziModal("open");
                    }
                    else{
                      // Ask password
                      $("#dlgRevealCommitWalletPassword").iziModal({width: "70%"});
                    $("#RevealCommitwalletPassword").val("");
                    $("#fromRevealAddressInfo").html(_commit.voter);
                    $("#valueOfRevealCommitProposalHash").html(_commit.proposalhash);
                    $("#valueOfRevealCommitPrivacy").html(_commit.vary);
                    $("#valueOfRevealCommitChoice").html(_commit.choice);
                    $("#valueOfRevealCommitAmount").html(web3Local.utils.fromWei(_commit.valueeti, "ether"));
                    $("#valueOfRevealCommitHash").html(commitvotehash);
                    $("#feeRevealCommitToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                    $("#dlgRevealCommitWalletPassword").iziModal("open");
                    }

            
                    function doSendTransaction() {
                      $("#dlgRevealCommitWalletPassword").iziModal("close");

                      let _password = null;
                      if(isunlocked != 'unlocked') {
                         _password = $("#RevealCommitwalletPassword").val();
                      }


                      EticaContract.prepareTransaction_revealvote(_password, _commit.voter, _commit.proposalhash, _commit.choice, _commit.vary, function (error) {
                        EticaMainGUI.showGeneralError(error);
                      }, function (data) {
                        EticaBlockchain.sendTransaction(data.raw, function (error) {
                          EticaMainGUI.showGeneralError(error);
                        }, function (data) {
                          EticaCommitHistory.resetRevealForm();
            
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

                            EticaCommitHistory.renderCommitHistory();
            
                          }); */            
                        
                        });
                      });
                    }
            
                    $("#btnRevealCommitWalletPasswordConfirm").off("click").on("click", function () {
                      doSendTransaction();
                    });
            
                    $("#dlgRevealCommitWalletPassword").off("keypress").on("keypress", function (e) {
                      if (e.which == 13) {
                        doSendTransaction();
                      }
                    });
                  });

  });




  $(".btnClaimCommit").off("click").on("click", function () {
    var proposalhash = $(this).attr("data-proposalhash");
    var commitvoter = $(this).attr("data-voter");

                  EticaContract.getTranasctionFee_claimproposal(commitvoter, proposalhash, function (error) {
                    EticaMainGUI.showGeneralError(error);
                  }, async function (data) {


                    let isunlocked = await EticaBlockchain.isUnlocked($("#sendEtiFromAddress").val());

                    $("#ClaimCommitwalletPassword").show();
                    $(".sendTXPass").show();
                    $(".sendTXdivider").show();
            
                    if(isunlocked == 'unlocked'){
                      $("#dlgClaimCommitWalletPassword").iziModal({width: "70%"});
                    $("#ClaimCommitwalletPassword").val("");
                    $("#ClaimCommitwalletPassword").hide();
                    $(".sendTXPass").hide();
                    $(".sendTXdivider").hide();
                    $("#fromClaimAddressInfo").html(commitvoter);
                    $("#valueOfClaimCommitProposalHash").html(proposalhash);
                    $("#feeClaimCommitToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                    $("#dlgClaimCommitWalletPassword").iziModal("open");
                    }
                    else{
                      // Ask password
                      $("#dlgClaimCommitWalletPassword").iziModal({width: "70%"});
                    $("#ClaimCommitwalletPassword").val("");
                    $("#fromClaimAddressInfo").html(commitvoter);
                    $("#valueOfClaimCommitProposalHash").html(proposalhash);
                    $("#feeClaimCommitToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                    $("#dlgClaimCommitWalletPassword").iziModal("open");
                    }

            
                    function doSendTransaction() {
                      $("#dlgClaimCommitWalletPassword").iziModal("close");

                      let _password = null;
                      if(isunlocked != 'unlocked') {
                         _password = $("#ClaimCommitwalletPassword").val();
                      }
          
                      EticaContract.prepareTransaction_claimproposal(_password, commitvoter, proposalhash, function (error) {
                        EticaMainGUI.showGeneralError(error);
                      }, function (data) {
                        EticaBlockchain.sendTransaction(data.raw, function (error) {
                          EticaMainGUI.showGeneralError(error);
                        }, function (data) {
                          EticaCommitHistory.resetClaimForm();
            
                          iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});              
                        
                          // unlock accounts
                          let _wallet = ipcRenderer.sendSync("getRunningWallet");

                          if(_wallet.autounlock){
                            EticaBlockchain.unlockAccounts(_password, _wallet.unlocktime);
                          }
                          
                        });
                      });
                    }
            
                    $("#btnClaimCommitWalletPasswordConfirm").off("click").on("click", function () {
                      doSendTransaction();
                    });
            
                    $("#dlgClaimCommitWalletPassword").off("keypress").on("keypress", function (e) {
                      if (e.which == 13) {
                        doSendTransaction();
                      }
                    });
                  });

  });



  $(".textAddress").off("click").on("click", function () {
    EticaMainGUI.copyToClipboard($(this).html());

    iziToast.success({title: "Copied", message: "Address was copied to clipboard", position: "topRight", timeout: 2000});
  });
});

EticaCommitHistory = new CommitHistory();
