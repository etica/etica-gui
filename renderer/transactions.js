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
      SyncProgress.setText(vsprintf("Syncing address transactions %d/%d, please wait...", [counter, addressList.length]));

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
                    let txevents = logevents.filter(onevent => onevent.transactionHash === onetx.hash);
                    
                    txevents.forEach(onetxevent => { 
                      console.log('onetxevent step4 :', onetxevent);
                  let _valueeti = 0;
                  let _fromaddreti = null;
                  let _toaddreti = null;
                  let _slashduration = null;


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

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.proposer;
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

      }


        // call the transaction sync for the next address
        EticaTransactions.syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter + 1);
      
    } else {
      // update the counter and store it back to file system
      counters.transactions = lastBlock;
      EticaDatatabse.setCounters(counters);

      SyncProgress.setText("Syncing transactions is complete.");
      EticaTransactions.setIsSyncing(false);
    }
  }

  syncTransactionsForAllAddresses(lastBlock) {
    var counters = EticaDatatabse.getCounters();
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
          data.transactions.forEach(element => {
            if (element.from && element.to) {
              if (EticaWallets.getAddressExists(element.from) || EticaWallets.getAddressExists(element.to)) {
                var Transaction = {
                  block: element.blockNumber.toString(),
                  txhash: element.hash.toLowerCase(),
                  fromaddr: element.from.toLowerCase(),
                  timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                  toaddr: element.to.toLowerCase(),
                  value: Number(element.value).toExponential(5).toString().replace("+", "")
                };

                // store transaction and notify about new transactions
                ipcRenderer.send("storeTransaction", Transaction);
                $(document).trigger("onNewAccountTransaction");
                console.log('new tx before iziToast.info is: ', Transaction);
                if(!unique_txs.includes(element.hash.toLowerCase())){
                  iziToast.info({
                    title: "New Transaction",
                    message: vsprintf("Transaction from address %s to address %s was just processed", [Transaction.fromaddr, Transaction.toaddr]),
                    position: "topRight",
                    timeout: 10000
                  });
                  unique_txs.push(element.hash.toLowerCase());
                }
                

                if (EticaMainGUI.getAppState() == "transactions") {
                  setTimeout(function () {
                    EticaTransactions.renderTransactions();
                  }, 500);
                }
              }
            }
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
