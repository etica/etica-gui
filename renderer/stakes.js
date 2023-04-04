// In renderer process (web page).
const {ipcRenderer} = require("electron");

class EticaStakes {
  constructor() {
    this.addressList = [];
  }

  getAddressList() {
    return this.addressList;
  }

  clearAddressList() {
    this.addressList = [];
  }

  getAddressExists(address) {
    if (address) {
      return this.addressList.indexOf(address.toLowerCase()) > -1;
    } else {
      return false;
    }
  }

  addAddressToList(address) {
    if (address) {
      this.addressList.push(address.toLowerCase());
    }
  }

  renderStakesState() {
    EticaContract.getStakesData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaMainGUI.renderTemplate("stakes.html", data);
      $(document).trigger("render_stakes");
    });

  }

  validateSendForm() {
    if (EticaMainGUI.getAppState() == "stakes") {
      if (!$("#stakeEtiFromAddress").val()) {
        EticaMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#stakeEtiFromAddress").val())) {
        EticaMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      if (Number($("#stakeEtiAmount").val()) <= 0) {
        EticaMainGUI.showGeneralError("Send amount must be greater then zero!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (EticaMainGUI.getAppState() == "send") {
      $("#stakeEtiAmount").val(0);
    }
  }
}

$(document).on("render_stakes", function () {
  $("select").formSelect({classes: "fromAddressSelect"});

  $("#newstakeStakesDiv").css('display', 'none');
  $("#mainStakesDiv").css('display', 'block');

  $("#stakeEtiFromAddress").on("change", async function () {
    var optionText = $(this).find("option:selected").text();
    var addrName = optionText.substr(0, optionText.indexOf("-"));
    var addrValue = optionText.substr(optionText.indexOf("-") + 1);
    $(".fromAddressSelect input").val(addrValue.trim());
    $("#stakeEtiFromAddressName").html(addrName.trim());

    let balance = await EticaContract.balanceEti(this.value);
    $("#StakeEtiMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, "ether")));

  });

  $("#shownewStakeStakesDiv").off("click").on("click", function () {
    $("#mainStakesDiv").css('display', 'none');
    $("#newstakeStakesDiv").css('display', 'block');
  });

  $("#showmainStakesDiv").off("click").on("click", function () {
    $("#newstakeStakesDiv").css('display', 'none');
    $("#mainStakesDiv").css('display', 'block');
  });

  $("#btnStakeEtiAll").off("click").on("click", function () {
    $("#stakeEtiAmount").focus();
    $("#stakeEtiAmount").val($("#StakeEtiMaxAmmount").html());
  });

  $("#btnStakeEti").off("click").on("click", function () {
    if (StakesEtica.validateSendForm()) {
      EticaContract.getTranasctionFee_stakeEti($("#stakeEtiFromAddress").val(), $("#stakeEtiAmount").val(), function (error) {
        EticaMainGUI.showGeneralError(error);
      }, async function (data) {

        let isunlocked = await EticaBlockchain.isUnlocked($("#sendEtiFromAddress").val());

        $("#walletPasswordStakeEti").show();
        $(".sendTXPass").show();
        $(".sendTXdivider").show();

        if(isunlocked == 'unlocked'){
          $("#dlgStakeEtiWalletPassword").iziModal();
        $("#walletPasswordStakeEti").val("");
        $("#walletPasswordStakeEti").hide();
        $(".sendTXPass").hide();
        $(".sendTXdivider").hide();
        $("#fromStakeEtiAddressInfo").html($("#stakeEtiFromAddress").val());
        $("#valueToStakeEtiInfo").html($("#stakeEtiAmount").val());
        $("#feeStakeEtiToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgStakeEtiWalletPassword").iziModal("open");
        }
        else{
          // Ask password
          $("#dlgStakeEtiWalletPassword").iziModal();
        $("#walletPasswordStakeEti").val("");
        $("#fromStakeEtiAddressInfo").html($("#stakeEtiFromAddress").val());
        $("#valueToStakeEtiInfo").html($("#stakeEtiAmount").val());
        $("#feeStakeEtiToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
        $("#dlgStakeEtiWalletPassword").iziModal("open");
        }

        function doSendTransaction() {
          $("#dlgStakeEtiWalletPassword").iziModal("close");

          let _password = null;
          if(isunlocked != 'unlocked') {
            _password = $("#walletPasswordStakeEti").val();
          }

          EticaContract.prepareTransaction_StakeEti(_password, $("#stakeEtiFromAddress").val(), $("#stakeEtiAmount").val(), function (error) {
            EticaMainGUI.showGeneralError(error);
          }, function (data) {
            EticaBlockchain.sendTransaction(data.raw, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, function (data) {
              StakesEtica.resetSendForm();

              iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});

              // unlock accounts
              let _wallet = ipcRenderer.sendSync("getRunningWallet");

                if(_wallet.autounlock && isunlocked != 'unlocked'){
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
              }); */


            });
          });
        }

        $("#btnStakeEtiWalletPasswordConfirm").off("click").on("click", function () {
          doSendTransaction();
        });

        $("#dlgStakeEtiWalletPassword").off("keypress").on("keypress", function (e) {
          if (e.which == 13) {
            doSendTransaction();
          }
        });
      });
    }
  });

  $(".btnShowAddressStakesBoard").off("click").on("click", function () {
    console.log('clicked on .btnShowAddressStakesBoard');
    //BoardStakes.setFilter($(this).attr("data-address"));
    //EticaMainGUI.changeAppState("stakesBoard");
    BoardStakes.renderStakesBoard($(this).attr("data-address"));
  });


});

// create new account variable
StakesEtica = new EticaStakes();

