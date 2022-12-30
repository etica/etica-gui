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

            EticaBlockchain.getPastLogs(blocknb, options, function (error) {
              EticaMainGUI.showGeneralError(error);
            }, async function (logevents) {


            data.transactions.forEach(onetx => {
              if (onetx.from && onetx.to) {
                if (EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to)) {


                  let _eventype = null;
                  let _logIndex = null; // index position in the block
                  let _valueeti = 0;
                  let _addressfrometi = null;
                  let _addresstoeti = null;



                  if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){

                    let txevents = logevents.filter(onevent => onevent.transactionHash === onetx.hash);
                    
                    txevents.forEach(onetxevent => {

                  let _valueeti = 0;
                  let _addressfrometi = null;
                  let _addresstoeti = null;
                  let _slashduration = null;


                  if(onetxevent.event == 'Transfer'){

                    _valueeti = onetxevent.returnValues.amount;
                    _addressfrometi = onetxevent.returnValues.from;
                    _addresstoeti = onetxevent.returnValues.to;

                  }

                  if(onetxevent.event == 'NewCommit'){

                    _valueeti = onetxevent.returnValues.amount;
                    _addressfrometi = onetxevent.returnValues.from;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'NewProposal'){

                    _valueeti = onetxevent.returnValues.amount;
                    _addressfrometi = onetxevent.proposer;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'NewChunk'){

                    _valueeti = web3Local.utils.toWei('5', 'ether');
                    _addressfrometi = onetx.from;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'NewDisease'){

                    _valueeti = web3Local.utils.toWei('100', 'ether');
                    _addressfrometi = onetx.from;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'NewFee'){

                    _valueeti = onetxevent.returnValues.fee;
                    _addressfrometi = onetxevent.returnValues.voter;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'NewSlash'){

                    _valueeti = onetxevent.returnValues.amount;
                    _addressfrometi = onetxevent.returnValues.voter;
                    _addresstoeti = onetx.to;
                    _slashduration = onetxevent.returnValues.duration;

                  }

                  if(onetxevent.event == 'NewReveal'){

                    _valueeti = onetxevent.returnValues.amount;
                    _addressfrometi = onetxevent.returnValues._voter;
                    _addresstoeti = onetx.to;

                  }


                  if(onetxevent.event == 'NewStake'){

                    _valueeti = onetxevent.returnValues.amount;
                    _addressfrometi = onetxevent.returnValues.staker;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'NewStakeClaim'){

                    _valueeti = onetxevent.returnValues.stakeamount;
                    _addressfrometi = onetxevent.returnValues.staker;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'RewardClaimed'){

                    _valueeti = onetxevent.returnValues.stakeamount;
                    _addressfrometi = onetxevent.returnValues.staker;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'TieClaimed'){

                    _valueeti = 0;
                    _addressfrometi = onetxevent.returnValues.voter;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'NewStakescsldt'){

                    _valueeti = 0;
                    _addressfrometi = onetxevent.returnValues.staker;
                    _addresstoeti = onetx.to;

                  }

                  if(onetxevent.event == 'NewStakesnap'){

                    _valueeti = onetxevent.returnValues.snapamount;
                    _addressfrometi = onetxevent.returnValues.staker;
                    _addresstoeti = onetx.to;

                  }



                  var Transaction = {
                    block: onetx.blockNumber.toString(),
                    txhash: onetx.hash.toLowerCase(),
                    fromaddr: onetx.from.toLowerCase(),
                    timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    toaddr: onetx.to.toLowerCase(),
                    value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                    eventype: onetxevent.event,
                    logIndex:onetxevent.logIndex, // index position in the block
                    valueeti: _valueeti,
                    addressfrometi:  _addressfrometi,
                    addresstoeti: _addresstoeti,
                    slashduration: _slashduration
                  };
                  

                  // store transaction and notify about new transactions
                  ipcRenderer.send("storeTransaction", Transaction);
                  console.log('stored Transaction from logevents.filter(onevent => onevent.transactionHash === onetx.hash) is', Transaction);

                    
                    });
                  }



                  var Transaction = {
                    block: onetx.blockNumber.toString(),
                    txhash: onetx.hash.toLowerCase(),
                    fromaddr: onetx.from.toLowerCase(),
                    timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    toaddr: onetx.to.toLowerCase(),
                    value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                    eventype: null,
                    logIndex:null, // index position in the block
                    valueeti:0,
                    addressfrometi: null,
                    addresstoeti: null,
                    slashduration: null
                  };
  
                  // store transaction and notify about new transactions
                  ipcRenderer.send("storeTransaction", Transaction);
                  console.log('stored Transaction is', Transaction);
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
