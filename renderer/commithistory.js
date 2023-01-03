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



  renderTransactions() {
    if (!EticaTransactions.getIsLoading()) {

      EticaBlockchain.getAccountsData(function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        EticaMainGUI.renderTemplate("transactions.html", data);
        $(document).trigger("render_transactions");
      });
      
      EticaTransactions.setIsLoading(true);

      // show the loading overlay for transactions
      $("#loadingTransactionsOverlay").css("display", "block");

      setTimeout(() => {
        var dataTransactions = ipcRenderer.sendSync("getTransactions");
        var addressList = EticaWallets.getAddressList();

        dataTransactions.forEach(function (element) {
          var isFromValid = addressList.indexOf(element[2].toLowerCase()) > -1;
          var isToValid = addressList.indexOf(element[3].toLowerCase()) > -1;

          if (isToValid && !isFromValid) {
            element.unshift(0);
          } else if (!isToValid && isFromValid) {
            element.unshift(1);
          } else {
            element.unshift(2);
          }
        });

        EticaTableTransactions.initialize("#tableTransactionsForAll", dataTransactions);
        EticaTransactions.setIsLoading(false);
      }, 200);
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

  $(".btnChangAddressName").off("click").on("click", function () {
    var walletAddress = $(this).attr("data-address");
    var walletName = $(this).attr("data-name");

    $("#dlgChangeAddressName").iziModal();
    $("#inputAddressName").val(walletName);
    $("#dlgChangeAddressName").iziModal("open");

    function doChangeAddressName() {
      EticaCommitHistory.setAddressName(walletAddress, $("#inputAddressName").val());
      $("#dlgChangeAddressName").iziModal("close");
      EticaCommitHistory.renderCommitHistory();
    }

    $("#btnChangeAddressNameConfirm").off("click").on("click", function () {
      doChangeAddressName();
    });

    $("#dlgChangeAddressName").off("keypress").on("keypress", function (e) {
      if (e.which == 13) {
        doChangeAddressName();
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
