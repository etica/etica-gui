const {ipcRenderer} = require("electron");

class AddressBook {
  constructor() {}

  setAddressName(address, name) {
    var addressBook = EticaDatatabse.getAddresses();

    // set the wallet name from the dialog box
    addressBook.names[address.toUpperCase()] = name;
    EticaDatatabse.setAddresses(addressBook);
  }

  getAddressName(address) {
    var addressBook = EticaDatatabse.getAddresses();
    // set the wallet name from the dialog box
    return addressBook.names[address.toUpperCase()] || "";
  }

  getAddressList() {
    var addressBook = EticaDatatabse.getAddresses();
    return addressBook.names;
  }

  deleteAddress(address) {
    var addressBook = EticaDatatabse.getAddresses();
    delete addressBook.names[address];
    EticaDatatabse.setAddresses(addressBook);
  }

  enableButtonTooltips() {}

  renderAddressBook() {
    var addressObject = EticaAddressBook.getAddressList();
    var renderData = {
      addressData: []
    };

    for (var key in addressObject) {
      if (addressObject.hasOwnProperty(key)) {
        var addressEntry = {};
        addressEntry.name = addressObject[key];
        addressEntry.address = key;
        renderData.addressData.push(addressEntry);
      }
    }

    // render the wallets current state
    EticaMainGUI.renderTemplate("addressBook.html", renderData);
    $(document).trigger("render_addressBook");
    EticaAddressBook.enableButtonTooltips();
  }
}

// the event to tell us that the wallets are rendered
$(document).on("render_addressBook", function () {
  if ($("#addressTable").length > 0) {
    new Tablesort(document.getElementById("addressTable"));
    $("#addressTable").floatThead();
  }

  $("#btnNewAddress").off("click").on("click", function () {
    $("#dlgCreateAddressAndName").iziModal();
    $("#addressName").val("");
    $("#addressHash").val("");
    $("#dlgCreateAddressAndName").iziModal("open");

    function doCreateNewWallet() {
      $("#dlgCreateAddressAndName").iziModal("close");

      if (!EticaBlockchain.isAddress($("#addressHash").val())) {
        EticaMainGUI.showGeneralError("Address must be a valid address!");
      } else {
        EticaAddressBook.setAddressName($("#addressHash").val(), $("#addressName").val());
        EticaAddressBook.renderAddressBook();

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
      EticaAddressBook.setAddressName(walletAddress, $("#inputAddressName").val());
      $("#dlgChangeAddressName").iziModal("close");
      EticaAddressBook.renderAddressBook();
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
      EticaAddressBook.deleteAddress(deleteAddress);
      EticaAddressBook.renderAddressBook();
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

EticaAddressBook = new AddressBook();
