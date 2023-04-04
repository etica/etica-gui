// In renderer process (web page).
const {ipcRenderer} = require("electron");

class StakesBoard {
  constructor() {
    this.filter = "";
    this.isLoading = false;
  }

  setIsLoading(value) {
    this.isLoading = value;
  }

  getIsLoading() {
    return this.isLoading;
  }

  setFilter(text) {
    this.filter = text;
  }

  getFilter() {
    return this.filter;
  }

  clearFilter() {
    this.filter = "";
  }

  renderStakesBoard(SearchedAddress=null) {

    BoardStakes.setFilter(SearchedAddress);



    EticaBlockchain.getAccountsData(function (error) {
     // EticaMainGUI.showGeneralError(error);
    }, async function (walletdata) {

      let data = await EticaContract.getStakesBoardBalancesofAddress(SearchedAddress);

      data.sumBalance = walletdata.sumBalance; // wallet egaz balance
      data.sumBalanceEti = walletdata.sumBalanceEti; // wallet eti balance

      if( SearchedAddress != null){
        let _stakesresult = await BoardStakes.SearchInput(SearchedAddress);
        data.stakes = _stakesresult.stakes;
        data.stakescounterarray = []; // use this for displaying right number maxconsolidation options on front page stakesboard.html
        let maxstakeidx = null;
        for (let k=1; k <= _stakesresult.stakescounter; k++){
          if(k<=50){
            var _tempobj = {};
            _tempobj.stakeidx = k;
            data.stakescounterarray.push(_tempobj);
            maxstakeidx = k;
          }
        }
        data.stakescounter = _stakesresult.stakescounter;
        data.maxstakeidx = maxstakeidx;
      }
      else {
        // please provide an address, with select options
      }

      EticaMainGUI.renderTemplate("stakesboard.html", data);
      $(document).trigger("render_stakesboard");

    });

  }

  validateConsolidationParams(_endtime, _min_limit, _maxidx, _stakescounter) {

      if (!(_endtime != '')) {
        EticaMainGUI.showGeneralError("New Stakes End time must be specified!");
        return false;
      }

      if (!(_min_limit != '')) {
        EticaMainGUI.showGeneralError("Minimum end time limit for stakes to be impacted must be specified!");
        return false;
      }

      if (!(_min_limit != '')) {
        EticaMainGUI.showGeneralError("Minimum end time limit for stakes to be impacted must be specified!");
        return false;
      }

      let _now = new moment();
      let _intwoyears = _now.add(2, 'years');
      if(_intwoyears.isBefore(moment.unix(_endtime).format("YYYY-MM-DD HH:mm:ss"))){
        EticaMainGUI.showGeneralError("The new End time date can't be more than two years from now!");
        return false;
      }

      if (Number(_maxidx) > _stakescounter) {
        EticaMainGUI.showGeneralError("Max index must be lower or equal to the number of stakes o this address!");
        return false;
      }

      if (_maxidx > 50) {
        EticaMainGUI.showGeneralError("Max index must be lower than 50!");
        return false;
      }

      return true;

  }


  async SearchInput(_searchedaddress) {
    
    let _result = [];
      
        let address_stakes = await EticaContract.getStakesofAddress(_searchedaddress);
              
        // if stakes:
        if( address_stakes && address_stakes.stakescounter > 0){

               let stakes = address_stakes.stakes;

               for(let i=0;i < address_stakes.stakes.length;i++){

                stakes[i].amount = parseFloat(web3Local.utils.fromWei(address_stakes.stakes[i].amount, "ether"));
               stakes[i].endTime = moment.unix(parseInt(address_stakes.stakes[i].endTime)).format("YYYY-MM-DD HH:mm:ss");
               stakes[i].available = BoardStakes.getavailability(address_stakes.stakes[i].endTime);
               stakes[i].stakeaddress = _searchedaddress;
               stakes[i].stakeindex = i+1;

               }

        _result['stakes'] = stakes;
        _result['stakescounter'] = address_stakes.stakescounter;

          }

        return _result;

  }

  // get stakeavailability:
  getavailability(_stakeend){
    let _now = new moment();
    if(_now.isAfter(moment.unix(parseInt(_stakeend)).format("YYYY-MM-DD HH:mm:ss"))){
      return true;
    }
    else{
      return false;
    }
   }

}

