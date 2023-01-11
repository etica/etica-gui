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

  syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter) {
   console.log('in syncTransactionsForSingleAddress');
   console.log('in syncTransactionsForSingleAddress addressList is', addressList);
   console.log('in syncTransactionsForSingleAddress counters is', counters);
   console.log('in syncTransactionsForSingleAddress lastBlock is', lastBlock);
   console.log('in syncTransactionsForSingleAddress counter is', counter);


    if (counter < addressList.length) {

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
      

        EticaBlockchain.getBlock(blocknb, true, function (error) {
          EticaMainGUI.showGeneralError(error);
        }, async function (data) {
          if (data.transactions) {

            let options = {
              fromBlock: blocknb,
              toBlock: blocknb
            };

            EticaBlockchain.getPastEvents(options, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, async function (logevents) {

              console.log('in getPastEvents, logevents loaded');
            data.transactions.forEach(onetx => {
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

                    _valueeti = onetxevent.returnValues.stakeamount;
                    _fromaddreti = onetxevent.returnValues.staker;
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
                    let _hashchoice = null;
                    let _hashvary = null;
                    let _hashproposalhash =null;
                    let _hashproposaltitle =null;
                    let _hashproposalend=null;
                    let _hashproposaldeadline =null;
  
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
                       let MIN_CLAIM_INTERVAL = parseInt(((DEFAULT_VOTING_TIME + DEFAULT_REVEALING_TIME)/REWARD_INTERVAL) + 1);
                       let _period = await EticaContract.periods(_proposal[3]);
                       console.log('_period is', _period);
                       let seconds_claimable = (_period[1] + MIN_CLAIM_INTERVAL) * REWARD_INTERVAL;
                       console.log('seconds_claimable is', seconds_claimable);     
                       let _timestamp_claimable = moment.unix(parseInt(seconds_claimable)).format("YYYY-MM-DD HH:mm:ss");
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
                    timestamp_claimable: _timestamp_claimable,
                    isDone: false,
                    status: 1,
                    };

                    console.log('line 299 before storing _NewCommit', _NewCommit);
                    ipcRenderer.send("storeCommit", _NewCommit);
                    console.log('line 301 after storing _NewCommit', _NewCommit);

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

           if(counter+1 == addressList.length){
                   // update the counter and store it back to file system
                   counters.transactions = blocknb;
                   EticaDatabase.setCounters(counters);
          }
      
      }


        // call the transaction sync for the next address
        EticaTransactions.syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter + 1);
      
    } else {

       // update the counter and store it back to file system
       //counters.transactions = lastBlock;
       //EticaDatabase.setCounters(counters);

      //$("#ResyncTxsProgress").css("display", "block");
      SyncProgress.setText("Syncing transactions is complete.");
      EticaTransactions.setIsSyncing(false);
      
    }
  }

  syncTransactionsForAllAddresses(lastBlock) {
    var counters = EticaDatabase.getCounters();
    var counter = 0;

    EticaBlockchain.getAccounts(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaTransactions.setIsSyncing(true);
      EticaTransactions.syncTransactionsForSingleAddress(data, counters, lastBlock, counter);
    });
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

                  _valueeti = onetxevent.returnValues.stakeamount;
                  _fromaddreti = onetxevent.returnValues.staker;
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
                  let _hashchoice = null;
                  let _hashvary = null;
                  let _hashproposalhash =null;
                  let _hashproposaltitle =null;
                  let _hashproposalend =null;
                  let _hashproposaldeadline =null;

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
                      let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                      let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                      let MIN_CLAIM_INTERVAL = parseInt(((DEFAULT_VOTING_TIME + DEFAULT_REVEALING_TIME)/REWARD_INTERVAL) + 1);
                      let _period = await EticaContract.periods(_proposal[3]);
                      console.log('_period is', _period);
                      let seconds_claimable = (_period[1] + MIN_CLAIM_INTERVAL) * REWARD_INTERVAL;
                      console.log('seconds_claimable is', seconds_claimable);
                      
                      let _timestamp_claimable = moment.unix(parseInt(seconds_claimable)).format("YYYY-MM-DD HH:mm:ss");
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
                  timestamp_claimable: _timestamp_claimable,
                  isDone: false,
                  status: 1,
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

                    let _proposal = await EticaContract.proposals(_commit.proposalhash);
                    let _proposaldata = await EticaContract.propsdatas(_commit.proposalhash);

                    let DEFAULT_REVEALING_TIME = await EticaContract.DEFAULT_REVEALING_TIME();
                    let DEFAULT_VOTING_TIME = await EticaContract.DEFAULT_VOTING_TIME();
                    let REWARD_INTERVAL = await EticaContract.REWARD_INTERVAL();
                    let MIN_CLAIM_INTERVAL = parseInt(((DEFAULT_VOTING_TIME + DEFAULT_REVEALING_TIME)/REWARD_INTERVAL) + 1);
                    let _period = await EticaContract.periods(_proposal[3]);
                       console.log('_period is', _period);
                    let seconds_claimable = (_period[1] + MIN_CLAIM_INTERVAL) * REWARD_INTERVAL;
                       console.log('seconds_claimable is', seconds_claimable);     
                    let _timestamp_claimable = moment.unix(parseInt(seconds_claimable)).format("YYYY-MM-DD HH:mm:ss");
                       console.log('_timestamp_claimable is', _timestamp_claimable);
                       console.log('revealing duration is', DEFAULT_REVEALING_TIME);



                    let _hashproposaltitle = _proposal[6];
                    let _propend = _proposaldata[1]; // endtime
                    let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                    let _deadline = moment.unix(parseInt(_propend)).add(revealingduration,'seconds');
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
                        timestamp_claimable: _timestamp_claimable,
                        status: 2
                    };

        console.log('line 777 before updating with status _UpdatedCommit', _UpdatedCommit);
        ipcRenderer.send("updateCommitwithStatus", _UpdatedCommit);
        console.log('line 779 after updating with status _UpdatedCommit', _UpdatedCommit);


                 }

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
