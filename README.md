# Etica GUI

**Clone and run to see it in action.**

GUI desktop wallet for [EticaProtocol](https://www.eticaprotocol.org/)

## To Use

**OS**
Linux and Windows
(no tests on Mac yet)


DOWNLOAD THE COMPILED WALLET AND LAUNCH IT RIGHT AWAY

Download the compiled wallet. This is the compiled version of the wallet that has already been packaged and is ready to use.

Windows: Download Windows-eticawallet-1.0.2.zip file in section bottom (1.0.2 should be replaced by latest version number)
Linux: No pre compiled wallet for linux yet (coming soon)

OR

FROM SOURCE CODE:

INSTALL FROM SOURCE CODE:
Windows
```bash
# Clone this repository
git clone https://github.com/etica/etica-gui.git`
# Go into the repository
cd etica-gui/
# Install dependencies
npm install

# For windows, before launching wallet you need to unzip the geth.exe file in /bin/win/geth-unzip-in-this-folder

# Launch wallet
npm start
```

Linux:
```bash
# Clone this repository
$ git clone https://github.com/etica/etica-gui.git
# Go into the repository
$ cd etica-gui/
# Install npm
$ sudo apt-get install npm
# Install dependencies
$ sudo npm install
# Launch wallet
$ npm start
```
Linux installation help guide: https://github.com/gemandmining/eticalinuxwallet/wiki

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.


Optional (Build executable launch files for your wallet)
Once you have installed Etica Wallet from source code, you can generate your wallet executable with following commands:
Windows
```bash
# Generate executable:
npm run dist-win
```

Linux
```bash
# Generate executable:
npm run dist-linux
```


## Sortcuts
Open dev tools: Ctrl + MAJ + I
Reload current page: Ctrl + R 



## License

[CC0 1.0 (Public Domain)](LICENSE.md)
