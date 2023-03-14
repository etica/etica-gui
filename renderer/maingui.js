// In renderer process (web page).
const {ipcRenderer} = require("electron");

class MainGUI {
  constructor() {
    this.appState = "account";
  }

  changeAppState(newState) {
    this.appState = newState;
    $(".sidebarIconWrapper").removeClass("iconSelected");

    switch (this.appState) {
      case "account":
        $("#mainNavBtnWalletsWrapper").addClass("iconSelected");
        break;
      case "addressBook":
        $("#mainNavBtnAddressBookWrapper").addClass("iconSelected");
        break;
      case "commitHistory":
        $("#mainNavBtnCommitHistoryWrapper").addClass("iconSelected");
        break;
      case "send":
        $("#mainNavBtnSendWrapper").addClass("iconSelected");
        break;
      case "sendEti":
        $("#mainNavBtnSendEtiWrapper").addClass("iconSelected");
        break;
        case "commitVote":
        $("#mainNavBtnCommitVoteWrapper").addClass("iconSelected");
        break;
      case "createDisease":
        $("#mainNavBtnCreateDiseaseWrapper").addClass("iconSelected");
        break;
      case "createChunk":
        $("#mainNavBtnCreateChunkWrapper").addClass("iconSelected");
        break;
      case "createProposal":
        $("#mainNavBtnCreateProposalWrapper").addClass("iconSelected");
        break;
      case "transactions":
        $("#mainNavBtnTransactionsWrapper").addClass("iconSelected");
        break;
        case "commitHistory":
        $("#mainNavBtnCommitHistoryWrapper").addClass("iconSelected");
        break;
      case "searchEtica":
        $("#mainNavBtnSearchEticaWrapper").addClass("iconSelected");
        break;
      case "stakes":
        $("#mainNavBtnStakesWrapper").addClass("iconSelected");
        break;
      case "stakesBoard":
        $("#mainNavBtnStakesBoardWrapper").addClass("iconSelected");
        break;
      case "settings":
        $("#mainNavBtnSettingsWrapper").addClass("iconSelected");
        break;
      default: // do nothing for now
    }
  }

  getAppState() {
    return this.appState;
  }

  showGeneralError(errorText) {
    $("#txtGeneralError").html(errorText);

    // create and open the dialog
    $("#dlgGeneralError").iziModal();
    $("#dlgGeneralError").iziModal("open");

    $("#btnGeneralErrorOK").click(function () {
      $("#dlgGeneralError").iziModal("close");
    });
  }

  showGeneralErrorNewWallet(errorText) {
    $("#txtGeneralErrorNewWallet").html(errorText);

    // create and open the dialog
    $("#dlgGeneralErrorNewWallet").iziModal();
    $("#dlgGeneralErrorNewWallet").iziModal("open");

    $("#btnGeneralErrorNewWalletOK").click(function () {
      $("#dlgGeneralErrorNewWallet").iziModal("close");
    });
  }

  showGeneralErrorImportWallet(errorText) {
    $("#txtGeneralErrorImportWallet").html(errorText);

    // create and open the dialog
    $("#dlgGeneralErrorImportWallet").iziModal();
    $("#dlgGeneralErrorImportWallet").iziModal("open");

    $("#btnGeneralErrorImportWalletOK").click(function () {
      $("#dlgGeneralErrorImportWallet").iziModal("close");
    });
  }

  showGeneralConfirmation(confirmText, callback) {
    $("#txtGeneralConfirm").html(confirmText);

    // create and open the dialog
    $("#dlgGeneralConfirm").iziModal();
    $("#dlgGeneralConfirm").iziModal("open");

    $("#btnGeneralConfirmYes").click(function () {
      $("#dlgGeneralConfirm").iziModal("close");
      callback(true);
    });

    $("#btnGeneralConfirmNo").click(function () {
      $("#dlgGeneralConfirm").iziModal("close");
      callback(false);
    });
  }

