const {ipcMain, BrowserWindow} = require("electron");

// reloadhandler system was implemented to handle rare casees when wallet fails to open index.html on connexion which happens sometimes on computers with hardware limits

var _reload = false;

ipcMain.on("SetReloadWindowsOn", (event, arg) => {
 console.log('connecting, set reload windows on');
  _reload = true;

  setTimeout(() => {
    checkwindow();
  }, 5500);

});

ipcMain.on("SetReloadWindowsOff", (event, arg) => {
  console.log('connexion success, set reload windows off');
  _reload = false;

});


function checkwindow(){
  const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (focusedWindow) {
    reloadWindows();
  }
}



function reloadWindows(){
  if (_reload == true){
  
  const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (focusedWindow) {
      focusedWindow.webContents.reload();
  }

  // in case the blank screen issue on connexion happens in a row, redo the process:
  setTimeout(() => {
    checkwindow();
  }, 5500);

  }
}