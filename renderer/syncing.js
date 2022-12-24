// In renderer process (web page).
const {ipcRenderer} = require("electron");

// Set the provider you want from Web3.providers
SyncProgress = new ProgressBar.Line("#syncProgress", {
  strokeWidth: 6,
  easing: "easeInOut",
  duration: 1400,
  color: "#308968",
  trailColor: "#eee",
  trailWidth: 1,
  text: {
    style: {
      color: "#bbb",
      position: "absolute",
      left: "50%",
      top: "-1px",
      transform: "translateX(-50%)",
      fontSize: "0.9em",
      LineHeight: "24px",
      padding: 0
    },
    autoStyleContainer: false
  },
  from: {
    color: "#FFEA82"
  },
  to: {
    color: "#ED6A5A"
  }
});

// set initial value for the progress text
SyncProgress.setText("Syncing blockchain, please wait...");
isFullySynced = false;

var peerCountInterval = setInterval(function () {
  web3Local.eth.net.getPeerCount(function (error, count) {
    $("#peerCount").html(vsprintf("Peer Count: %d", [count]));
  });
}, 5000);

function StartSyncProcess() {
  var alreadyCatchedUp = false;
  var nodeSyncInterval = null;
  var SyncBalancesInterval = null;

  var subscription = web3Local.eth.subscribe("syncing", function (error, sync) {
    if (!error) {
      if (!sync) {
        if (nodeSyncInterval) {
          clearInterval(nodeSyncInterval);
        }

        nodeSyncInterval = setInterval(function () {
          web3Local.eth.getBlock("latest", function (error, localBlock) {
            if (!error) {
              if (localBlock.number > 0) {
                if (!EticaTransactions.getIsSyncing()) {
                  SyncProgress.animate(1);
                  SyncProgress.setText(vsprintf("%d/%d (100%%)", [localBlock.number, localBlock.number]));
                }

                if (alreadyCatchedUp == false) {
                  // clear the repeat interval and render wallets
                  $(document).trigger("onNewAccountTransaction");
                  alreadyCatchedUp = true;
                  isFullySynced = true;

                  // enable the keep in sync feature
                  EticaTransactions.enableKeepInSync();
                  // sync all the transactions to the current block
                  EticaTransactions.syncTransactionsForAllAddresses(localBlock.number);

                  // signal that the sync is complete
                  $(document).trigger("onSyncComplete");
                }
              }
            } else {
              EticaMainGUI.showGeneralError(error);
            }
          });
        }, 10000);
      }
    } else {
      EticaMainGUI.showGeneralError(error);
    }
  }).on("data", function (sync) {
    if (sync && sync.HighestBlock > 0) {
      SyncProgress.animate(sync.CurrentBlock / sync.HighestBlock);
      SyncProgress.setText(vsprintf("%d/%d (%d%%)", [
        sync.CurrentBlock,
        sync.HighestBlock,
        Math.floor(sync.CurrentBlock / sync.HighestBlock * 100)
      ]));
    }
  }).on("changed", function (isSyncing) {
    if (isSyncing) {
      nodeSyncInterval = setInterval(function () {
        web3Local.eth.isSyncing(function (error, sync) {
          if (!error && sync) {
            SyncProgress.animate(sync.currentBlock / sync.highestBlock);
            SyncProgress.setText(vsprintf("%d/%d (%d%%)", [
              sync.currentBlock,
              sync.highestBlock,
              Math.floor(sync.currentBlock / sync.highestBlock * 100)
            ]));
          } else if (error) {
            EticaMainGUI.showGeneralError(error);
          }
        });
      }, 2000);
    } else {
      if (nodeSyncInterval) {
        clearInterval(nodeSyncInterval);
      }
    }
  });

  // Updates balances every 60 seconds
  SyncBalancesInterval = setInterval(function () {

    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      //console.log('updated Balances');
    });

  }, 30000);


  
}

var InitWeb3 = setInterval(function () {
  try {
    web3Local = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8551"));

    web3Local.eth.net.isListening(function (error, success) {
      if (!error) {
        $(document).trigger("onGethReady");
        clearInterval(InitWeb3);
        StartSyncProcess();
      }
    });
  } catch (err) {
    EticaMainGUI.showGeneralError(err);
  }
}, 2000);
