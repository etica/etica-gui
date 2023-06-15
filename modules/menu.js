const {app, Menu, ipcMain, shell} = require("electron");

/*
const template = [
  {
    label: "File",
    submenu: [
      {
        label: "Exit",
        click() {
          app.quit();
        }
      }
    ]
  }, {
    label: "Edit",
    submenu: [
      {
        role: "undo"
      }, {
        role: "redo"
      }, {
        type: "separator"
      }, {
        role: "cut"
      }, {
        role: "copy"
      }, {
        role: "paste"
      }, {
        role: "delete"
      }, {
        role: "selectall"
      }
    ]
  }, {
    label: "View",
    submenu: [
      {
        label: "Reload",
        accelerator: "CmdOrCtrl+R",
        click(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
          }
        }, {
        label: "Toggle Developer Tools",
        accelerator: process.platform === "darwin"
          ? "Alt+Command+I"
          : "Ctrl+Shift+I",
        click(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.webContents.toggleDevTools();
          }
        }, {
        type: "separator"
      }, {
        role: "resetzoom"
      }, {
        role: "zoomin"
      }, {
        role: "zoomout"
      }, {
        type: "separator"
      }, {
        role: "togglefullscreen"
      }
    ]
  }, {
    role: "window",
    submenu: [
      {
        role: "minimize"
      }, {
        role: "close"
      }
    ]
  }, {
    role: "help",
    submenu: [
      {
        label: "About the Etica wallet",
        click() {
          var infoData = {};
          infoData.version = app.getVersion();
          mainWindow.webContents.send("showAboutDialog", infoData);
        }
      }, {
        label: "Etica documentation",
        click() {
          shell.openExternal("https://www.eticaprotocol.org/");
        }
      }, {
        label: "Report issue on GitHub",
        click() {
          shell.openExternal("https://github.com/etica/etica-gui/issues");
        }
      }
    ]
  }
];
*/

const template = [];

if (process.platform === "darwin") {
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        role: "about"
      }, {
        type: "separator"
      }, {
        role: "services",
        submenu: []
      }, {
        type: "separator"
      }, {
        role: "hide"
      }, {
        role: "hideothers"
      }, {
        role: "unhide"
      }, {
        type: "separator"
      }, {
        role: "quit"
      }
    ]
  });
  // Edit menu.
  template[1].submenu.push({
    type: "separator"
  }, {
    label: "Speech",
    submenu: [
      {
        role: "startspeaking"
      }, {
        role: "stopspeaking"
      }
    ]
  });
  // Window menu.
  template[3].submenu = [
    {
      label: "Close",
      accelerator: "CmdOrCtrl+W",
      role: "close"
    }, {
      label: "Minimize",
      accelerator: "CmdOrCtrl+M",
      role: "minimize"
    }, {
      label: "Zoom",
      role: "zoom"
    }, {
      type: "separator"
    }, {
      label: "Bring All to Front",
      role: "front"
    }
  ];
}

ipcMain.on("openURL", (event, arg) => {
  shell.openExternal(arg);
});

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

