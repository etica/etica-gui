const {ipcRenderer} = require("electron");

class Transactions {
  constructor() {
    this.filter = "";
    this.isSyncing = false;
    this.isLoading = false;
  }

  setIsSyncing(value) {
    this.isSyncing = value;
  }

  getIsSyncing() {
    return this.isSyncing;
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

  async syncTransactionsForSingleAddress(addressList, counters, lastBlock) {
   console.log('in syncTransactionsForSingleAddress');
   console.log('in syncTransactionsForSingleAddress addressList is', addressList);
   console.log('in syncTransactionsForSingleAddress counters is', counters);
   console.log('in syncTransactionsForSingleAddress lastBlock is', lastBlock);


   /* if (counter < addressList.length) {  */

      var startBlock = parseInt(counters.transactions) || 0;

      console.log('startBlock is', startBlock);
      console.log('lastBlock is', lastBlock);


/*
      var params = vsprintf("?address=%s&fromBlock=%d&toBlock=%d", [
        addressList[counter].toLowerCase(),
        startBlock,
        lastBlock
      ]);

      $.getJSON("http://richlist.dkc.services/transactions_list.php" + params , function (result) {
        result.data.forEach(element => {
          if (element.fromaddr && element.toaddr) {
            ipcRenderer.send("storeTransaction", {
              block: element.block.toString(),
              txhash: element.txhash.toLowerCase(),
              fromaddr: element.fromaddr.toLowerCase(),
              timestamp: element.timestamp,
              toaddr: element.toaddr.toLowerCase(),
              value: element.value
            });
          }
        }); */


      for(let blocknb=startBlock; blocknb <= lastBlock; blocknb++){
      

        await EticaBlockchain.getBlock(blocknb, true, function (error) {
          EticaMainGUI.showGeneralError(error);
        }, async function (data) {
          if (data.transactions) {

            let options = {
              fromBlock: blocknb,
              toBlock: blocknb
            };

            await EticaBlockchain.getPastEvents(options, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, async function (logevents) {

              console.log('in getPastEvents, logevents loaded');
            data.transactions.forEach(async (onetx) => {
              console.log('onetx step1 ok');
              console.log('onetx step1', onetx);
              if (onetx.from && onetx.to) {
                console.log('onetx step2, onetx.from && onetx.to: ', onetx);
                if (EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to)) {

                  console.log('onetx step3, EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to) :', onetx);

                  if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){
                    console.log('onevent => onevent.transactionHash === onetx.hash) is true:', onetx);
                    var txevents = logevents.filter(function(onelogevent) {
                      return onelogevent.transactionHash == onetx.hash;
                    });
  
                    console.log('I txevents before is: ', txevents);
                   

                    // if none transfer events in tx we remove transfers events as main event is not a transfer (unless tx made from another smart contract but we dont handle that case):
                    let nonetransferevents = txevents.filter(function(onevent) {
                      return onevent.event != 'Transfer' 
                    });

                    if(nonetransferevents && nonetransferevents.length > 0){
                      console.log('II in nonetransferevents is: ', nonetransferevents);
                      let transferevents = txevents.filter(function(onevent) {
                        return onevent.event == 'Transfer' 
                      });

                      console.log('I transfereents is: ', transferevents);
                      transferevents.forEach(f => {
                        let _eventindex = txevents.findIndex(e => e.logIndex === f.logIndex);
                        console.log('I _eventindex  is: ', _eventindex);
                        txevents.splice(_eventindex,1);
                      });
                    }
                    
                    console.log('txevents after is: ', txevents);

                    txevents.forEach(async (onetxevent) => { 
                      console.log('onetxevent step4 :', onetxevent);
                  let _valueeti = 0;
                  let _fromaddreti = null;
                  let _toaddreti = null;
                  let _slashduration = null;
                  let _slashamount = null;
                  let includedevents = ['Transfer', 'NewCommit', 'NewProposal', 'NewChunk', 'NewDisease', 'NewFee', 'NewSlash', 'NewReveal', 'NewStake', 'NewStakeClaim', 'RewardClaimed', 'NewStakesnap', 'NewStakescsldt', 'TieClaimed'];
                  console.log('onetxevent.returnValues before includes is ', onetxevent);
                // if event is not among the ones shown to users we skip, example, CreatedPeriod event (event created at new proposal txs for first proposer of the period):
                if(!includedevents.includes(onetxevent.event)){
                   return;
                }

                console.log('onetxevent.returnValues is ', onetxevent);
                  if(onetxevent.event == 'Transfer'){

                    _valueeti = onetxevent.returnValues.tokens;
                    _fromaddreti = onetxevent.returnValues.from;
                    _toaddreti = onetxevent.returnValues.to;

                  }

                  if(onetxevent.event == 'NewCommit'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues._voter;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewProposal'){

                    _valueeti = web3Local.utils.toWei('10', 'ether');
                    _fromaddreti = onetxevent.returnValues._proposer;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewChunk'){

                    _valueeti = web3Local.utils.toWei('5', 'ether');
                    _fromaddreti = onetx.from;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewDisease'){

                    _valueeti = web3Local.utils.toWei('100', 'ether');
                    _fromaddreti = onetx.from;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewFee'){

                    _valueeti = onetxevent.returnValues.fee;
                    _fromaddreti = onetxevent.returnValues.voter;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewSlash'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues.voter;
                    _toaddreti = onetx.to;
                    _slashduration = onetxevent.returnValues.duration;

                  }

                  if(onetxevent.event == 'NewReveal'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues._voter;
                    _toaddreti = onetx.to;

                  }


                  if(onetxevent.event == 'NewStake'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues.staker;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewStakeClaim'){

                    _valueeti = onetxevent.returnValues.stakeamount;
                    _fromaddreti = onetxevent.returnValues.staker;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'RewardClaimed'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues.voter;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'TieClaimed'){

                    _valueeti = 0;
                    _fromaddreti = onetxevent.returnValues.voter;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewStakescsldt'){

                    _valueeti = 0;
                    _fromaddreti = onetxevent.returnValues.staker;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewStakesnap'){

                    _valueeti = onetxevent.returnValues.snapamount;
                    _fromaddreti = onetxevent.returnValues.staker;
                    _toaddreti = onetx.to;

                  }



                  var Transaction = {
                    block: onetx.blockNumber.toString(),
                    txhash: onetx.hash.toLowerCase(),
                    fromaddr: onetx.from.toLowerCase(),
                    timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    toaddr: onetx.to.toLowerCase(),
                    value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                    eventtype: onetxevent.event,
                    logIndex:onetxevent.logIndex, // index position in the block
                    valueeti: _valueeti,
                    fromaddreti:  _fromaddreti,
                    toaddreti: _toaddreti,
                    slashduration: _slashduration
                  };
                  
                  console.log('stored Transaction from logevents.filter(onevent => onevent.transactionHash === onetx.hash) is: ', Transaction);
                  // store transaction and notify about new transactions
                  ipcRenderer.send("storeTransaction", Transaction);
                  console.log('stored Transaction from logevents.filter(onevent => onevent.transactionHash === onetx.hash) is', Transaction);

                  if(onetxevent.event == 'NewCommit'){

                    console.log('line 283 inside NewCommit Condition');
                    console.log('line 284 geeting hashinput of commit: ', onetxevent.returnValues.votehash);
                    let _hashinput = ipcRenderer.sendSync("getHashinput", {commithash: onetxevent.returnValues.votehash});
                    console.log('line 285 _hashinput is: ', _hashinput);
                    let _commit = ipcRenderer.sendSync("getCommit", {votehash: onetxevent.returnValues.votehash, voter: onetxevent.returnValues._voter});
                    let _hashchoice = null;
                    let _hashvary = null;
                    let _hashproposalhash =null;
                    let _hashproposaltitle =null;
                    let _hashproposalend=null;
                    let _hashproposaldeadline =null;
                    let _timestamp_claimable=null;
                    let _status = 1;

                    // prevent reactualisation of status on resyncs:
                    if(_commit && _commit.status){
                      _status = _commit.status;
                    }
  
                    if(_hashinput && _hashinput.commithash == onetxevent.returnValues.votehash){
                      _hashchoice = _hashinput.choice;
                      _hashvary = _hashinput.vary;
                       _hashproposalhash = _hashinput.proposalhash;
  
                       let _proposal = await EticaContract.proposals(_hashinput.proposalhash);
                       console.log('line 299 _proposal is', _proposal);
                       let _proposaldata = await EticaContract.propsdatas(_hashinput.proposalhash);
                       console.log('line 301 _proposaldata is', _proposaldata);
                       _hashproposaltitle = _proposal[6];
                       let _propend = _proposaldata[1]; // endtime
                       console.log('_propend is', _propend);
                       console.log('type of _propend is', typeof _propend);

                       
                       let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                       let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                       let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();                       
                       let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                       console.log('MIN_CLAIM_INTERVAL is', MIN_CLAIM_INTERVAL);
                       console.log('_proposal[3] is', _proposal[3]);
                       let _period = await EticaContract.periods(_proposal[3]);
                       console.log('_period is', _period);
                       let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                       console.log('seconds_claimable is', seconds_claimable);  


                       _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                       console.log('_timestamp_claimable is', _timestamp_claimable);
                       console.log('revealing duration is', DEFAULT_REVEALING_TIME);


                       _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                       console.log('_hashproposalend is', _hashproposalend);
                       let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                       _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
                       console.log('_hashproposaldeadline is', _hashproposaldeadline);
                    }


                    var _NewCommit = {
                    votehash: onetxevent.returnValues.votehash,
                    txhash: onetx.hash.toLowerCase(),
                    voter: onetxevent.returnValues._voter,
                    timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    valueeti: _valueeti,
                    choice: _hashchoice,
                    vary: _hashvary,
                    proposalhash: _hashproposalhash,
                    proposaltitle: _hashproposaltitle,
                    proposalend: _hashproposalend,
                    proposaldeadline: _hashproposaldeadline,
                    timestampclaimable: _timestamp_claimable,
                    isDone: false,
                    status: _status,
                    };

                    console.log('line 299 before storing _NewCommit', _NewCommit);
                    ipcRenderer.send("storeCommit", _NewCommit);
                    console.log('line 301 after storing _NewCommit', _NewCommit);

                  }



                  if(onetxevent.event == 'NewReveal'){


                    let inputs = web3Local.eth.abi.decodeParameters(
                    // ERC20 transfer method args
                    [
                      { type: 'bytes32', name: '_proposed_release_hash' },
                      { type: 'bool', name: '_approved' },
                      { type: 'string', name: '_vary' }
                    ],
                    `0x${onetx.input.substring(10)}`
                  );
      
      
                        let calculatedhash = EticaCommitHistory.calculateHash(inputs._proposed_release_hash, inputs._approved,  onetxevent.returnValues._voter, inputs._vary);
      
                        let _commit = ipcRenderer.sendSync("getCommit", {votehash: calculatedhash, voter: onetxevent.returnValues._voter});
                 
                        if(_commit && _commit.votehash == calculatedhash){

                          let _status = 2;

                          if(_commit.status >= 3){
                            _status = _commit.status;
                          }
      
                          let _proposal = await EticaContract.proposals(_commit.proposalhash);
                          let _proposaldata = await EticaContract.propsdatas(_commit.proposalhash);
      
                          let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                          console.log('DEFAULT_REVEALING_TIME is', DEFAULT_REVEALING_TIME);
                          let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                          console.log('DEFAULT_VOTING_TIME is', DEFAULT_VOTING_TIME);
                          let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                          console.log('REWARD_INTERVAL is', REWARD_INTERVAL);
                          let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                          console.log('MIN_CLAIM_INTERVAL is', MIN_CLAIM_INTERVAL);
                          console.log('_proposal[3] is', _proposal[3]);
                          
                          let _period = await EticaContract.periods(_proposal[3]);
                             console.log('_period is', _period);
                          let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                             console.log('seconds_claimable is', seconds_claimable);     
                          let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                             console.log('_timestamp_claimable is', _timestamp_claimable);
                             console.log('revealing duration is', DEFAULT_REVEALING_TIME);
      
      
      
                          let _hashproposaltitle = _proposal[6];
                          let _propend = _proposaldata[1]; // endtime
                          let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                          let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                          let _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
      
                          var _UpdatedCommit = {
                              votehash: calculatedhash,
                              voter: onetxevent.returnValues._voter,
                              choice: inputs._approved,
                              vary: inputs._vary,
                              proposalhash: _commit.proposalhash,
                              proposaltitle: _hashproposaltitle,
                              proposalend: _hashproposalend,
                              proposaldeadline: _hashproposaldeadline,
                              timestampclaimable: _timestamp_claimable,
                              status: _status
                          };
      
              console.log('line 777 before updating with status _UpdatedCommit', _UpdatedCommit);
              ipcRenderer.send("updateCommitwithStatus", _UpdatedCommit);
              console.log('line 779 after updating with status _UpdatedCommit', _UpdatedCommit);
      
      
                       }
      
                      }


                      if(onetxevent.event == 'RewardClaimed'){         
                        console.log('in rewardclaimed linie 434');        
    
                        let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                        console.log('in rewardclaimed linie 434 _commit is: ', _commit);  
                        console.log('in rewardclaimed linie 434 onetxevent.returnValues is: ', onetxevent.returnValues);  

                        let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});
                        console.log('in rewardclaimed linie 463 _proposal is: ', _proposal);  
                        console.log('in rewardclaimed linie 464 onetxevent.returnValues is: ', onetxevent.returnValues); 
                        
                 
                        if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
      
                          var _UpdatedCommit = {
                              votehash: _commit.votehash,
                              voter: onetxevent.returnValues.voter,
                              status: 3,
                              rewardamount: onetxevent.returnValues.amount
                          };
      
                          console.log('line 777 before updating with status _UpdatedCommit', _UpdatedCommit);
                          ipcRenderer.send("updateCommitRewardAmount", _UpdatedCommit);
                          console.log('line 779 after updating with status _UpdatedCommit', _UpdatedCommit);
      
                       }



                        if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

                          let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                          let _status = _proposal.status;
                          let _claimed = true;
                       
                        
                        // make sure we retrieved proposal without issues, to avoid undefinied status:
                        if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                          _status = proposaldata.status;
                        }
      
                          var _UpdatedProposal = {
                              proposalhash: _proposal.proposalhash,
                              proposer: onetxevent.returnValues.voter,
                              status: _status,
                              claimed: _claimed,
                              rewardamount: onetxevent.returnValues.amount,
                              fees:0,
                              slashduration:0,
                              slashamount:0
                          };
      
                          console.log('line 777 before updating with status _UpdatedProposal', _UpdatedProposal);
                          ipcRenderer.send("updateProposalReward", _UpdatedProposal);
                          console.log('line 779 after updating with status _UpdatedProposal', _UpdatedProposal);
      
      
                        } 
      
                      }


                      if(onetxevent.event == 'NewSlash'){ 
    
                        let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                        let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});
  
                 
                        if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
      
                          var _UpdatedCommit = {
                              votehash: _commit.votehash,
                              voter: onetxevent.returnValues.voter,
                              status: 3,
                              slashduration: onetxevent.returnValues.duration,
                              slashamount: onetxevent.returnValues.amount
                          };
      
              console.log('line 777 before updating reward amount with status _UpdatedCommitSlash', _UpdatedCommit);
              ipcRenderer.send("updateCommitSlash", _UpdatedCommit);
              console.log('line 779 after updating with status _UpdatedCommitSlash', _UpdatedCommit);
      
      
                       }
  
  
  
                       if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){
  
                        console.log('inside found _proposal is true: ');
  
                        let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                        let _status = _proposal.status;
  
                        // make sure we retrieved proposal without issues, to avoid undefinied status:
                        if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                           _status = proposaldata.status;
                        }
  
                        let _claimed = true;
    
                        var _UpdatedProposal = {
                            proposalhash: _proposal.proposalhash,
                            proposer: onetxevent.returnValues.voter,
                            status: _status,
                            claimed: _claimed,
                            slashduration: onetxevent.returnValues.duration,
                            slashamount: onetxevent.returnValues.amount
                        };
    
                        console.log('line 777 before updating with status _UpdatedProposalSlash', _UpdatedProposal);
                        ipcRenderer.send("updateProposalSlash", _UpdatedProposal);
                        console.log('line 779 after updating with status _UpdatedProposalSlash', _UpdatedProposal);
    
    
                      } 
  
                      }
  
  
                      if(onetxevent.event == 'NewFee'){ 
      
                        let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                        let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});
  
                 
                        if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
      
                          var _UpdatedCommit = {
                              votehash: _commit.votehash,
                              voter: onetxevent.returnValues.voter,
                              status: 3,
                              fee: onetxevent.returnValues.fee
                          };
      
              console.log('line 777 before updating reward amount with status _UpdatedCommitFee', _UpdatedCommit);
              ipcRenderer.send("updateCommitFee", _UpdatedCommit);
              console.log('line 779 after updating with status _UpdatedCommitFee', _UpdatedCommit);
      
      
                       }
  
  
  
                       if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){
  
                        console.log('inside found _proposal is true: ');
  
                        let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                        let _status = _proposal.status;
  
                        // make sure we retrieved proposal without issues, to avoid undefinied status:
                        if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                           _status = proposaldata.status;
                        }
  
