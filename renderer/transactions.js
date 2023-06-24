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

  async syncTransactionsofWalletAddresses(addressList, startBlock, lastBlock) {

   let addressListlowercase = addressList.map(element => element.toLowerCase());
   //console.log('addressListlowercase is', addressListlowercase);


      //console.log('startBlock is', startBlock);
      //console.log('lastBlock is', lastBlock);


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
      
        let blocknb = startBlock;

        await EticaBlockchain.getBlock(blocknb, true, function (error) {
         // EticaMainGUI.showGeneralError(error);
        }, async function (data) {
          if (data.transactions) {

            let options = {
              fromBlock: blocknb,
              toBlock: blocknb
            };

            await EticaBlockchain.getPastEvents(options, function (error) {
              //EticaMainGUI.showGeneralError(error);
              console.log('getPastEvents() error: ', error);
            }, async function (logevents) {

             // console.log('in getPastEvents, logevents loaded');
            data.transactions.forEach(async (onetx) => {
            //  console.log('onetx step1 ok');
            //  console.log('onetx step1', onetx);
              if (onetx.from && onetx.to) {
               // console.log('onetx step2, onetx.from && onetx.to: ', onetx);
               // console.log('addressListlowercase is', addressListlowercase);


               // NEED TO CHECK TRANSFERS IN CASE OF BATCHED PAYMENT TRANSFER EVENTS //
               // (for ETI transfers made in batch by batch payment contracts, wallet address is not in tx.from or tx.to):  //
               let existTransfertoWallet = false;

               if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){
               
                var txevents_temp = logevents.filter(function(onelogevent) {
                return onelogevent.transactionHash == onetx.hash;
              });

              let wallettransferevents = txevents_temp.filter(function(onevent) {
                return (onevent.event == 'Transfer' && addressListlowercase.includes((onevent.returnValues.to).toLowerCase()));
              });

              if(wallettransferevents && wallettransferevents.length > 0){
                existTransfertoWallet = true;
              }
            
              }

               // (for ETI transfers made in batch by batch payment contracts, wallet address is not in tx.from or tx.to):  //
               // NEED TO CHECK TRANSFERS IN CASE OF BATCHED PAYMENT TRANSFER EVENTS //
               




               if (addressListlowercase.includes((onetx.from).toLowerCase()) || addressListlowercase.includes((onetx.to).toLowerCase()) || existTransfertoWallet) {

                //  console.log('onetx step3, EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to) :', EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to));
                //  console.log('onetx step3, onetx is:', onetx);

                  if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){
                //    console.log('onevent => onevent.transactionHash === onetx.hash) is true:', onetx);
                    /*var txevents = logevents.filter(function(onelogevent) {
                      return onelogevent.transactionHash == onetx.hash;
                    }); */

                    var txevents = logevents.filter(function(onelogevent) {
                      if (onelogevent.event == 'Transfer' && !(addressListlowercase.includes((onelogevent.returnValues.to).toLowerCase()) || addressListlowercase.includes((onelogevent.returnValues.from).toLowerCase()))) {
                        return false; // exclude this element because transfer doesnt belong to this wallet (probably a transfer from a batch payment)
                      } else {
                        return onelogevent.transactionHash == onetx.hash; // keep this element
                      }
                    });
  
                 //   console.log('I txevents before is: ', txevents);
                   

                    // if none transfer events in tx we remove transfers events as main event is not a transfer (unless tx made from another smart contract but we dont handle that case):
                    let nonetransferevents = txevents.filter(function(onevent) {
                      return onevent.event != 'Transfer' 
                    });

                    if(nonetransferevents && nonetransferevents.length > 0){
                 //     console.log('II in nonetransferevents is: ', nonetransferevents);
                      let transferevents = txevents.filter(function(onevent) {
                        return onevent.event == 'Transfer' 
                      });

                      transferevents.forEach(f => {
                        let _eventindex = txevents.findIndex(e => e.logIndex === f.logIndex);
                  //   console.log('I _eventindex  is: ', _eventindex);
                        txevents.splice(_eventindex,1);
                      });
                    }
                    
                   // console.log('txevents after is: ', txevents);

                    txevents.forEach(async (onetxevent) => { 
                    //  console.log('onetxevent step4 :', onetxevent);
                  let _valueeti = 0;
                  let _fromaddreti = null;
                  let _toaddreti = null;
                  let _slashduration = null;
                  let _slashamount = null;
                  let _inorout = 'neutral'; // if tx is received: received, if tx is sent: sent
                  let includedevents = ['Transfer', 'NewCommit', 'NewProposal', 'NewChunk', 'NewDisease', 'NewFee', 'NewSlash', 'NewReveal', 'NewStake', 'StakeClaimed', 'RewardClaimed', 'NewStakesnap', 'NewStakescsldt', 'TieClaimed'];
                  var _toaddress = onetx.to.toLowerCase();

                // if event is not among the ones shown to users we skip, example, CreatedPeriod event (event created at new proposal txs for first proposer of the period):
                if(!includedevents.includes(onetxevent.event)){
                   return;
                }

                  if(onetxevent.event == 'Transfer'){

                    _valueeti = onetxevent.returnValues.tokens;
                    _fromaddreti = onetxevent.returnValues.from;
                    _toaddreti = onetxevent.returnValues.to;
                    _toaddress = onetxevent.returnValues.to;

                    if(addressListlowercase.includes((onetxevent.returnValues.from).toLowerCase())){
                     _inorout = 'sent';
                    }
                    else if(addressListlowercase.includes((onetxevent.returnValues.to).toLowerCase())){
                      _inorout = 'received';
                    }

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

                  if(onetxevent.event == 'StakeClaimed'){

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
                    toaddr: _toaddress,
                    value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                    eventtype: onetxevent.event,
                    logIndex:onetxevent.logIndex, // index position in the block
                    valueeti: _valueeti,
                    fromaddreti: _fromaddreti,
                    toaddreti: _toaddreti,
                    slashduration: _slashduration,
                    inorout: _inorout
                  };
                  
                  
                  // store transaction and notify about new transactions
                  ipcRenderer.send("storeTransaction", Transaction);
              

                  if(onetxevent.event == 'NewCommit'){

                    let _hashinput = ipcRenderer.sendSync("getHashinput", {commithash: onetxevent.returnValues.votehash});
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
                     
                       let _proposaldata = await EticaContract.propsdatas(_hashinput.proposalhash);
                  
                       _hashproposaltitle = _proposal[6];
                       let _propend = _proposaldata[1]; // endtime
                       
                       let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                       let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                       let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();                       
                       let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                       
                       let _period = await EticaContract.periods(_proposal[3]);
                       
                       let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
          
                       _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                       _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                       let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                       _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
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

                    ipcRenderer.send("storeCommit", _NewCommit);

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
                          
                          let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                          
                          let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                          
                          let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                          
                          
                          let _period = await EticaContract.periods(_proposal[3]);
                          
                          let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                              
                          let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");      
      
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
      
              ipcRenderer.send("updateCommitwithStatus", _UpdatedCommit);
      
                       }
      
                      }


                      if(onetxevent.event == 'RewardClaimed'){               
    
                        let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});

                        let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});                         
                 
                        if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
      
                          var _UpdatedCommit = {
                              votehash: _commit.votehash,
                              voter: onetxevent.returnValues.voter,
                              status: 3,
                              rewardamount: onetxevent.returnValues.amount
                          };

                          ipcRenderer.send("updateCommitRewardAmount", _UpdatedCommit);
      
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
      
                          ipcRenderer.send("updateProposalReward", _UpdatedProposal);
      
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
  
              ipcRenderer.send("updateCommitSlash", _UpdatedCommit);
      
      
                       }
  
  
  
                       if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){
  
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
    
                        ipcRenderer.send("updateProposalSlash", _UpdatedProposal);  
    
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
      
              ipcRenderer.send("updateCommitFee", _UpdatedCommit);
      
                       }
  
  
  
                       if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){
  
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
    
                        ipcRenderer.send("updateProposalFee", _UpdatedProposal);
    
                      } 
  
                      }


                      if(onetxevent.event == 'NewProposal'){

                        let _savedproposal = ipcRenderer.sendSync("getProposal", {proposalhash: onetxevent.returnValues.proposed_release_hash});
  
                        let _hashproposalend =null;
                        let _hashproposaldeadline =null;
                        let _timestamp_claimable =null;
                        let _status = 2; // pending
                        let _claimed = false;
      
                        // prevent reactualisation of status on resyncs:
                        if(_savedproposal && _savedproposal.status){
                          if ( _savedproposal.status){
                            _status = _savedproposal.status;
                          }
  
                          if ( _savedproposal.claimed){
                            _claimed = _savedproposal.claimed;
                          }
                        }
      
                           let _proposal = await EticaContract.proposals(onetxevent.returnValues.proposed_release_hash);
                           let _proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposed_release_hash);
                           let _propend = _proposaldata[1]; // endtime      
      
                            let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                            let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                            let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                            let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                            
                            let _period = await EticaContract.periods(_proposal[3]);
                            let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);  
      
                            _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
      
                            _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                            let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                             _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
      
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

                        ipcRenderer.send("storeProposal", _NewProposal);
      
                      }



                    
                    });
                  }

                  // If no input (0x) in tx then it is an egaz transfer:
                  if(onetx.input == '0x' && !existTransfertoWallet){

                    // add other check because of existTransfertoWallet, indeed existTransfertoWallet let pass txs that contain transfer events even if tx deosnt belong to wallet
                    // but is not necessary due to (&& !existTransfertoWallet) above:
                    if(!addressListlowercase.includes((onetx.from).toLowerCase()) && !addressListlowercase.includes((onetx.to).toLowerCase())){
                      // leave because tx doesnt belong to wallet
                      return false;
                     }

                    let _inoroutegaz = 'neutral';
                    if(addressListlowercase.includes((onetx.from).toLowerCase())){
                      _inoroutegaz = 'sent';
                     }
                     else if(addressListlowercase.includes((onetx.to).toLowerCase())){
                       _inoroutegaz = 'received';
                     }

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
                      slashduration: null,
                      inorout: _inoroutegaz
                    };
    
                    // store transaction and notify about new transactions
                    ipcRenderer.send("storeTransaction", Transaction);


                  }
                 
                }
              }
            });


          });

          }

        });

        return 'done';
      
   /* } else {

      //$("#ResyncTxsProgress").css("display", "block");
      SyncProgress.setText("Syncing transactions is complete.");
      EticaTransactions.setIsSyncing(false);
      return 'done2';
      
    } */
  }


  async ScanTxs(maincounter, lastBlock, batchSize) {

    SyncProgress.setText("Scanning wallet transactions");
    // sync all the transactions to the current block
    EticaTransactions.setIsSyncing(true);
    let startBlock = maincounter.block;
    let data = await EticaBlockchain.getAccounts_nocallback();
    
    
    var scanTxsInterval = setInterval(async function () {
    let nextBatchLimit = startBlock + batchSize;
    let maxBlock = Math.min(nextBatchLimit, lastBlock);
      
              for(let blocknb=startBlock; blocknb <= maxBlock; blocknb++){
                let result = await EticaTransactions.syncTransactionsofWalletAddresses(data, blocknb, maxBlock);
                
                startBlock = blocknb + 1;

                if(blocknb >= maxBlock){
                  maincounter.block = blocknb;          
                  ipcRenderer.send("updateCounter", maincounter);
                }

                if((blocknb % 1000 === 0)){
                  SyncProgress.setText(vsprintf("Scanning wallet transactions %d/%d (%d%%)", [
                    blocknb,
                    lastBlock,
                    Math.floor(blocknb / lastBlock * 100)
                  ]));
                }
    
                  if(blocknb >= lastBlock){

                     EticaTransactions.setIsSyncing(false);
                     maincounter.block = blocknb;          
                     ipcRenderer.send("updateCounter", maincounter);
                     // signal that the sync is complete
                     $(document).trigger("onSyncComplete");
                     SyncProgress.setText("Scanning transactions is complete.");

                     if (scanTxsInterval) {
                        clearInterval(scanTxsInterval);
                    }

                  }
              }

  }, 2000);
              
  }



  renderTransactions() {
    if (!EticaTransactions.getIsLoading()) {

      EticaTransactions.setIsLoading(true);

      EticaBlockchain.getAccountsData(function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        EticaMainGUI.renderTemplate("transactions.html", data);
        // show the loading overlay for transactions
        $("#loadingTransactionsOverlay").css("display", "block");
        $(document).trigger("render_transactions");
      });
      

      
      async function loadtransactions(){

        var dataTransactions = await ipcRenderer.sendSync("getTransactions");
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

        setTimeout(loadtransactions, 10000);

      }

      loadtransactions();



      /* setTimeout(async () => {
        var dataTransactions = await ipcRenderer.sendSync("getTransactions");
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
      }, 10000); */


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
            //EticaMainGUI.showGeneralError(error);
            console.log('getPastEvents() error: ', error);
          }, async function (logevents) {

          data.transactions.forEach(onetx => {

            if (onetx.from && onetx.to) {



               // NEED TO CHECK TRANSFERS IN CASE OF BATCHED PAYMENT TRANSFER EVENTS //
               // (for ETI transfers made in batch by batch payment contracts, wallet address is not in tx.from or tx.to):  //
               var existTransfertoWallet = false;

               if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){
               
                var txevents_temp = logevents.filter(function(onelogevent) {
                return onelogevent.transactionHash == onetx.hash;
              });

              var wallettransferevents = txevents_temp.filter(function(onevent) {
                return (onevent.event == 'Transfer' && EticaWallets.getAddressExists((onevent.returnValues.to).toLowerCase()));
              });

              if(wallettransferevents && wallettransferevents.length > 0){
                existTransfertoWallet = true;
              }
            
              }

               // (for ETI transfers made in batch by batch payment contracts, wallet address is not in tx.from or tx.to):  //
               // NEED TO CHECK TRANSFERS IN CASE OF BATCHED PAYMENT TRANSFER EVENTS //


              if (EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to) || existTransfertoWallet) {

                if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){

                 /* var txevents = logevents.filter(function(onelogevent) {
                    return onelogevent.transactionHash == onetx.hash;
                  }); */


                  var txevents = logevents.filter(function(onelogevent) {
                    if (onelogevent.event == 'Transfer' && !(EticaWallets.getAddressExists((onelogevent.returnValues.to).toLowerCase()) || EticaWallets.getAddressExists((onelogevent.returnValues.from).toLowerCase()))) {
                      return false; // exclude this element because transfer doesnt belong to this wallet (probably a transfer from a batch payment)
                    } else {
                      return onelogevent.transactionHash == onetx.hash; // keep this element
                    }
                  });

                  // if none transfer events in tx we remove transfers events as main event is not a transfer (unless tx made from another smart contract but we dont handle that case):
                  let nonetransferevents = txevents.filter(function(onevent) {
                    return onevent.event != 'Transfer' 
                  });

                  if(nonetransferevents && nonetransferevents.length > 0){
                    let transferevents = txevents.filter(function(onevent) {
                      return onevent.event == 'Transfer' 
                    });

                    transferevents.forEach(f => {
                      let _eventindex = txevents.findIndex(e => e.logIndex === f.logIndex);
                      txevents.splice(_eventindex,1);
                    });
                  }
                  
                  txevents.forEach( async(onetxevent) => { 
                let _valueeti = 0;
                let _fromaddreti = null;
                let _toaddreti = null;
                let _slashduration = null;
                let _inorout = 'neutral'; // if tx is received: received, if tx is sent: sent
                let includedevents = ['Transfer', 'NewCommit', 'NewProposal', 'NewChunk', 'NewDisease', 'NewFee', 'NewSlash', 'NewReveal', 'NewStake', 'StakeClaimed', 'RewardClaimed', 'NewStakesnap', 'NewStakescsldt', 'TieClaimed'];
                var _toaddress = onetx.to.toLowerCase();

                // if event is not among the ones shown to users we skip, example, CreatedPeriod event (event created at new proposal txs for first proposer of the period):
                if(!includedevents.includes(onetxevent.event)){
                   return;
                }

                if(onetxevent.event == 'Transfer'){

                  _valueeti = onetxevent.returnValues.tokens;
                  _fromaddreti = onetxevent.returnValues.from;
                  _toaddreti = onetxevent.returnValues.to;
                  _toaddress = onetxevent.returnValues.to;

                  if(EticaWallets.getAddressExists(onetxevent.returnValues.from)){
                    _inorout = 'sent';
                   }
                   else if(EticaWallets.getAddressExists(onetxevent.returnValues.to)){
                     _inorout = 'received';
                   }

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
                
                if(onetxevent.event == 'StakeClaimed'){

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
                  toaddr: _toaddress,
                  value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                  eventtype: onetxevent.event,
                  logIndex:onetxevent.logIndex, // index position in the block
                  valueeti: _valueeti,
                  fromaddreti:  _fromaddreti,
                  toaddreti: _toaddreti,
                  slashduration: _slashduration,
                  inorout: _inorout
                };
                
                // store transaction and notify about new transactions
                ipcRenderer.send("storeTransaction", Transaction);

                if(onetxevent.event == 'NewCommit'){

                  let _hashinput = ipcRenderer.sendSync("getHashinput", {commithash: onetxevent.returnValues.votehash});
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
                     let _proposaldata = await EticaContract.propsdatas(_hashinput.proposalhash);
                     _hashproposaltitle = _proposal[6];
                     let _propend = _proposaldata[1]; // endtime

                      let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                      let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                      let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                      let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                      
                      let _period = await EticaContract.periods(_proposal[3]);
                      let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                      
                      _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                      _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                     let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                       _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
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

                  ipcRenderer.send("storeCommit", _NewCommit);

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
                    
                    let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                    
                    let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                    
                    let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                    
                    let _period = await EticaContract.periods(_proposal[3]);
                    let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);
                    let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

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

        ipcRenderer.send("updateCommitwithStatus", _UpdatedCommit);

                 }

                }


                if(onetxevent.event == 'RewardClaimed'){ 
    
                      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});
               
                      if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
    
                        var _UpdatedCommit = {
                            votehash: _commit.votehash,
                            voter: onetxevent.returnValues.voter,
                            status: 3,
                            rewardamount: onetxevent.returnValues.amount
                        };

            ipcRenderer.send("updateCommitRewardAmount", _UpdatedCommit);
  
                     }


                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

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
                          rewardamount: onetxevent.returnValues.amount,
                          fees:0,
                          slashduration:0,
                          slashamount:0
                      };

                      ipcRenderer.send("updateProposalReward", _UpdatedProposal);
  
  
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
    
            ipcRenderer.send("updateCommitSlash", _UpdatedCommit);
    
                     }


                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

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
  
                      ipcRenderer.send("updateProposalSlash", _UpdatedProposal);
  
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

            ipcRenderer.send("updateCommitFee", _UpdatedCommit);
    
    
                     }



                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

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

                      ipcRenderer.send("updateProposalFee", _UpdatedProposal);
  
                    } 

                    }



                    if(onetxevent.event == 'NewProposal'){

                      let _savedproposal = ipcRenderer.sendSync("getProposal", {proposalhash: onetxevent.returnValues.proposed_release_hash});

                      let _hashproposalend =null;
                      let _hashproposaldeadline =null;
                      let _timestamp_claimable =null;
                      let _status = 2; // pending
                      let _claimed = false;
    
                      // prevent reactualisation of status on resyncs:
                      if(_savedproposal && _savedproposal.status){
                        if ( _savedproposal.status){
                          _status = _savedproposal.status;
                        }

                        if ( _savedproposal.claimed){
                          _claimed = _savedproposal.claimed;
                        }
                      }
    
                         let _proposal = await EticaContract.proposals(onetxevent.returnValues.proposed_release_hash);
                         
                         let _proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposed_release_hash);
                         
                         let _propend = _proposaldata[1]; // endtime
    
                          let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                          
                          let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                          
                          let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                          
                          let MIN_CLAIM_INTERVAL = parseInt(((parseInt(DEFAULT_VOTING_TIME) + parseInt(DEFAULT_REVEALING_TIME)) / parseInt(REWARD_INTERVAL)) + 1);
                          
                          let _period = await EticaContract.periods(_proposal[3]);
                          let seconds_claimable = (parseInt(_period[1]) + parseInt(MIN_CLAIM_INTERVAL)) * parseInt(REWARD_INTERVAL);  
                            
                          _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
    
                          _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
  
                         let _deadline = moment.unix(parseInt(_propend)).add(DEFAULT_REVEALING_TIME,'seconds');
                          _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
                         
    
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
    
                      ipcRenderer.send("storeProposal", _NewProposal);
    
                    }

                $(document).trigger("onNewAccountTransaction");
              
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

                // If no input (0x) in tx then it is an egaz transfer:
                if(onetx.input == '0x' && !existTransfertoWallet){

                  // add other check because of existTransfertoWallet, indeed existTransfertoWallet let pass txs that contain transfer events even if tx deosnt belong to wallet
                  // but is not necessary due to (&& !existTransfertoWallet) above:
                  if(!EticaWallets.getAddressExists(onetx.from) && !EticaWallets.getAddressExists(onetx.to)){
                    // leave because tx doesnt belong to wallet
                    return false;
                   }

                  let _inoroutegaz = 'neutral';

                  if(EticaWallets.getAddressExists(onetx.from)){
                    _inoroutegaz = 'sent';
                   }
                   else if(EticaWallets.getAddressExists(onetx.to)){
                     _inoroutegaz = 'received';
                   }


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
                    slashduration: null,
                    inorout: _inoroutegaz
                  };
 
                  // store transaction and notify about new transactions
                  ipcRenderer.send("storeTransaction", Transaction);             
                  
                $(document).trigger("onNewAccountTransaction");
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
