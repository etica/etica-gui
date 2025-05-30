// In renderer process (web page).
const {ipcRenderer} = require("electron");

// scanning.js is same as syncing.js but doesn't suscribe to syncing blockchain:

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
SyncProgress.setText("Scanning blocks for wallet transactions, please wait ...");
isFullySynced = false;

initWeb3Passed =false;
alreadyCatchedUp = false;
auto_unlock_done = false;
restartGeth_counter = 1;


var peerCountInterval = setInterval(function () {
  web3Local.eth.net.getPeerCount(function (error, count) {
    $("#peerCount").html(vsprintf("Peer Count: %d", [count]));
  });
}, 5000);

function StartSyncProcess() {
  //var alreadyCatchedUp = false;
  var nodeSyncInterval = null;
  var SyncBalancesInterval = null;

        //console.log('inside StartSyncProcess syncing subscription no error, not synced');
        SyncProgress.setText("Syncing blockchain, please wait...");
        if (nodeSyncInterval) {
          //console.log('inside clearInterval(nodeSyncInterval)');
          clearInterval(nodeSyncInterval);
        }

        nodeSyncInterval = setInterval(function () {
          //console.log('inside nodeSyncInterval');
          web3Local.eth.getBlock("latest", function (error, localBlock) {
            //console.log('local block number is', localBlock.number);
            if (!error) {
              if (localBlock.number > 0) {
                //console.log('local block number > 0 is', localBlock.number);
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
                  let maincounter = ipcRenderer.sendSync("getCounter", "MainCounter");
                  //maincounter.block = 2800000;          
                  //ipcRenderer.send("updateCounter", maincounter);
                  if(maincounter && maincounter.block){
                    EticaTransactions.ScanTxs(maincounter, localBlock.number, 500); // former was 500
                  }
                  else {         
                    let _wallet = ipcRenderer.sendSync("getRunningWallet");
                    let newcounter = {};
                    newcounter.name = "MainCounter";
                    // New seed case:
                    if(_wallet && _wallet.seedcreationtype && _wallet.seedcreationtype == 'newseed' && localBlock.number > 3000){
                      newcounter.block = localBlock.number - 3000; // retrieve 3000 blocks to catch any potential transaction that happened since wallet seed created
                      
                      if(!_wallet.seedblockheight){
                        // set wallet seed block height:
                        _wallet.seedblockheight = localBlock.number;
                        ipcRenderer.send("setWalletBlockHeight", _wallet);
                        ipcRenderer.send("updateGethRunningWalletSettings", _wallet);
                      }  
                    
                    }
                    // New import seed case:
                    else if(_wallet && _wallet.seedcreationtype && _wallet.seedcreationtype == 'importedseed'){
                        // import seed from given block height:
                        if(_wallet.seedblockheight && _wallet.seedblockheight < localBlock.number){
                          newcounter.block = _wallet.seedblockheight; // start scanning txs from imported seed block height
                        }
                        else{
                          newcounter.block = 0;
                        }
                    }
                    else {
                        newcounter.block = 0;
                    }
                    ipcRenderer.send("createCounter", newcounter);
                    EticaTransactions.ScanTxs(newcounter, localBlock.number, 500);

                    }
                  
                }
              }
            } else {
              //EticaMainGUI.showGeneralError(error);
              console.log('error getting latest block', error);
              InitializeWeb3();
            }
          });
        }, 5000); 
  
}


function restartGeth(wallet, counter){
  var _restarttimes = counter/6;
  console.log('failed to connect on wsport '+wallet.wsport+' . Restarting Geth, please wait ('+_restarttimes+')');
  ipcRenderer.send("stopGeth", null);
  setTimeout(() => {
    ipcRenderer.send("startGeth", wallet);
  }, 600);
}


function InitializeWeb3() {
var InitWeb3 = setInterval(async function () {
  try {

    let _provider = new Web3.providers.WebsocketProvider("ws://localhost:8551");
    

    web3Local = new Web3(_provider);

    //console.log('inside InitWeb3');
    web3Local.eth.net.isListening(function (error, success) {
      if (!error) {
        restartGeth_counter = 1; // reset restartGeth_counter
        //console.log('inside InitWeb3 no error passed');
        $(document).trigger("onGethReady");
        initWeb3Passed = true; 
        //console.log('initWeb3Passed is now: ', initWeb3Passed);
        clearInterval(InitWeb3);
        StartSyncProcess();
      } else{
        //console.log('InitializeWeb3.web3Local.eth.net.isListening() error is:', error);
        restartGeth_counter = restartGeth_counter + 1;
        // InitWeb3 = setInterval() is called every 2 secs
        // so restartGeth() will be called every 12 seconds
        // every 12 seconds if failing to connect to wsport we restart Geth:
        if( (restartGeth_counter % 6 === 0) && !initWeb3Passed){
          var wallet = ipcRenderer.sendSync("getRunningWallet");
          if(wallet){
            restartGeth(wallet, restartGeth_counter);
          } 
        }
      }
    });
  } catch (err) {
    EticaMainGUI.showGeneralError(err);
  }
}, 2000);

}

InitializeWeb3();