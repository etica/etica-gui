// In renderer process (web page).
const {ipcRenderer} = require("electron");

class SearchEtica {
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

  renderSearchState() {
    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaMainGUI.renderTemplate("searchetica.html", data);
      $(document).trigger("render_searchetica");
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
}

$(document).on("render_searchetica", function () {

  $("#btnSearchEtica").off("click").on("click", async function () {
  
    let _search = EticaSearch.getFilter();

    // search for disease:  
    let diseaseindex = await EticaContract.diseasesbyIds(_search);
      console.log('diseaseindex is', diseaseindex);
      console.log('type of diseaseindex is', typeof diseaseindex);
      let diseasename = '';

      if( (diseaseindex > 0) ){
        let _disease = await EticaContract.diseases(diseaseindex);
        console.log('_disease is', _disease);
        diseasename = _disease[1];
        return _disease;
      }
      else {

        // search for proposal: 
        let _proposal = await EticaContract.proposals(_search);
        
        
        let _proposaldata = await EticaContract.propsdatas(_search);
        _proposal[10] = _proposaldata;
        return _proposal;

      }



  });

  $(".btnShowSearchWithInput").off("click").on("click", function () {
    EticaSearch.setFilter($(this).attr("data-wallet"));
    EticaMainGUI.changeAppState("searchEtica");
    EticaSearch.renderSearchState();
  });

});

// create new SerachEtica:
EticaSearch = new SearchEtica();

