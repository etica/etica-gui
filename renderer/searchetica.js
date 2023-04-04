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

  renderSearchState(SearchFor=null) {

    EticaSearch.setFilter($('#inputSearchEtica').val());

    EticaBlockchain.getAccountsData(function (error) {
     // EticaMainGUI.showGeneralError(error);
    }, async function (data) {

      if( SearchFor != null && SearchFor != ""){
        
        let _blockchainresp = await EticaSearch.SearchInput(SearchFor);
       
        if(_blockchainresp && _blockchainresp.type == 'disease'){
          data.DiseaseFound = true;
        }
        if(_blockchainresp && _blockchainresp.type == 'proposal'){
          data.ProposalFound = true;
        }
        if(_blockchainresp && _blockchainresp.type == 'chunk'){
          data.ChunkFound = true;
        }
        if(_blockchainresp && _blockchainresp.type == 'noresult'){
          data.NoresultFound = true;
        }
        data.BlockchainResp = _blockchainresp;
      }
      

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
      $("#sendToAddressName").html("");
      $("#sendToAddress").val("");
      $("#sendAmmount").val(0);
    }
  }


  async SearchInput(_searchhash) {
    
    let _result = [];

    // check if _searchhash is a disease name: 
    let diseasehashbyname = await EticaContract.getdiseasehashbyName(_searchhash);

    if(diseasehashbyname != '0x0000000000000000000000000000000000000000000000000000000000000000' && diseasehashbyname != null){
      _searchhash = diseasehashbyname;
    }

    let _now = Date.now();
    let CurrentDate = moment(_now);

    // search for disease:
    let diseaseindex = 0;
    let isBytes32 = web3Local.utils.isHexStrict(_searchhash) && /^0x[0-9a-f]{64}$/i.test(_searchhash);
    if(isBytes32){
      diseaseindex = await EticaContract.diseasesbyIds(_searchhash);
    }
      

      // disease found:
      if( (diseaseindex > 0) ){

        let _disease = await EticaContract.diseases(diseaseindex);

              // get disease proposals:
              let nbproposals =  await EticaContract.diseaseProposalsCounter(_disease[0]);
              let nbchunks =  await EticaContract.diseaseChunksCounter(_disease[0]);

              let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
               let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
               let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
               let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);

              let maxproposals = Math.min(20, nbproposals);
              let diseaseproposals = [];
              
               for(let i =1;i<= maxproposals;i++){

                let _revealopen = false;
                let _revealpassed = false;
                let _claimopen = false;
                let _rejected = false;
                let _approved = false;
                let _pending = false;

               let oneproposal = [];
               let prophash = await EticaContract.diseaseproposals(_disease[0],i);
               oneproposal = await EticaContract.proposals(prophash);
               // get chunk:
               if(oneproposal[4] != 0){
                oneproposal[4] = await EticaContract.chunks(oneproposal[4]);
                oneproposal.haschunk = true;
               }
               else {
                oneproposal.haschunk = false;
               }
               
               let oneproposaldata = await EticaContract.propsdatas(prophash);
               oneproposal[10] = oneproposaldata; // oneproposal[10] contains propsdatas struct

               if(oneproposal[10].status == 0){
                _rejected = true;
              }
              if(oneproposal[10].status == 1){
                _approved = true;
              }
              if(oneproposal[10].status == 2){
                _pending = true;
              }

              oneproposal.rejected = _rejected;
              oneproposal.pending = _pending;
              oneproposal.approved = _approved;

               let _propstart = oneproposal[10][0];
               let _propend = oneproposal[10][1]; // endtime
               
               let _period = await EticaContract.periods(oneproposal[3]);
               let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
    
               let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

              //let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
              let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                
              oneproposal.proposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
              //oneproposal.proposalend = moment(_hashproposalend).format("YYYY-MM-DD HH:mm:ss");
              oneproposal.proposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
              oneproposal.proposalstart = moment.unix(parseInt(_propstart)).format("YYYY-MM-DD HH:mm:ss");
              oneproposal.timestampclaimable = moment(_timestamp_claimable).format("YYYY-MM-DD HH:mm:ss");

              oneproposal.forvotes = web3Local.utils.fromWei(oneproposal[10].forvotes, "ether");
              oneproposal.againstvotes = web3Local.utils.fromWei(oneproposal[10].againstvotes, "ether");

              if(oneproposal[10].forvotes > 0 || oneproposal[10].againstvotes > 0){
              let _forvotesbn = web3Local.utils.toBN(oneproposal[10].forvotes);
              let _againstvotesbn = web3Local.utils.toBN(oneproposal[10].againstvotes);
              let _ratio_numerator = web3Local.utils.toBN("10000").mul(_forvotesbn); // multiply by 1000 then div by 10 to get in %
              let _ratio_denumerator = _forvotesbn.add(_againstvotesbn);
              let _ratiobn = _ratio_numerator.div(_ratio_denumerator);
              let _ratio = parseInt(_ratiobn)/100;
        
              _ratio = parseFloat(_ratio.toString());
              _ratio = _ratio.toFixed(2);
              oneproposal.votesratio = _ratio+ '%';
              }
              else {
                oneproposal.votesratio = "novotes";
              }

              oneproposal.approvalthreshold = oneproposal[10].approvalthreshold/100;
              
              if( CurrentDate.isAfter(oneproposal.proposalend) && CurrentDate.isBefore(oneproposal.proposaldeadline) ){
                _revealopen = true;
               }
             else if (CurrentDate.isAfter(oneproposal.proposaldeadline)){
                _revealpassed = true;
               }
     
             if( CurrentDate.isAfter(_timestamp_claimable)){
                 _claimopen = true;
                } 

                oneproposal.revealopen = _revealopen;
                oneproposal.revealpassed = _revealpassed;
                oneproposal.claimopen = _claimopen;
               
               diseaseproposals.push(oneproposal); 

               }
        
        _result['type'] = 'disease';
        _result['disease'] = _disease;
        _result['proposals'] = diseaseproposals;
        _result['diseasenbproposals'] = nbproposals;
        _result['diseasenbchunks'] = nbchunks;
        return _result;
      
      }
      else {

        // search for proposal: 
        let _proposal = [];
        if(isBytes32){
        _proposal = await EticaContract.proposals(_searchhash);
        }
        
        let _chunk = [];

        // proposal found:
        if(_proposal[0] > 0){

          let _revealopen = false;
          let _revealpassed = false;
          let _claimopen = false;
          let _rejected = false;
          let _approved = false;
          let _pending = false;

          let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
          let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
          let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
          let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);

          let _proposaldata = await EticaContract.propsdatas(_proposal[1]);
          _proposal[10] = _proposaldata;  // _proposal[10] contains propsdatas struct          
          
          // if chunk get chunk:
          if(_proposal[4] != 0){
            _chunk = await contract.chunks(_proposal[4]); 
            _proposal.haschunk = true;
          }
          else{
            _proposal.haschunk = false;
          }
          
          // get disease:
          let diseaseindex =  await EticaContract.diseasesbyIds(_proposal[2]);
          let _disease =  await EticaContract.diseases(diseaseindex);

          // get period:
          let _period =  await EticaContract.periods(_proposal[3]);


          _proposal[10] = _proposaldata; // _proposal[10] contains propsdatas struct

          if(_proposal[10].status == 0){
           _rejected = true;
         }
         if(_proposal[10].status == 1){
           _approved = true;
         }
         if(_proposal[10].status == 2){
           _pending = true;
         }

         _proposal.rejected = _rejected;
         _proposal.pending = _pending;
         _proposal.approved = _approved;

          let _propstart = _proposal[10][0];
          let _propend = _proposal[10][1]; // endtime
          
          let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);

          let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

         //let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
         let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
           
         _proposal.proposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
         //_proposal.proposalend = moment(_hashproposalend).format("YYYY-MM-DD HH:mm:ss");
         _proposal.proposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
         _proposal.proposalstart = moment.unix(parseInt(_propstart)).format("YYYY-MM-DD HH:mm:ss");
         _proposal.timestampclaimable = moment(_timestamp_claimable).format("YYYY-MM-DD HH:mm:ss");

         _proposal.forvotes = web3Local.utils.fromWei(_proposal[10].forvotes, "ether");
         _proposal.againstvotes = web3Local.utils.fromWei(_proposal[10].againstvotes, "ether");

         if(_proposal[10].forvotes > 0 || _proposal[10].againstvotes > 0){
         let _forvotesbn = web3Local.utils.toBN(_proposal[10].forvotes);
         let _againstvotesbn = web3Local.utils.toBN(_proposal[10].againstvotes);
         let _ratio_numerator = web3Local.utils.toBN("10000").mul(_forvotesbn); // multiply by 1000 then div by 10 to get in %
         let _ratio_denumerator = _forvotesbn.add(_againstvotesbn);
         let _ratiobn = _ratio_numerator.div(_ratio_denumerator);
         let _ratio = parseInt(_ratiobn)/100;
   
         _ratio = parseFloat(_ratio.toString());
         _ratio = _ratio.toFixed(2);
         _proposal.votesratio = _ratio+ '%';
         }
         else {
           _proposal.votesratio = "novotes";
         }

         _proposal.approvalthreshold = _proposal[10].approvalthreshold/100;
         
         if( CurrentDate.isAfter(_proposal.proposalend) && CurrentDate.isBefore(_proposal.proposaldeadline) ){
           _revealopen = true;
          }
        else if (CurrentDate.isAfter(_proposal.proposaldeadline)){
           _revealpassed = true;
          }

        if( CurrentDate.isAfter(_timestamp_claimable)){
            _claimopen = true;
           } 

           _proposal.revealopen = _revealopen;
           _proposal.revealpassed = _revealpassed;
           _proposal.claimopen = _claimopen;






          _result['type'] = 'proposal';
          _result['proposal'] = _proposal;
          _result['disease'] = _disease;
          _result['chunk'] = _chunk;
          _result['period'] = _period;    
          return _result;

        }

        else {


             if(!isNaN(_searchhash)){
             // search for chunk: 
             _chunk = await EticaContract.chunks(_searchhash);
             }

             if(_chunk[0] > 0){

              // get disease:
              let chunkdiseaseindex =  await EticaContract.diseasesbyIds(_chunk[1]);
              let _chunkdisease =  await EticaContract.diseases(chunkdiseaseindex);
              _chunk.nbproposals = await EticaContract.chunkProposalsCounter(_chunk[0]);

              _result['type'] = 'chunk';
              _result['chunk'] = _chunk;
              _result['disease'] = _chunkdisease;
              console.log('_result is', _result);
              return _result;

             }


          // nothing found, return empty result:
          _result['type'] = 'noresult';
          return _result;

        }

      }

  }

}

$(document).on("render_searchetica", function () {

  $("#inputSearchEtica").val(EticaSearch.getFilter());

 /* $("#btnSearchEtica").off("click").on("click", async function () {
  
    console.log("$('#inputSearchEtica').val() is:", $('#inputSearchEtica').val());
    EticaSearch.setFilter($('#inputSearchEtica').val());
    return await EticaSearch.SearchInput($('#inputSearchEtica').val());

  }); */

  $("#btnSearchEtica").off("click").on("click", function () {
    EticaMainGUI.changeAppState("searchEtica");
    EticaSearch.renderSearchState($('#inputSearchEtica').val());
  });

  $(".copyClipboard").off("click").on("click", function () {
    EticaMainGUI.copyToClipboard($(this).html());

    iziToast.success({title: "Copied", message: "Content was copied to clipboard", position: "topRight", timeout: 2000});
  });

});

// create new SerachEtica:
EticaSearch = new SearchEtica();

