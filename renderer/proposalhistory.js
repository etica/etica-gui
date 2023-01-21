const {ipcRenderer} = require("electron");

class ProposalHistory {
  constructor() {}
  
  enableButtonTooltips() {}

  renderProposalHistory() {

    var renderData = {};
    renderData.proposalData = ipcRenderer.sendSync("getProposals");

    renderData.proposalData.forEach(function (element) {
      if(element['fees']){
        element['fees'] = web3Local.utils.fromWei(element['fees'], "ether");
      }
      if(element['rewardamount']){
        element['rewardamount'] = web3Local.utils.fromWei(element['rewardamount'], "ether");
      }
      if(element['slashamount']){
        element['slashamount'] = web3Local.utils.fromWei(element['slashamount'], "ether");
      }
      if(element['fee']){
        element['fee'] = web3Local.utils.fromWei(element['fee'], "ether");
      }
      if(element['approvalthreshold']){
        console.log("element['approvalthreshold] before / 100 is", element['approvalthreshold']);
        element['approvalthreshold'] = element['approvalthreshold'] / 100;
        console.log("element['approvalthreshold] after / 100 is", element['approvalthreshold']);
      }
    });

    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      renderData.sumBalanceEti = data.sumBalanceEti;
      renderData.sumBalance = data.sumBalance;
      data.proposalData = renderData.proposalData;
      console.log('data from renderProposalHistory is', data);
      
      EticaMainGUI.renderTemplate("proposalhistory.html", data);
      $(document).trigger("render_commithistory");
      EticaProposalHistory.enableButtonTooltips();
    
  });
  }

  resetClaimForm() {
    if (EticaMainGUI.getAppState() == "proposalHistory") {
      $("#dlgClaimProposalWalletPassword").iziModal();
      $("#ClaimProposalwalletPassword").val("");
      $("#fromClaimProposalAddressInfo").val();
      $("#valueOfClaimProposalProposalHash").val();
      $("#feeClaimProposalToPayInfo").val();
    }
  }

}

// the event to tell us that the wallets are rendered
$(document).on("render_commithistory", function () {
  if ($("#addressTable").length > 0) {
    new Tablesort(document.getElementById("addressTable"));
    $("#addressTable").floatThead();
  }


  $(".btnClaimProposal").off("click").on("click", function () {
    var proposalhash = $(this).attr("data-proposalhash");
    var proposer = $(this).attr("data-proposer");

                  EticaContract.getTranasctionFee_claimproposal(proposer, proposalhash, function (error) {
                    EticaMainGUI.showGeneralError(error);
                  }, function (data) {
                    $("#dlgClaimProposalWalletPassword").iziModal({width: "70%"});
                    $("#ClaimProposalwalletPassword").val("");
                    $("#fromClaimProposalAddressInfo").html(proposer);
                    $("#valueOfClaimProposalProposalHash").html(proposalhash);
                    $("#feeClaimProposalToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                    $("#dlgClaimProposalWalletPassword").iziModal("open");

                    function doSendTransaction() {
                      $("#dlgClaimProposalWalletPassword").iziModal("close");
                      EticaContract.prepareTransaction_claimproposal($("#ClaimProposalwalletPassword").val(), proposer, proposalhash, function (error) {
                        EticaMainGUI.showGeneralError(error);
                      }, function (data) {
                        EticaBlockchain.sendTransaction(data.raw, function (error) {
                          EticaMainGUI.showGeneralError(error);
                        }, function (data) {
                          EticaProposalHistory.resetClaimForm();
            
                          iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});              
                        
                        });
                      });
                    }
            
                    $("#btnClaimProposalWalletPasswordConfirm").off("click").on("click", function () {
                      doSendTransaction();
                    });
            
                    $("#dlgClaimProposalWalletPassword").off("keypress").on("keypress", function (e) {
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

EticaProposalHistory = new ProposalHistory();
