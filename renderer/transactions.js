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
    if (counter < addressList.length) {
      SyncProgress.setText(vsprintf("Syncing address transactions %d/%d, please wait...", [counter, addressList.length]));

      var startBlock = parseInt(counters.transactions) || 0;
      var params = vsprintf("?address=%s&fromBlock=%d&toBlock=%d", [
        addressList[counter].toLowerCase(),
        startBlock,
        lastBlock
      ]);

      $.getJSON("http://mine2backup.live/xero-richlist/transactions_list.php" + params, function (result) {
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
        });

        // call the transaction sync for the next address
        EthoTransactions.syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter + 1);
      });
    } else {
      // update the counter and store it back to file system
      counters.transactions = lastBlock;
      EthoDatatabse.setCounters(counters);

      SyncProgress.setText("Syncing transactions is complete.");
      EthoTransactions.setIsSyncing(false);
    }
  }

  syncTransactionsForAllAddresses(lastBlock) {
    var counters = EthoDatatabse.getCounters();
    var counter = 0;

    EthoBlockchain.getAccounts(function (error) {
      EthoMainGUI.showGeneralError(error);
    }, function (data) {
      EthoTransactions.setIsSyncing(true);
      EthoTransactions.syncTransactionsForSingleAddress(data, counters, lastBlock, counter);
    });
  }

  renderTransactions() {
    if (!EthoTransactions.getIsLoading()) {
      EthoMainGUI.renderTemplate("transactions.html", {});
      $(document).trigger("render_transactions");
      EthoTransactions.setIsLoading(true);

      // show the loading overlay for transactions
      $("#loadingTransactionsOverlay").css("display", "block");

      setTimeout(() => {
        var dataTransactions = ipcRenderer.sendSync("getTransactions");
        var addressList = EthoWallets.getAddressList();

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

        EthoTableTransactions.initialize("#tableTransactionsForAll", dataTransactions);
        EthoTransactions.setIsLoading(false);
      }, 200);
    }
  }

  enableKeepInSync() {
    EthoBlockchain.subsribeNewBlockHeaders(function (error) {
      EthoMainGUI.showGeneralError(error);
    }, function (data) {
      EthoBlockchain.getBlock(data.number, true, function (error) {
        EthoMainGUI.showGeneralError(error);
      }, function (data) {
        if (data.transactions) {
          data.transactions.forEach(element => {
            if (element.from && element.to) {
              if (EthoWallets.getAddressExists(element.from) || EthoWallets.getAddressExists(element.to)) {
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

                if (EthoMainGUI.getAppState() == "transactions") {
                  setTimeout(function () {
                    EthoTransactions.renderTransactions();
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
    EthoBlockchain.unsubsribeNewBlockHeaders(function (error) {
      EthoMainGUI.showGeneralError(error);
    }, function (data) {
      // success
    });
  }
}

// create new transactions variable
EthoTransactions = new Transactions();
