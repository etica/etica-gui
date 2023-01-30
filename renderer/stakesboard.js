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

    console.log('SearchedAddress is', SearchedAddress);

    BoardStakes.setFilter(SearchedAddress);



    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, async function (walletdata) {

      console.log('walletdata is', walletdata);

      let data = await EticaContract.getStakesBoardBalancesofAddress(SearchedAddress);

      console.log('data before is', data);
      data.sumBalance = walletdata.sumBalance; // wallet egaz balance
      data.sumBalanceEti = walletdata.sumBalanceEti; // wallet eti balance
      console.log('data after is', data);

      if( SearchedAddress != null){
        
        data.stakes = await BoardStakes.SearchInput(SearchedAddress);

      }
      else {
        // please provide an address, with select options
      }

      console.log('data final to stakesboard is', data);
      EticaMainGUI.renderTemplate("stakesboard.html", data);
      $(document).trigger("render_stakesboard");

    });

  }

  validateSendForm() {
    if (EticaMainGUI.getAppState() == "send") {
      if (!$("#sendFromAddress").val()) {
        EticaMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#sendFromAddress").val())) {
        EticaMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      if (!$("#sendToAddress").val()) {
        EticaMainGUI.showGeneralError("Recipient address must be specified!");
        return false;
      }

      if (!EticaBlockchain.isAddress($("#sendToAddress").val())) {
        EticaMainGUI.showGeneralError("Recipient address must be a valid address!");
        return false;
      }

      if (Number($("#sendAmmount").val()) <= 0) {
        EticaMainGUI.showGeneralError("Send ammount must be greater then zero!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (EticaMainGUI.getAppState() == "send") {
      $("#sendToAddressName").html("");
      $("#sendToAddress").val("");
      $("#sendAmmount").val(0);
    }
  }


  async SearchInput(_searchedaddress) {
    
    let _result = [];

        console.log('_searchedaddress is', _searchedaddress);
      
        let address_stakes = await EticaContract.getStakesofAddress(_searchedaddress);
        console.log('stakes of Address is', address_stakes);
              
        // if stakes:
        if( address_stakes && address_stakes.stakescounter > 0){

               let stakes = address_stakes.stakes;

               for(let i=0;i < address_stakes.stakes.length;i++){

                stakes[i].amount = parseFloat(web3Local.utils.fromWei(address_stakes.stakes[i].amount, "ether"));
               stakes[i].endtime = moment.unix(parseInt(stakes[i].endTime)).format("YYYY-MM-DD HH:mm:ss");
               stakes[i].available = BoardStakes.getavailability(stakes[i].endTime);

               }

        _result['stakes'] = stakes;
        console.log('_result is', _result);

          }

        return _result;

  }

  // get stakeavailability:
  getavailability(_stakeend){
    let _now = new moment();
    if(_now.isAfter(moment.unix(_stakeend))){
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

});

// create new StakesBoard:
BoardStakes = new StakesBoard();