$(document).on("render_stakesboard", function () {

  $("#inputStakesBoard").val(BoardStakes.getFilter());

 /* $("#btnStakesBoard").off("click").on("click", async function () {
  
    console.log("$('#inputStakesBoard').val() is:", $('#inputStakesBoard').val());
    BoardStakes.setFilter($('#inputStakesBoard').val());
    return await BoardStakes.SearchInput($('#inputStakesBoard').val());

  }); */

  $("#btnStakesBoard").off("click").on("click", function () {
    EticaMainGUI.changeAppState("stakesBoard");
    BoardStakes.renderStakesBoard($('#inputStakesBoard').val());
  });

  $(".copyClipboard").off("click").on("click", function () {
    EticaMainGUI.copyToClipboard($(this).html());

    iziToast.success({title: "Copied", message: "Content was copied to clipboard", position: "topRight", timeout: 2000});
  });

  $(".btnClaimStake").off("click").on("click", function () {
    var stakeindex = $(this).attr("data-stakeindex");
    var stakeaddress = $(this).attr("data-stakeaddress");
    var stakeamount = $(this).attr("data-stakeamount");

                  EticaContract.getTranasctionFee_stakeclmidx(stakeaddress, stakeindex, function (error) {
                    EticaMainGUI.showGeneralError(error);
                  }, async function (data) {


                    let isunlocked = await EticaBlockchain.isUnlocked($(stakeaddress).val());

                    $("#ClaimStakewalletPassword").show();
                    $(".sendTXPass").show();
                    $(".sendTXdivider").show();

                    if(isunlocked == 'unlocked'){

                      $("#dlgClaimStakeWalletPassword").iziModal({width: "70%"});
                      $("#ClaimStakewalletPassword").val("");
                      $("#ClaimStakewalletPassword").hide();
                      $(".sendTXPass").css("display", "none");
                      $(".sendTXdivider").css("display", "none");
                      $("#fromClaimStakeAddressInfo").html(stakeaddress);
                      $("#valueOfClaimStakeIndex").html(stakeindex);
                      $("#valueOfClaimStakeAmount").html(stakeamount);
                      $("#feeClaimStakeToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                      $("#dlgClaimStakeWalletPassword").iziModal("open");

                    }
                    else{
                      // Ask password
                      $("#dlgClaimStakeWalletPassword").iziModal({width: "70%"});
                      $("#ClaimStakewalletPassword").val("");
                      $("#fromClaimStakeAddressInfo").html(stakeaddress);
                      $("#valueOfClaimStakeIndex").html(stakeindex);
                      $("#valueOfClaimStakeAmount").html(stakeamount);
                      $("#feeClaimStakeToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                      $("#dlgClaimStakeWalletPassword").iziModal("open");

                    }

            
                    function doSendTransaction() {
                      $("#dlgClaimStakeWalletPassword").iziModal("close");

                      let _password = null;
                      if(isunlocked != 'unlocked') {
                        _password = $("#ClaimStakewalletPassword").val();
                      }

                      EticaContract.prepareTransaction_stakeclmidx(_password, stakeaddress, stakeindex, function (error) {
                        EticaMainGUI.showGeneralError(error);
                      }, function (data) {
                        EticaBlockchain.sendTransaction(data.raw, function (error) {
                          EticaMainGUI.showGeneralError(error);
                        }, function (data) {
                          EticaCommitHistory.resetClaimForm();
            
                          iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});              
                        
                         // unlock accounts
                         let _wallet = ipcRenderer.sendSync("getRunningWallet");

                         if(_wallet.autounlock && isunlocked != 'unlocked'){
                              EticaBlockchain.unlockAccounts(_password, _wallet.unlocktime);
                         }

                        });
                      });
                    }
            
                    $("#btnClaimStakeWalletPasswordConfirm").off("click").on("click", function () {
                      doSendTransaction();
                    });
            
                    $("#dlgClaimStakeWalletPassword").off("keypress").on("keypress", function (e) {
                      if (e.which == 13) {
                        doSendTransaction();
                      }
                    });
                  });

  });


  $(".btnSnapStake").off("click").on("click", function () {
    var stakeindex = $(this).attr("data-stakeindex");
    var stakeaddress = $(this).attr("data-stakeaddress");
    var maxstakeamount = $(this).attr("data-stakeamount");

    $("#dlgAddSnapAmount").iziModal();
    $("#MaxSnapAmount").val(maxstakeamount);

    // reset input fields:
    $("#inputSnapAmount").val("");
    $("#dlgAddSnapAmount").iziModal("open");


    $("#btnAddSnapAmountConfirm").off("click").on("click", function () {

      $("#dlgAddSnapAmount").iziModal("close");

      let input_snapamount = $("#inputSnapAmount").val();

                  EticaContract.getTranasctionFee_stakesnap(stakeaddress, stakeindex, input_snapamount, function (error) {
                    EticaMainGUI.showGeneralError(error);
                  }, async function (data) {

                    let isunlocked = await EticaBlockchain.isUnlocked(stakeaddress);

                    $("#SnapStakewalletPassword").show();
                    $(".sendTXPass").show();
                    $(".sendTXdivider").show();

                    if(isunlocked == 'unlocked'){
                    $("#dlgSnapStakeWalletPassword").iziModal({width: "70%"});
                    $("#SnapStakewalletPassword").val("");
                    $("#SnapStakewalletPassword").hide();
                    $(".sendTXPass").css("display", "none");
                    $(".sendTXdivider").css("display", "none");
                    $("#fromSnapStakeAddressInfo").html(stakeaddress);
                    $("#valueOfSnapStakeIndex").html(stakeindex);
                    $("#valueOfSnapStakeAmount").html(input_snapamount);
                    $("#feeSnapStakeToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                    $("#dlgSnapStakeWalletPassword").iziModal("open");
                    }
                    else{
                      // Ask password
                      $("#dlgSnapStakeWalletPassword").iziModal({width: "70%"});
                      $("#SnapStakewalletPassword").val("");
                      $("#fromSnapStakeAddressInfo").html(stakeaddress);
                      $("#valueOfSnapStakeIndex").html(stakeindex);
                      $("#valueOfSnapStakeAmount").html(input_snapamount);
                      $("#feeSnapStakeToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                      $("#dlgSnapStakeWalletPassword").iziModal("open");
                    }
            
                    function doSendTransaction() {
                      $("#dlgSnapStakeWalletPassword").iziModal("close");

                      let _password = null;
                      if(isunlocked != 'unlocked') {
                        _password = $("#SnapStakewalletPassword").val();
                      }

                      EticaContract.prepareTransaction_stakesnap(_password, stakeaddress, stakeindex, input_snapamount, function (error) {
                        EticaMainGUI.showGeneralError(error);
                      }, function (data) {
                        EticaBlockchain.sendTransaction(data.raw, function (error) {
                          EticaMainGUI.showGeneralError(error);
                        }, function (data) {
                          EticaCommitHistory.resetClaimForm();
            
                          iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});              
                        
                         // unlock accounts
                         let _wallet = ipcRenderer.sendSync("getRunningWallet");

                         if(_wallet.autounlock && isunlocked != 'unlocked'){
                              EticaBlockchain.unlockAccounts(_password, _wallet.unlocktime);
                         }


                        });
                      });
                    }
            
                    $("#btnSnapStakeWalletPasswordConfirm").off("click").on("click", function () {
                      doSendTransaction();
                    });
            
                    $("#dlgSnapStakeWalletPassword").off("keypress").on("keypress", function (e) {
                      if (e.which == 13) {
                        doSendTransaction();
                      }
                    });
                  });

    });

  });



  $(".btnConsolidateStakes").off("click").on("click", function () {
    var stakeaddress = $(this).attr("data-stakeaddress");

    $("#dlgAddConsolidateParameters").iziModal({width: "85%"});
    //$("#MaxStakeIndex").val(maxstakeindex);

    // reset input fields:
    $("#inputNewEndTimeDay").val("");
    $("#inputMinLimitDay").val("");
    $("#inputNewEndTimeMonth").val("");
    $("#inputMinLimitMonth").val("");
    $("#inputNewEndTimeYear").val("");
    $("#inputMinLimitYear").val("");
    //$("#inputMaxConsolidateIndex").val("");
    $("#dlgAddConsolidateParameters").iziModal("open");


    $("#btnAddConsolidateParametersConfirm").off("click").on("click", function () {

      $("#dlgAddConsolidateParameters").iziModal("close");

      let input_endtime_day = $("#inputNewEndTimeDay").val();
      let input_minlimit_day = $("#inputMinLimitDay").val();
      let input_endtime_month = $("#inputNewEndTimeMonth").val();
      let input_minlimit_month = $("#inputMinLimitMonth").val();
      let input_endtime_year = $("#inputNewEndTimeYear").val();
      let input_minlimit_year = $("#inputMinLimitYear").val();
      let input_maxindex = $("#inputMaxConsolidateIndex").val();
      let _stakescounter = $("#CsldtStakesCounter").val();

      let _endtimestring = ''+input_endtime_month+'/'+input_endtime_day+'/'+input_endtime_year+' 00:00';
      let _minlimitstring = ''+input_minlimit_month+'/'+input_minlimit_day+'/'+input_minlimit_year+' 00:00';

      let _endtime = moment(_endtimestring, "M/D/YYYY H:mm").unix();

      let _minlimit = moment(_minlimitstring, "M/D/YYYY H:mm").unix();


      if(BoardStakes.validateConsolidationParams(_endtime, _minlimit, input_maxindex, _stakescounter)){

                  EticaContract.getTranasctionFee_stakescsldt(stakeaddress, _endtime, _minlimit, input_maxindex, function (error) {
                    EticaMainGUI.showGeneralError(error);
                  }, async function (data) {

                    let isunlocked = await EticaBlockchain.isUnlocked(stakeaddress);

                    $("#ConsolidateStakeswalletPassword").show();
                    $(".sendTXPass").show();
                    $(".sendTXdivider").show();

                    if(isunlocked == 'unlocked'){
                      $("#dlgConsolidateStakesWalletPassword").iziModal({width: "70%"});
                      $("#ConsolidateStakeswalletPassword").val("");
                      $("#ConsolidateStakeswalletPassword").hide();
                      $(".sendTXPass").css("display", "none");
                      $(".sendTXdivider").css("display", "none");
                      $("#fromConsolidateStakesAddressInfo").html(stakeaddress);
                      $("#feeConsolidateStakesToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                      $("#dlgConsolidateStakesWalletPassword").iziModal("open");
                    }
                    else {
                      // Ask password
                      $("#dlgConsolidateStakesWalletPassword").iziModal({width: "70%"});
                      $("#ConsolidateStakeswalletPassword").val("");
                      $("#fromConsolidateStakesAddressInfo").html(stakeaddress);
                      $("#feeConsolidateStakesToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), "ether")));
                      $("#dlgConsolidateStakesWalletPassword").iziModal("open");
                    }

            
                    function doSendTransaction() {
                      $("#dlgConsolidateStakesWalletPassword").iziModal("close");

                      let _password = null;
                      if(isunlocked != 'unlocked') {
                         _password = $("#ConsolidateStakeswalletPassword").val();
                      }

                      EticaContract.prepareTransaction_stakescsldt(_password, stakeaddress, input_endtime, input_minlimit, input_maxindex, function (error) {
                        EticaMainGUI.showGeneralError(error);
                      }, function (data) {
                        EticaBlockchain.sendTransaction(data.raw, function (error) {
                          EticaMainGUI.showGeneralError(error);
                        }, function (data) {
                          EticaCommitHistory.resetClaimForm();
            
                          iziToast.success({title: "Sent", message: "Transaction was successfully sent to the chain", position: "topRight", timeout: 5000});              
                        
                         // unlock accounts
                         let _wallet = ipcRenderer.sendSync("getRunningWallet");

                         if(_wallet.autounlock && isunlocked != 'unlocked'){
                              EticaBlockchain.unlockAccounts($("#ConsolidateStakeswalletPassword").val(), _wallet.unlocktime);
                         }

                        });
                      });
                    }
            
                    $("#btnSnapStakeWalletPasswordConfirm").off("click").on("click", function () {
                      doSendTransaction();
                    });
            
                    $("#dlgSnapStakeWalletPassword").off("keypress").on("keypress", function (e) {
                      if (e.which == 13) {
                        doSendTransaction();
                      }
                    });
                  });

                }

    });

  });

});

// create new StakesBoard:
BoardStakes = new StakesBoard();