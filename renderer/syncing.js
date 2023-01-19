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
SyncProgress.setText("Connecting to peers, please wait...");
isFullySynced = false;

initWeb3Passed =false;
alreadyCatchedUp = false;


var peerCountInterval = setInterval(function () {
  web3Local.eth.net.getPeerCount(function (error, count) {
    $("#peerCount").html(vsprintf("Peer Count: %d", [count]));
  });
}, 5000);

function StartSyncProcess() {
  //var alreadyCatchedUp = false;
  var nodeSyncInterval = null;
  var SyncBalancesInterval = null;
  console.log('inside StartSyncProcess');

  var subscription = web3Local.eth.subscribe("syncing", function (error, sync) {
    console.log('inside StartSyncProcess syncing subscription');
    if (!error) {
      console.log('inside StartSyncProcess syncing subscription no error');
      if (!sync) {
        console.log('inside StartSyncProcess syncing subscription no error, not synced');
        SyncProgress.setText("Syncing blockchain, please wait...");
        if (nodeSyncInterval) {
          console.log('inside clearInterval(nodeSyncInterval)');
          clearInterval(nodeSyncInterval);
        }

        nodeSyncInterval = setInterval(function () {
          console.log('inside nodeSyncInterval');
          web3Local.eth.getBlock("latest", function (error, localBlock) {
            //console.log('local block number is', localBlock.number);
            if (!error) {
              if (localBlock.number > 0) {
                console.log('local block number > 0 is', localBlock.number);
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
              InitializeWeb3();
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
            InitializeWeb3();
          }
        });
      }, 2000);
    } else {
      if (nodeSyncInterval) {
        clearInterval(nodeSyncInterval);
      }
    }
  });

  // Updates balances every 30 seconds, if error means issue with node connection and reconnect with InitializeWeb3():
  SyncBalancesInterval = setInterval(function () {

    EticaBlockchain.getAccountsData(function (error) {
      EticaMainGUI.showGeneralError(error);
      InitializeWeb3();
    }, function (data) {
      //console.log('updated Balances');
    });

  }, 30000);


  /*

  console.log('set EticaTransactions.setIsSyncing to false');
  EticaTransactions.setIsSyncing(false);
  // enable the keep in sync feature
  EticaTransactions.enableKeepInSync();
  console.log('set EticaTransactions.setIsSyncing to false');

  */
  
}

var RetrySuscribeSyncing = setInterval( function () {
  try {
    console.log('Inside RetrySuscribeSyncing');
    if(initWeb3Passed){
    if(alreadyCatchedUp == false){
      console.log('Retry StartSyncProcess()');
      StartSyncProcess();
    }
    else{
      console.log('clearInterval RetrySuscribeSyncing');
      clearInterval(RetrySuscribeSyncing);
    }
  }
  } catch (err) {
    EticaMainGUI.showGeneralError(err);
  }
}, 2000);


function InitializeWeb3() {
var InitWeb3 = setInterval(async function () {
  try {
   /* var options = {
      reconnect: {
          auto: true,
          delay: 2000, // ms
          maxAttempts: 5, // 120 -> 10 minutes (1 every 5 seconds)
          onTimeout: false
      }
  }; */
    //let _provider = new Web3.providers.WebsocketProvider("ws://localhost:8551", options);
    let _provider = new Web3.providers.WebsocketProvider("ws://localhost:8551");
    

    web3Local = new Web3(_provider);
    
    /*_provider.on('error', () => {
      console.log('providerr error');
      _provider.disconnect();
      //web3.currentProvider.connection.close();
      //web3Local.setProvider(newProvider())
    });
    _provider.on('close', () => {
      console.log('provider close');
    }); */


    console.log('inside InitWeb3');
    web3Local.eth.net.isListening(function (error, success) {
      if (!error) {
        console.log('inside InitWeb3 no error passed');
        $(document).trigger("onGethReady");
        initWeb3Passed = true; 
        console.log('initWeb3Passed is now: ', initWeb3Passed);
        clearInterval(InitWeb3);
        StartSyncProcess();
      }
    });
  } catch (err) {
    EticaMainGUI.showGeneralError(err);
  }
}, 2000);

}

InitializeWeb3();