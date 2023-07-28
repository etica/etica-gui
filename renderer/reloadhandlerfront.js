// In renderer process (web page).
const {ipcRenderer} = require("electron");

// reloadhandler system was implemented to handle rare casees when wallet fails to open index.html on connexion which happens sometimes on computers with hardware limits


class HandlerReload {
  
  constructor() {

  }

  SetReloadWindowOff() {

    ipcRenderer.send("SetReloadWindowsOff"); // will reload page from reloadshandler.js in case of blank page error (only hhappens rare times on computers with hardware limits)

  } 

  SetReloadWindowOn() {

    ipcRenderer.send("SetReloadWindowsOn"); // will reload page from reloadshandler.js in case of blank page error (only hhappens rare times on computers with hardware limits)

  } 

}

// create new blockchain variable
ReloadHandler = new HandlerReload();