  showAboutDialog(infoData) {
    $("#versionNumber").html(infoData.version);

    // create and open the dialog
    $("#dlgAboutInfo").iziModal();
    $("#dlgAboutInfo").iziModal("open");

    $("#urlOpenLicence, #urlOpenGitHub").off("click").on("click", function (even) {
      event.preventDefault();
      ipcRenderer.send("openURL", $(this).attr("href"));
    });

    $("#btnAboutInfoClose").off("click").on("click", function (even) {
      $("#dlgAboutInfo").iziModal("close");
    });
  }

  renderTemplate(template, data, container) {
    var template = Handlebars.compile(ipcRenderer.sendSync("getTemplateContent", template));

    if (!container) {
      container = $("#mainContent");
    }

    container.empty();
    container.html(template(data));
  }

  copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
  }
}

ipcRenderer.on("showAboutDialog", function (event, message) {
  EticaMainGUI.showAboutDialog(message);
});

$("#mainNavBtnTransactions").click(function () {
  EticaTransactions.clearFilter();
  EticaMainGUI.changeAppState("transactions");
  EticaTransactions.renderTransactions();
});

$("#mainNavBtnAddressBook").click(function () {
  EticaMainGUI.changeAppState("addressBook");
  EticaAddressBook.renderAddressBook();
});

$("#mainNavBtnCommitHistory").click(function () {
  EticaMainGUI.changeAppState("commitHistory");
  EticaCommitHistory.renderCommitHistory();
});

$("#mainNavBtnSend").click(function () {
  EticaMainGUI.changeAppState("send");
  EgazSend.renderSendState();
});

$("#mainNavBtnSendEti").click(function () {
  EticaMainGUI.changeAppState("sendEti");
  EtiSend.renderSendState();
});

$("#mainNavBtnCommitVote").click(function () {
  EticaMainGUI.changeAppState("commitVote");
  VoteCommit.renderSendState();
});

$("#mainNavBtnCreateDisease").click(function () {
  EticaMainGUI.changeAppState("createDisease");
  DiseaseCreate.renderSendState();
});

$("#mainNavBtnCreateChunk").click(function () {
  EticaMainGUI.changeAppState("createChunk");
  ChunkCreate.renderSendState();
});

$("#mainNavBtnCreateProposal").click(function () {
  EticaMainGUI.changeAppState("createProposal");
  ProposalCreate.renderSendState();
});

$("#mainNavBtnWallets").click(function () {
  EticaMainGUI.changeAppState("account");
  EticaWallets.renderWalletsState();
});


$("#mainNavBtnProposalHistory").click(function () {
  EticaMainGUI.changeAppState("proposalHistory");
  EticaProposalHistory.renderProposalHistory();
});

$("#mainNavBtnSearchEtica").click(function () {
  EticaMainGUI.changeAppState("searchEtica");
  EticaSearch.renderSearchState(EticaSearch.getFilter());
});

$("#mainNavBtnStakes").click(function () {
  EticaMainGUI.changeAppState("stakes");
  StakesEtica.renderStakesState();
});

$("#mainNavBtnStakesBoard").click(function () {
  EticaMainGUI.changeAppState("stakesBoard");
  StakesBoardEtica.renderStakesBoardState();
});

$("#mainNavBtnSettings").click(function () {
  EticaMainGUI.changeAppState("settings");
  EticaSettings.renderSettingsState();
});

$("#iconCloseWallet").click(function () {
  // Close Geth if running (should always be yes but check anyway to avoid returning error) and then close wallet:
  let IsGethRunning = ipcRenderer.sendSync("IsGethRunning", null);
    if(IsGethRunning){
       // first stop the geth process
       ipcResult = ipcRenderer.send("stopGeth", null);
    }
    
    // move to setup:
    window.location.replace('./setup.html');
});


EticaMainGUI = new MainGUI();
