// In renderer process (web page).
const {ipcRenderer} = require("electron");

class Settings {
  constructor() {
    this.runningwallet = {};
  }

  Setrunningwallet(_wallet) {
    this.runningwallet = _wallet;
  } 

  Getrunningwallet(_wallet) {
    return this.runningwallet;
  } 

  renderSettingsState() {
    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {

      let _wallet = ipcRenderer.sendSync("getRunningWallet");
      data.wallet = _wallet;
      EticaWallets.Setrunningwallet(_wallet);
      EticaMainGUI.renderTemplate("settings.html", data);
    $(document).trigger("render_settings");
    });
  }
}

$(document).on("render_settings", async function () {
  $("#btnSettingsCleanTransactions").off("click").on("click", async function () {
    if (isFullySynced) {
      EticaMainGUI.showGeneralConfirmation("Do you really want to resync transactions?", async function (result) {
        if (result) {
          if (EticaTransactions.getIsSyncing()) {
            EticaMainGUI.showGeneralError("Transactions sync is currently in progress");
          } else {

            var loading_screen = pleaseWait({logo: "", backgroundColor: "#000000", loadingHtml: "<div class='spinner'><div class='bounce bounce1'></div><div class='bounce bounce2'></div><div class='bounce bounce3'></div></div><div class='loadingText'>Transactions Rescync initiated, it may take few minutes please wait...</div>"});

            // first disable keepInSync
            EticaTransactions.disableKeepInSync();
            // then delete the transactions data
            var counters = EticaDatabase.getCounters();
            counters.transactions = 0;
            EticaDatabase.setCounters(counters);
            ipcResult = ipcRenderer.sendSync("deleteTransactions", null);

            if (ipcResult.success) {

              ipcResultCommits = ipcRenderer.sendSync("deleteCommits", null);

              if (ipcResultCommits.success) {

                ipcResultProposals = ipcRenderer.sendSync("deleteProposals", null);

                if (ipcResultProposals.success) {

              // sync all the transactions to the current block
              web3Local.eth.getBlock("latest", async function (error, localBlock) {
                if (error) {
                  EticaMainGUI.showGeneralError(error);
                } else {
                  //EticaTransactions.enableKeepInSync();
                  let j = counters.transactions;
                  let resp = '';
                  console.log('j before loop is', j);
                  while (j + 500 < localBlock.number){
                    resp = await EticaTransactions.syncTransactionsForAllAddresses(j);
                    console.log('syncTransactionsForAllAddresses from settings resp is ', resp);
                    j = j + 500;
                    if (resp != 'blockscannedsuccess') break;
                  }
                  counters = EticaDatabase.getCounters();
                  console.log('counters.transactions after loop is ', counters.transactions);
                  console.log('j after loop is', j);
                  console.log('localBlock.number is ', localBlock.number);
                  if(localBlock.number > counters.transactions && (localBlock.number - counters.transactions) <= 500){
                    console.log('inside last call to syncTransactionsForAllAddresses()');
                    await EticaTransactions.syncTransactionsForAllAddresses(localBlock.number);
                  }

                  loading_screen.finish();

                  iziToast.success({title: "Rescync initiated", message: "Transactions Resync initiated, it may take a few minutes please wait", position: "topRight", timeout: 5000});
                }
              });


            } else {
              EticaMainGUI.showGeneralError("Error deleting proposals: ");
              console.log('ipcResultProposals.error is:', ipcResultProposals.error);
            }

            } else {
              EticaMainGUI.showGeneralError("Error deleting commits: ");
              console.log('ipcResultCommits.error is:', ipcResultCommits.error);
            }

            } else {
              EticaMainGUI.showGeneralError("Error deleting transactions: ");
              console.log('ipcResult.error is:', ipcResult.error);
            }
          }
        }
      });
    } else {
      iziToast.info({title: "Wait...", message: "You need to be fully sync before cleaning transactions", position: "topRight", timeout: 5000});
    }
  });

  $("#btnSettingsCleanWallets").off("click").on("click", function () {
    EticaMainGUI.showGeneralConfirmation("Do you really want to delete wallets data?", function (result) {
      if (result) {
        ipcResult = ipcRenderer.sendSync("deleteWalletData", null);

        if (ipcResult.success) {
          iziToast.success({title: "Success", message: "Wallet names were succesfully cleaned", position: "topRight", timeout: 5000});
        } else {
          EticaMainGUI.showGeneralError("Error clearing wallet names: " + ipcResult.error);
        }
      }
    });
  });

  $("#btnSettingsCleanBlockchain").off("click").on("click", function () {
    EticaMainGUI.showGeneralConfirmation("Do you really want to delete the blockchain data? Wallet will close and you will need to restart it!", function (result) {
      if (result) {
        var loading_screen = pleaseWait({logo: "assets/images/logo.png", backgroundColor: "#000000", loadingHtml: "<div class='spinner'><div class='bounce bounce1'></div><div class='bounce bounce2'></div><div class='bounce bounce3'></div></div><div class='loadingText'>Deleting blockchain data, wallet will automatically close, please wait...</div>"});

        setTimeout(() => {
          // first stop the geth process
          ipcResult = ipcRenderer.send("stopGeth", null);

          setTimeout(() => {
            // delete the blockchain date async and wait for 5 seconds
            ipcResult = ipcRenderer.sendSync("deleteBlockchainData", null);
            // finally quit the application
            ipcResult = ipcRenderer.send("appQuit", null);
          }, 5000);
        }, 2000);
      }
    });
  });

  $("#btnCloseWallet").off("click").on("click", function () {


    let IsGethRunning = ipcRenderer.send("IsGethRunning", null);
    if(IsGethRunning){
       // first stop the geth process
       ipcResult = ipcRenderer.send("stopGeth", null);
    }
    
    // move to setup:
    window.location.replace('./setup.html');

  });


  $("#btnUpdateMainSettings").off("click").on("click", function () {

    console.log('btnUpdateMainSetting called');
    let NewWallet = {};
    NewWallet.masteraddress = EticaWallets.Getrunningwallet().masteraddress;

    // Wallet name:
    if($("#settingsWalletName").val() != ''){
      NewWallet.name = $("#settingsWalletName").val();
    }


    // Wallet unlock choice:
    let unlock_choice = null;
    if (document.getElementById('unlockChoiceYes').checked && !document.getElementById('unlockChoiceNo').checked) {
      unlock_choice = true;
    }
    if (!document.getElementById('unlockChoiceYes').checked && document.getElementById('unlockChoiceNo').checked) {
      unlock_choice = false;
    }

    // if vote choice is not true or false it means there was an issue getting the vote choice from interface, we abort:
    if(unlock_choice != true && unlock_choice != false){
      EticaMainGUI.showGeneralError('Please select an option to allow or disallow Auto Unlock of wallet');
      return;
    }
    NewWallet.autounlock = unlock_choice;


    // Wallet unlocktime:
    const minutes = Number($("#unlockTime").val());
    if (!isNaN(minutes)) {
      // Convert the minutes to seconds
      const seconds = minutes * 60;
      NewWallet.unlocktime = seconds; 
    }
    else {
      NewWallet.unlocktime = 0;
    }

    console.log('NewWallet is ::: ', NewWallet);
    ipcRenderer.send("updateWalletMainSettings", NewWallet); 


  });


  // SETTINGS MENU
  $("#gosettingsactions").off("click").on("click", function () {
    
    $("#settingsactions").css("display", "block");
    $("#settingsmain").css("display", "none");
    $("#settingsdirectories").css("display", "none");
    $("#settingsadvanced").css("display", "none");

  });

  $("#gosettingsmain").off("click").on("click", function () {
    
    $("#settingsactions").css("display", "none");
    $("#settingsmain").css("display", "block");
    $("#settingsdirectories").css("display", "none");
    $("#settingsadvanced").css("display", "none");

  });

  $("#gosettingsdirectories").off("click").on("click", function () {
    
    $("#settingsactions").css("display", "none");
    $("#settingsmain").css("display", "none");
    $("#settingsdirectories").css("display", "block");
    $("#settingsadvanced").css("display", "none");

  });

  $("#gosettingsadvanced").off("click").on("click", function () {
    
    $("#settingsactions").css("display", "none");
    $("#settingsmain").css("display", "none");
    $("#settingsdirectories").css("display", "none");
    $("#settingsadvanced").css("display", "block");

  });


});

// create new settings variable
EticaSettings = new Settings();