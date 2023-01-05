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
    console.log(' calculating _votehash');
    console.log(' calculating _votehash _proposalhash', _proposalhash);
    console.log(' calculating _votehash _choice', _choice);
    console.log(' calculating _votehash _voter', _voter);
    console.log(' calculating _votehash _vary', _vary);

      let _votehash = web3Local.utils.keccak256(web3Local.eth.abi.encodeParameters([ "bytes32", "bool", "address", "string" ], [_proposalhash, _choice, _voter, _vary]));
      console.log('_votehash is', _votehash);
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
    });

    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      renderData.sumBalanceEti = data.sumBalanceEti;
      renderData.sumBalance = data.sumBalance;
      data.commitData = renderData.commitData;
      console.log('data from renderCommitHistory is', data);
      
      EticaMainGUI.renderTemplate("commithistory.html", data);
      $(document).trigger("render_commithistory");
      EticaCommitHistory.enableButtonTooltips();
    
  });
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
      console.log("document.getElementById('inputVoteApprovalChoice').checked", document.getElementById('inputVoteApprovalChoice').checked);
      console.log("document.getElementById('inputVoteDisapprovalChoice').checked", document.getElementById('inputVoteDisapprovalChoice').checked);
      console.log("document.getElementById('inputVoteApprovalChoice').value", document.getElementById('inputVoteApprovalChoice').value);
      console.log("document.getElementById('inputVoteDisapprovalChoice').value", document.getElementById('inputVoteDisapprovalChoice').value);
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
       console.log('calculatedhash is:', calculatedhash);
       console.log('right calculatedhash is:', calculatedhash ==  commitvotehash);

       if(calculatedhash !=  commitvotehash){
        EticaMainGUI.showGeneralError('Wrong parameters. The hash of these parameters do not match with the commit hash.');
        return;
      }

       if(calculatedhash == commitvotehash){

        let _proposaldata = await EticaContract.propsdatas(commitproposalhash);
        let revealingduration = await EticaContract.DEFAULT_REVEALING_TIME();
        console.log('revealing duration is', revealingduration);
        _hashproposaltitle = _proposal[6];
        let _propend = _proposaldata[1]; // endtime
        let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
        let _deadline = moment.unix(parseInt(_propend)).add(revealingduration,'seconds');
        _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");

        var _UpdatedCommit = {
        votehash: commitvotehash,
        voter: commitvoter,
        choice: vote_checked_choice,
        vary: commitprivacyphrase,
        proposalhash: commitproposalhash,
        proposaltitle: _hashproposaltitle,
        proposalend: _hashproposalend,
        proposaldeadline: _hashproposaldeadline
        };

        console.log('line 299 before storing _NewCommit', _UpdatedCommit);
        ipcRenderer.send("updateCommit", _UpdatedCommit);
        console.log('line 301 after storing _NewCommit', _UpdatedCommit);

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

  $(".btnDeleteAddress").off("click").on("click", function () {
    var deleteAddress = $(this).attr("data-address");

    $("#dlgDeleteAddressConfirm").iziModal();
    $("#dlgDeleteAddressConfirm").iziModal("open");

    $("#btnDeleteAddressCancel").off("click").on("click", function () {
      $("#dlgDeleteAddressConfirm").iziModal("close");
    });

    $("#btnDeleteAddressConfirm").off("click").on("click", function () {
      $("#dlgDeleteAddressConfirm").iziModal("close");
      EticaCommitHistory.deleteAddress(deleteAddress);
      EticaCommitHistory.renderCommitHistory();
    });
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

  $(".textAddress").off("click").on("click", function () {
    EticaMainGUI.copyToClipboard($(this).html());

    iziToast.success({title: "Copied", message: "Address was copied to clipboard", position: "topRight", timeout: 2000});
  });
});

EticaCommitHistory = new CommitHistory();
