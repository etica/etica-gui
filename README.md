# Etica Desktop Wallet

**Clone and run to see it in action.**

This is a desktop wallet for [EticaProtocol](https://www.eticaprotocol.org/) project. It supports both ETI and EGAZ.
The wallet allows to:  
-> create new accounts, export and import accounts  
-> send and receive EGAZ  
-> send and receive ETI  
-> interact with Etica smart contract (make proposals, vote...)  
-> keep track of accounts' addresses votes and alert when a vote must be revealed to avoid losing ETI  

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/etica/etica-gui.git
# Go into the repository
cd etica-gui
# Install dependencies
npm install
# create .etica directory
mkdir .etica
# copy enodes default list on .etica directory
cp needs/static-nodes.json .etica/
# initiate Blockchain with etica_genesis.json (windows)
./bin/win/geth --datadir ".etica" --networkid 61803 init needs/etica_genesis.json
# initiate Blockchain with etica_genesis.json (linux)
./bin/linux/geth --datadir ".etica" --networkid 61803 init needs/etica_genesis.json
# initiate Blockchain with etica_genesis.json (macos)
./bin/macos/geth --datadir ".etica" --networkid 61803 init needs/etica_genesis.json

# Run the app
npm start
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

## Resources for Learning Electron

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
