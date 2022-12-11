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
        }, function (data) {
          if (data.transactions) {
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
                  console.log('stored Transaction is', Transaction);
                }
              }
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
      EticaMainGUI.renderTemplate("transactions.html", {});
      $(document).trigger("render_transactions");
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

                iziToast.info({
                  title: "New Transaction",
                  message: vsprintf("Transaction from address %s to address %s was just processed", [Transaction.fromaddr, Transaction.toaddr]),
                  position: "topRight",
                  timeout: 10000
                });

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