                        let _claimed = true;
    
                        var _UpdatedProposal = {
                            proposalhash: _proposal.proposalhash,
                            proposer: onetxevent.returnValues.voter,
                            status: _status,
                            claimed: _claimed,
                            fee: onetxevent.returnValues.fee
                        };
    
                        console.log('line 777 before updating with status _UpdatedProposalFee', _UpdatedProposal);
                        ipcRenderer.send("updateProposalFee", _UpdatedProposal);
                        console.log('line 779 after updating with status _UpdatedProposalSlash', _UpdatedProposal);
    
    
                      } 
  
                      }


                      if(onetxevent.event == 'NewProposal'){

                        console.log('line 474 inside NewProposal Condition');
                        let _savedproposal = ipcRenderer.sendSync("getProposal", {proposalhash: onetxevent.returnValues.proposed_release_hash});
                        console.log('line 476 _savedproposal is: ', _savedproposal);
  
                        let _hashproposalend =null;
                        let _hashproposaldeadline =null;
                        let _timestamp_claimable =null;
                        let _status = 2; // pending
                        let _claimed = false;
      
                        // prevent reactualisation of status on resyncs:
                        if(_savedproposal && _savedproposal.status){
                          if ( _savedproposal.status){
                            _status = _proposalsaved.status;
                          }
  
                          if ( _savedproposal.claimed){
                            _claimed = _proposalsaved.claimed;
                          }
                        }
      
                           let _proposal = await EticaContract.proposals(onetxevent.returnValues.proposed_release_hash);
                           console.log('line 659 _proposal is', _proposal);
                           let _proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposed_release_hash);
                           console.log('line 659 _proposaldata is', _proposaldata);
                           let _propend = _proposaldata[1]; // endtime
                           console.log('_propend is', _propend);
                            console.log('type of _propend is', typeof _propend);
      
                            
      
      
                            let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                            console.log('DEFAULT_REVEALING_TIME is', DEFAULT_REVEALING_TIME);
                            let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                            console.log('DEFAULT_VOTING_TIME is', DEFAULT_VOTING_TIME);
                            let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                            console.log('REWARD_INTERVAL is', REWARD_INTERVAL);
                            let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                            console.log('MIN_CLAIM_INTERVAL is', MIN_CLAIM_INTERVAL);
                            console.log('_proposal[3] is', _proposal[3]);
                            
                            let _period = await EticaContract.periods(_proposal[3]);
                               console.log('_period is', _period);
                            let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                               console.log('seconds_claimable is', seconds_claimable);    
      
                            
                            _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                            console.log('_timestamp_claimable is', _timestamp_claimable);
                            console.log('revealing duration is', DEFAULT_REVEALING_TIME);
      
      
                            _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                            console.log('_hashproposalend is', _hashproposalend);
                           let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                             _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
                           console.log('_hashproposaldeadline is', _hashproposaldeadline);
      
                           let _diseaseindex = await EticaContract.diseasesbyIds(_proposal.disease_id);
                           let _disease = await EticaContract.diseases(_diseaseindex);
                           let _chunk = await EticaContract.chunks(_proposal.chunk_id);
      
      
                        var _NewProposal = {
                          proposalhash: _proposal.proposed_release_hash,
                          proposer: onetxevent.returnValues._proposer,
                          rawreleasehash:  _proposal.raw_release_hash, // ipfs content
                          title: _proposal.title,
                          diseasename: _disease.name,
                          diseasehash: _disease.disease_hash,
                          chunktitle: _chunk.title,
                          chunkid: _chunk.id,
                          proposalend: _hashproposalend,
                          proposaldeadline: _hashproposaldeadline,
                          timestampclaimable: _timestamp_claimable, // when proposal is claimable
                          txhash: onetx.hash.toLowerCase(),
                          status: _status, // 0: Rejected, 1: Accepted, 2: Pending
                          claimed: _claimed, // false if proposer didnt claim yet, true if proposer claimed 
                          approvalthreshold: _proposaldata.approvalthreshold,
                          timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"), // blocktimestamp
                          blocknumber: data.number // blocktimestamp
                        };
      
                        console.log('line 558before storing _NewProposal', _NewProposal);
                        ipcRenderer.send("storeProposal", _NewProposal);
                        console.log('line 560 after storing _NewProposal', _NewProposal);
      
                      }



                    
                    });
                  }

                  // If no input in tx then it is an egaz transfer:
                  if(onetx.input == '0x'){

                    var Transaction = {
                      block: onetx.blockNumber.toString(),
                      txhash: onetx.hash.toLowerCase(),
                      fromaddr: onetx.from.toLowerCase(),
                      timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                      toaddr: onetx.to.toLowerCase(),
                      value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                      eventtype: 'EgazTransfer',
                      logIndex:null, // index position in the block
                      valueeti:0,
                      fromaddreti: null,
                      toaddreti: null,
                      slashduration: null
                    };
    
                    console.log('before stored Transaction from onetx.input== is: ', Transaction);
                    // store transaction and notify about new transactions
                    ipcRenderer.send("storeTransaction", Transaction);
                    console.log('stored Transaction from onetx.input== is: ', Transaction);


                  }



                  
                }
              }
            });


          });

          }

        });

          /* if(counter+1 == addressList.length){ */
                   // update the counter and store it back to file system
                   counters.transactions = blocknb;
                   EticaDatabase.setCounters(counters);
                   console.log('reached update counters is', counters);
         /* } */
      
      }


        // call the transaction sync for the next address
        //EticaTransactions.syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter + 1);
        SyncProgress.setText("Syncing transactions is complete.");
        EticaTransactions.setIsSyncing(false);
        return 'done';
      
   /* } else {

       // update the counter and store it back to file system
       //counters.transactions = lastBlock;
       //EticaDatabase.setCounters(counters);

      //$("#ResyncTxsProgress").css("display", "block");
      SyncProgress.setText("Syncing transactions is complete.");
      EticaTransactions.setIsSyncing(false);
      return 'done2';
      
    } */
  }

  async syncTransactionsForAllAddresses(lastBlock) {
    var counters = EticaDatabase.getCounters();
    console.log('counters is', counters);
    var counter = 0;
    let results_array = [];
    let res = 'test';

    let data = await EticaBlockchain.getAccounts_nocallback();
      EticaTransactions.setIsSyncing(true);
      let previousaddress = await EticaTransactions.syncTransactionsForSingleAddress(data, counters, lastBlock);
      console.log('syncTransactionsForSingleAddress () result previousaddress is', previousaddress);
      let newcounters = EticaDatabase.getCounters();
      console.log('newcounters is', newcounters);
      if(previousaddress == 'done'){
      console.log('expected done result received from syncTransactionsForSingleAddress ()');
      res = 'blockscannedsuccess';
    }
    else {
      res = 'blockscannedfailure';
    }

  return res;

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

  enableKeepInSync() {
    EticaBlockchain.subsribeNewBlockHeaders(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaBlockchain.getBlock(data.number, true, function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        if (data.transactions) {
          let unique_txs = [];

          let options = {
            fromBlock: data.number,
            toBlock: data.number
          };

          EticaBlockchain.getPastEvents(options, function (error) {
            EticaMainGUI.showGeneralError(error);
          }, async function (logevents) {

          console.log('in enableKeepInSync() getPastEvents, logevents loaded');
          data.transactions.forEach(onetx => {
            console.log('enableKeepInSync() onetx step1 ok');
            console.log('enableKeepInSync() onetx step1', onetx);


            if (onetx.from && onetx.to) {
              console.log('enableKeepInSync() onetx step2, onetx.from && onetx.to: ', onetx);
              if (EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to)) {

                console.log('enableKeepInSync() onetx step3, EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to) :', onetx);

                if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){
                  console.log('enableKeepInSync() onevent => onevent.transactionHash === onetx.hash) is true:', onetx);
                  console.log('enableKeepInSync() logevents) is :', logevents);

                  console.log('II txevents before is: ', txevents);

                  var txevents = logevents.filter(function(onelogevent) {
                    return onelogevent.transactionHash == onetx.hash;
                  });

                  // if none transfer events in tx we remove transfers events as main event is not a transfer (unless tx made from another smart contract but we dont handle that case):
                  let nonetransferevents = txevents.filter(function(onevent) {
                    return onevent.event != 'Transfer' 
                  });

                  if(nonetransferevents && nonetransferevents.length > 0){
                    console.log('II in nonetransferevents is: ', nonetransferevents);
                    let transferevents = txevents.filter(function(onevent) {
                      return onevent.event == 'Transfer' 
                    });

                    console.log('II transfereents is: ', transferevents);
                    transferevents.forEach(f => {
                      let _eventindex = txevents.findIndex(e => e.logIndex === f.logIndex);
                      console.log('II _eventindex  is: ', _eventindex);
                      txevents.splice(_eventindex,1);
                    });
                  }
                    
                    console.log('II txevents after is: ', txevents);
                  
                  txevents.forEach( async(onetxevent) => { 
                    console.log('enableKeepInSync() onetxevent step4 :', onetxevent);
                let _valueeti = 0;
                let _fromaddreti = null;
                let _toaddreti = null;
                let _slashduration = null;
                let includedevents = ['Transfer', 'NewCommit', 'NewProposal', 'NewChunk', 'NewDisease', 'NewFee', 'NewSlash', 'NewReveal', 'NewStake', 'NewStakeClaim', 'RewardClaimed', 'NewStakesnap', 'NewStakescsldt', 'TieClaimed'];

                // if event is not among the ones shown to users we skip, example, CreatedPeriod event (event created at new proposal txs for first proposer of the period):
                if(!includedevents.includes(onetxevent.event)){
                   return;
                }

                if(onetxevent.event == 'Transfer'){

                  _valueeti = onetxevent.returnValues.tokens;
                  _fromaddreti = onetxevent.returnValues.from;
                  _toaddreti = onetxevent.returnValues.to;

                }

                if(onetxevent.event == 'NewCommit'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues.from;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewProposal'){

                  _valueeti = web3Local.utils.toWei('10', 'ether');
                  _fromaddreti = onetxevent.returnValues._proposer;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewChunk'){

                  _valueeti = web3Local.utils.toWei('5', 'ether');
                  _fromaddreti = onetx.from;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewDisease'){

                  _valueeti = web3Local.utils.toWei('100', 'ether');
                  _fromaddreti = onetx.from;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewFee'){

                  _valueeti = onetxevent.returnValues.fee;
                  _fromaddreti = onetxevent.returnValues.voter;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewSlash'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues.voter;
                  _toaddreti = onetx.to;
                  _slashduration = onetxevent.returnValues.duration;

                }

                if(onetxevent.event == 'NewReveal'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues._voter;
                  _toaddreti = onetx.to;

                }


                if(onetxevent.event == 'NewStake'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues.staker;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewStakeClaim'){

                  _valueeti = onetxevent.returnValues.stakeamount;
                  _fromaddreti = onetxevent.returnValues.staker;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'RewardClaimed'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues.voter;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'TieClaimed'){

                  _valueeti = 0;
                  _fromaddreti = onetxevent.returnValues.voter;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewStakescsldt'){

                  _valueeti = 0;
                  _fromaddreti = onetxevent.returnValues.staker;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewStakesnap'){

                  _valueeti = onetxevent.returnValues.snapamount;
                  _fromaddreti = onetxevent.returnValues.staker;
                  _toaddreti = onetx.to;

                }



                var Transaction = {
                  block: onetx.blockNumber.toString(),
                  txhash: onetx.hash.toLowerCase(),
                  fromaddr: onetx.from.toLowerCase(),
                  timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                  toaddr: onetx.to.toLowerCase(),
                  value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                  eventtype: onetxevent.event,
                  logIndex:onetxevent.logIndex, // index position in the block
                  valueeti: _valueeti,
                  fromaddreti:  _fromaddreti,
                  toaddreti: _toaddreti,
                  slashduration: _slashduration
                };
                
                console.log('stored Transaction from logevents.filter(onevent => onevent.transactionHash === onetx.hash) is: ', Transaction);
                // store transaction and notify about new transactions
                ipcRenderer.send("storeTransaction", Transaction);

                if(onetxevent.event == 'NewCommit'){

                  console.log('line 643 inside NewCommit Condition');
                  console.log('line 644 geeting hashinput of commit: ', onetxevent.returnValues.votehash);
                  let _hashinput = ipcRenderer.sendSync("getHashinput", {commithash: onetxevent.returnValues.votehash});
                  console.log('line 644 _hashinput is: ', _hashinput);
                  let _commit = ipcRenderer.sendSync("getCommit", {votehash: onetxevent.returnValues.votehash, voter: onetxevent.returnValues._voter});
                  let _hashchoice = null;
                  let _hashvary = null;
                  let _hashproposalhash =null;
                  let _hashproposaltitle =null;
                  let _hashproposalend =null;
                  let _hashproposaldeadline =null;
                  let _timestamp_claimable =null;
                  let _status = 1;

                  // prevent reactualisation of status on resyncs:
                  if(_commit && _commit.status){
                      _status = _commit.status;
                  }

                  if(_hashinput && _hashinput.commithash == onetxevent.returnValues.votehash){
                    _hashchoice = _hashinput.choice;
                    _hashvary = _hashinput.vary;
                     _hashproposalhash = _hashinput.proposalhash;

                     let _proposal = await EticaContract.proposals(_hashinput.proposalhash);
                     console.log('line 659 _proposal is', _proposal);
                     let _proposaldata = await EticaContract.propsdatas(_hashinput.proposalhash);
                     console.log('line 659 _proposaldata is', _proposaldata);
                     _hashproposaltitle = _proposal[6];
                     let _propend = _proposaldata[1]; // endtime
                     console.log('_propend is', _propend);
                      console.log('type of _propend is', typeof _propend);

                      


                      let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                      console.log('DEFAULT_REVEALING_TIME is', DEFAULT_REVEALING_TIME);
                      let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                      console.log('DEFAULT_VOTING_TIME is', DEFAULT_VOTING_TIME);
                      let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                      console.log('REWARD_INTERVAL is', REWARD_INTERVAL);
                      let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                      console.log('MIN_CLAIM_INTERVAL is', MIN_CLAIM_INTERVAL);
                      console.log('_proposal[3] is', _proposal[3]);
                      
                      let _period = await EticaContract.periods(_proposal[3]);
                         console.log('_period is', _period);
                      let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                         console.log('seconds_claimable is', seconds_claimable);    

                      
                      _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                      console.log('_timestamp_claimable is', _timestamp_claimable);
                      console.log('revealing duration is', DEFAULT_REVEALING_TIME);


                      _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                      console.log('_hashproposalend is', _hashproposalend);
                     let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                       _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
                     console.log('_hashproposaldeadline is', _hashproposaldeadline);
                    }

                  


                  var _NewCommit = {
                  votehash: onetxevent.returnValues.votehash,
                  txhash: onetx.hash.toLowerCase(),
                  voter: onetxevent.returnValues._voter,
                  timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                  valueeti: _valueeti,
                  choice: _hashchoice,
                  vary: _hashvary,
                  proposalhash: _hashproposalhash,
                  proposaltitle: _hashproposaltitle,
                  proposalend: _hashproposalend,
                  proposaldeadline: _hashproposaldeadline,
                  timestampclaimable: _timestamp_claimable,
                  isDone: false,
                  status: _status,
                  };

                  console.log('line 671 before storing _NewCommit', _NewCommit);
                  ipcRenderer.send("storeCommit", _NewCommit);
                  console.log('line 673 after storing _NewCommit', _NewCommit);

                }


               if(onetxevent.event == 'NewReveal'){


              let inputs = web3Local.eth.abi.decodeParameters(
              // ERC20 transfer method args
              [
                { type: 'bytes32', name: '_proposed_release_hash' },
                { type: 'bool', name: '_approved' },
                { type: 'string', name: '_vary' }
              ],
              `0x${onetx.input.substring(10)}`
            );


                  let calculatedhash = EticaCommitHistory.calculateHash(inputs._proposed_release_hash, inputs._approved,  onetxevent.returnValues._voter, inputs._vary);

                  let _commit = ipcRenderer.sendSync("getCommit", {votehash: calculatedhash, voter: onetxevent.returnValues._voter});
           
                  if(_commit && _commit.votehash == calculatedhash){

                    let _status = 2;

                    if(_commit.status >= 3){
                            _status = _commit.status;
                    }

                    let _proposal = await EticaContract.proposals(_commit.proposalhash);
                    let _proposaldata = await EticaContract.propsdatas(_commit.proposalhash);

                    let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                    console.log('DEFAULT_REVEALING_TIME is', DEFAULT_REVEALING_TIME);
                    let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                    console.log('DEFAULT_VOTING_TIME is', DEFAULT_VOTING_TIME);
                    let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                    console.log('REWARD_INTERVAL is', REWARD_INTERVAL);
                    let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                    console.log('MIN_CLAIM_INTERVAL is', MIN_CLAIM_INTERVAL);
                    console.log('_proposal[3] is', _proposal[3]);
                    
                    let _period = await EticaContract.periods(_proposal[3]);
                       console.log('_period is', _period);
                    let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                       console.log('seconds_claimable is', seconds_claimable);     
                    let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                       console.log('_timestamp_claimable is', _timestamp_claimable);
                       console.log('revealing duration is', DEFAULT_REVEALING_TIME);



                    let _hashproposaltitle = _proposal[6];
                    let _propend = _proposaldata[1]; // endtime
                    let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                    let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                    let _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");

                    var _UpdatedCommit = {
                        votehash: calculatedhash,
                        voter: onetxevent.returnValues._voter,
                        choice: inputs._approved,
                        vary: inputs._vary,
                        proposalhash: _commit.proposalhash,
                        proposaltitle: _hashproposaltitle,
                        proposalend: _hashproposalend,
                        proposaldeadline: _hashproposaldeadline,
                        timestampclaimable: _timestamp_claimable,
                        status: _status
                    };

        console.log('line 777 before updating with status _UpdatedCommit', _UpdatedCommit);
        ipcRenderer.send("updateCommitwithStatus", _UpdatedCommit);
        console.log('line 779 after updating with status _UpdatedCommit', _UpdatedCommit);


                 }

                }


                if(onetxevent.event == 'RewardClaimed'){ 
    
                      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});
                      console.log('RewardClaimed _proposal is: ', _proposal);
                      console.log('RewardClaimed onetxevent.returnValues.proposal_hash is: ', onetxevent.returnValues.proposal_hash);
                      console.log('RewardClaimed onetxevent.returnValues.voter is: ', onetxevent.returnValues.voter);
               
                      if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
    
                        var _UpdatedCommit = {
                            votehash: _commit.votehash,
                            voter: onetxevent.returnValues.voter,
                            status: 3,
                            rewardamount: onetxevent.returnValues.amount
                        };
    
            console.log('line 777 before updating reward amount with status _UpdatedCommit', _UpdatedCommit);
            ipcRenderer.send("updateCommitRewardAmount", _UpdatedCommit);
            console.log('line 779 after updating with status _UpdatedCommit', _UpdatedCommit);
    
    
                     }



                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

                      console.log('inside found _proposal is true: ');

                      let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                      console.log('RewardClaimed proposaldata is: ', proposaldata);
                      let _status = _proposal.status;

                      // make sure we retrieved proposal without issues, to avoid undefinied status:
                      if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                         _status = proposaldata.status;
                      }

                      let _claimed = true;
  
                      var _UpdatedProposal = {
                          proposalhash: _proposal.proposalhash,
                          proposer: onetxevent.returnValues.voter,
                          status: _status,
                          claimed: _claimed,
                          rewardamount: onetxevent.returnValues.amount,
                          fees:0,
                          slashduration:0,
                          slashamount:0
                      };
  
                      console.log('line 777 before updating with status _UpdatedProposal', _UpdatedProposal);
                      ipcRenderer.send("updateProposalReward", _UpdatedProposal);
                      console.log('line 779 after updating with status _UpdatedProposal', _UpdatedProposal);
  
  
                    } 

                    }


                    if(onetxevent.event == 'NewSlash'){ 
    
                      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});

               
                      if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
    
                        var _UpdatedCommit = {
                            votehash: _commit.votehash,
                            voter: onetxevent.returnValues.voter,
                            status: 3,
                            slashduration: onetxevent.returnValues.duration,
                            slashamount: onetxevent.returnValues.amount
                        };
    
            console.log('line 777 before updating reward amount with status _UpdatedCommitSlash', _UpdatedCommit);
            ipcRenderer.send("updateCommitSlash", _UpdatedCommit);
            console.log('line 779 after updating with status _UpdatedCommitSlash', _UpdatedCommit);
    
    
                     }



                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

                      console.log('inside found _proposal is true: ');

                      let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                      let _status = _proposal.status;

                      // make sure we retrieved proposal without issues, to avoid undefinied status:
                      if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                         _status = proposaldata.status;
                      }

                      let _claimed = true;
  
                      var _UpdatedProposal = {
                          proposalhash: _proposal.proposalhash,
                          proposer: onetxevent.returnValues.voter,
                          status: _status,
                          claimed: _claimed,
                          slashduration: onetxevent.returnValues.duration,
                          slashamount: onetxevent.returnValues.amount
                      };
  
                      console.log('line 777 before updating with status _UpdatedProposalSlash', _UpdatedProposal);
                      ipcRenderer.send("updateProposalSlash", _UpdatedProposal);
                      console.log('line 779 after updating with status _UpdatedProposalSlash', _UpdatedProposal);
  
  
                    } 

                    }


                    if(onetxevent.event == 'NewFee'){ 
    
                      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});

               
                      if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
    
                        var _UpdatedCommit = {
                            votehash: _commit.votehash,
                            voter: onetxevent.returnValues.voter,
                            status: 3,
                            fee: onetxevent.returnValues.fee
                        };
    
            console.log('line 777 before updating reward amount with status _UpdatedCommitFee', _UpdatedCommit);
            ipcRenderer.send("updateCommitFee", _UpdatedCommit);
            console.log('line 779 after updating with status _UpdatedCommitFee', _UpdatedCommit);
    
    
                     }



                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

                      console.log('inside found _proposal is true: ');

                      let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                      let _status = _proposal.status;

                      // make sure we retrieved proposal without issues, to avoid undefinied status:
                      if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                         _status = proposaldata.status;
                      }

                      let _claimed = true;
  
                      var _UpdatedProposal = {
                          proposalhash: _proposal.proposalhash,
                          proposer: onetxevent.returnValues.voter,
                          status: _status,
                          claimed: _claimed,
                          fee: onetxevent.returnValues.fee
                      };
  
                      console.log('line 777 before updating with status _UpdatedProposalFee', _UpdatedProposal);
                      ipcRenderer.send("updateProposalFee", _UpdatedProposal);
                      console.log('line 779 after updating with status _UpdatedProposalSlash', _UpdatedProposal);
  
  
                    } 

                    }



                    if(onetxevent.event == 'NewProposal'){

                      console.log('line 643 inside NewProposal Condition');
                      let _savedproposal = ipcRenderer.sendSync("getProposal", {proposalhash: onetxevent.returnValues.proposed_release_hash});
                      console.log('line 644 _savedproposal is: ', _savedproposal);

                      let _hashproposalend =null;
                      let _hashproposaldeadline =null;
                      let _timestamp_claimable =null;
                      let _status = 2; // pending
                      let _claimed = false;
    
                      // prevent reactualisation of status on resyncs:
                      if(_savedproposal && _savedproposal.status){
                        if ( _savedproposal.status){
                          _status = _proposalsaved.status;
                        }

                        if ( _savedproposal.claimed){
                          _claimed = _proposalsaved.claimed;
                        }
                      }
    
                         let _proposal = await EticaContract.proposals(onetxevent.returnValues.proposed_release_hash);
                         console.log('line 659 _proposal is', _proposal);
                         let _proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposed_release_hash);
                         console.log('line 659 _proposaldata is', _proposaldata);
                         let _propend = _proposaldata[1]; // endtime
                         console.log('_propend is', _propend);
                          console.log('type of _propend is', typeof _propend);
    
                          
    
    
                          let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                          console.log('DEFAULT_REVEALING_TIME is', DEFAULT_REVEALING_TIME);
                          let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                          console.log('DEFAULT_VOTING_TIME is', DEFAULT_VOTING_TIME);
                          let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                          console.log('REWARD_INTERVAL is', REWARD_INTERVAL);
                          let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                          console.log('MIN_CLAIM_INTERVAL is', MIN_CLAIM_INTERVAL);
                          console.log('_proposal[3] is', _proposal[3]);
                          
                          let _period = await EticaContract.periods(_proposal[3]);
                             console.log('_period is', _period);
                          let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                             console.log('seconds_claimable is', seconds_claimable);    
    
                          
                          _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                          console.log('_timestamp_claimable is', _timestamp_claimable);
                          console.log('revealing duration is', DEFAULT_REVEALING_TIME);
    
    
                          _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                          console.log('_hashproposalend is', _hashproposalend);
                         let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                           _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
                         console.log('_hashproposaldeadline is', _hashproposaldeadline);
    
                         let _diseaseindex = await EticaContract.diseasesbyIds(_proposal.disease_id);
                         let _disease = await EticaContract.diseases(_diseaseindex);
                         let _chunk = await EticaContract.chunks(_proposal.chunk_id);
    
    
                      var _NewProposal = {
                        proposalhash: _proposal.proposed_release_hash,
                        proposer: onetxevent.returnValues._proposer,
                        rawreleasehash:  _proposal.raw_release_hash, // ipfs content
                        title: _proposal.title,
                        diseasename: _disease.name,
                        diseasehash: _disease.disease_hash,
                        chunktitle: _chunk.title,
                        chunkid: _chunk.id,
                        proposalend: _hashproposalend,
                        proposaldeadline: _hashproposaldeadline,
                        timestampclaimable: _timestamp_claimable, // when proposal is claimable
                        txhash: onetx.hash.toLowerCase(),
                        status: _status, // 0: Rejected, 1: Accepted, 2: Pending
                        claimed: _claimed, // false if proposer didnt claim yet, true if proposer claimed 
                        approvalthreshold: _proposaldata.approvalthreshold,
                        timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"), // blocktimestamp
                        blocknumber: data.number // blocktimestamp
                      };
    
                      console.log('line 1109 before storing _NewProposal', _NewProposal);
                      ipcRenderer.send("storeProposal", _NewProposal);
                      console.log('line 1109 after storing _NewProposal', _NewProposal);
    
                    }


                console.log('stored Transaction from logevents.filter(onevent => onevent.transactionHash === onetx.hash) is', Transaction);
                $(document).trigger("onNewAccountTransaction");
                console.log('new tx before iziToast.info is: ', Transaction);
                if(!unique_txs.includes(onetx.hash.toLowerCase())){
                  iziToast.info({
                    title: "New Transaction",
                    message: vsprintf("Transaction from address %s to address %s was just processed", [Transaction.fromaddr, Transaction.toaddr]),
                    position: "topRight",
                    timeout: 10000
                  });
                  unique_txs.push(onetx.hash.toLowerCase());
                }
                

                if (EticaMainGUI.getAppState() == "transactions") {
                  setTimeout(function () {
                    EticaTransactions.renderTransactions();
                  }, 500);
                }



                  
                  });
                }

                // If no input in tx then it is an egaz transfer:
                if(onetx.input == '0x'){
                  var Transaction = {
                    block: onetx.blockNumber.toString(),
                    txhash: onetx.hash.toLowerCase(),
                    fromaddr: onetx.from.toLowerCase(),
                    timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    toaddr: onetx.to.toLowerCase(),
                    value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                    eventtype: 'EgazTransfer',
                    logIndex:null, // index position in the block
                    valueeti:0,
                    fromaddreti: null,
                    toaddreti: null,
                    slashduration: null
                  };
  
                  console.log('before stored Transaction from onetx.input== is: ', Transaction);
                  // store transaction and notify about new transactions
                  ipcRenderer.send("storeTransaction", Transaction);
                  console.log('stored Transaction from onetx.input== is: ', Transaction);
                  
                  
                $(document).trigger("onNewAccountTransaction");
                console.log('new tx before iziToast.info is: ', Transaction);
                if(!unique_txs.includes(onetx.hash.toLowerCase())){
                  iziToast.info({
                    title: "New Transaction",
                    message: vsprintf("Transaction from address %s to address %s was just processed", [Transaction.fromaddr, Transaction.toaddr]),
                    position: "topRight",
                    timeout: 10000
                  });
                  unique_txs.push(onetx.hash.toLowerCase());
                }
                

                if (EticaMainGUI.getAppState() == "transactions") {
                  setTimeout(function () {
                    EticaTransactions.renderTransactions();
                  }, 500);
                }
                }
                
              }
            }
          });

        });
          
        }
      });
    });
  }

  disableKeepInSync() {
    EticaBlockchain.unsubsribeNewBlockHeaders(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      // success
    });
  }
}

// create new transactions variable
EticaTransactions = new Transactions();
