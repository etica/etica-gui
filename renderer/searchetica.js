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

    $("#inputSearchEtica").val(EticaSearch.getFilter());

    if( EticaSearch.getFilter() != ""){
      this.SearchInput(EticaSearch.getFilter());
    }

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


  async SearchInput(_searchhash) {
    
    let _result = [];

    console.log('_searchhash is', _searchhash);
    // check if _searchhash is a disease name: 
    let diseasehashbyname = await EticaContract.getdiseasehashbyName(_searchhash);
    console.log('diseasehashbyname is', diseasehashbyname);

    if(diseasehashbyname){
      _searchhash = diseasehashbyname;
    }
    console.log('new _searchhash is', _searchhash);

    // search for disease:  
    let diseaseindex = await EticaContract.diseasesbyIds(_searchhash);
      console.log('diseaseindex is', diseaseindex);
      console.log('type of diseaseindex is', typeof diseaseindex);

      // disease found:
      if( (diseaseindex > 0) ){

        let _disease = await EticaContract.diseases(diseaseindex);
        console.log('_disease is', _disease);

              // get disease proposals:
              let nbproposals =  await EticaContract.diseaseProposalsCounter(_disease[0]);
              console.log('disease nb proposals: ', nbproposals);
              console.log('typeof disease nbproposals: ', typeof nbproposals);

              let maxproposals = 3;
              nbproposals = Math.max(maxproposals, nbproposals);
              let diseaseproposals = [];
              
               for(let i =1;i<= nbproposals;i++){

               let oneproposal = [];
               let prophash = await EticaContract.diseaseproposals(_disease[0],i);
               console.log('prop hash is', prophash); 
               oneproposal = await EticaContract.proposals(prophash);
               console.log('oneproposal is', oneproposal); 
               // get chunk:
               if(oneproposal[4] != 0){
                oneproposal[4] = await EticaContract.chunks(oneproposal[4]);
               }
               
               let oneproposaldata = await EticaContract.propsdatas(prophash);
               console.log('oneproposaldata is', oneproposaldata); 
               oneproposal[10] = oneproposaldata; // oneproposal[10] contains propsdatas struct
               diseaseproposals.push(oneproposal); 

               }
        
        _result['type'] = 'disease';
        _result['disease'] = _disease;
        _result['proposals'] = diseaseproposals;
        console.log('_result is', _result);
        return _result;
      
      }
      else {

        // search for proposal: 
        let _proposal = await EticaContract.proposals(_searchhash);
        let _chunk = null;

        // proposal found:
        if(_proposal[0] > 0){

          let _proposaldata = await EticaContract.propsdatas(_proposal[1]);
          _proposal[10] = _proposaldata;  // oneproposal[10] contains propsdatas struct          
          
          // if chunk get chunk:
          if(_proposal[4] != 0){
            _chunk = await contract.chunks(_proposal[4]); 
          }
          
          // get disease:
          let diseaseindex =  await EticaContract.diseasesbyIds(_proposal[2]);
          let _disease =  await EticaContract.diseases(diseaseindex);

          // get period:
          let _period =  await EticaContract.periods(_proposal[3]);


          _result['type'] = 'proposal';
          _result['proposal'] = _proposal;
          _result['disease'] = _disease;
          _result['chunk'] = _chunk;
          _result['period'] = _period;  
          console.log('_result is', _result);     
          return _result;

        }

        else {

          // nothing found, return empty result:
          console.log('_result is', _result);
          return _result;

        }

      }

  }

}

$(document).on("render_searchetica", function () {

  $("#btnSearchEtica").off("click").on("click", async function () {
  
    console.log("$('#inputSearchEtica').val() is:", $('#inputSearchEtica').val());
    EticaSearch.setFilter($('#inputSearchEtica').val());
    return await EticaSearch.SearchInput($('#inputSearchEtica').val());

  });

  $(".btnShowSearchWithInput").off("click").on("click", function () {
    EticaSearch.setFilter($('#inputSearchEtica').val());
    EticaMainGUI.changeAppState("searchEtica");
    EticaSearch.renderSearchState();
  });

});

// create new SerachEtica:
EticaSearch = new SearchEtica();

