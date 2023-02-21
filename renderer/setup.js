const {ipcRenderer} = require("electron");

 $("#launchWallet").off("click").on("click", function () {
    console.log('launching Geth from setup.js');
    //EticaGeth.startGeth();
    ipcResult = ipcRenderer.send("startGeth", null);
  });