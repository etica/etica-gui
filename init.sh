#!/bin/bash
rm -rf ~/EticaDesktopWallet/.etica
echo "deleting .etica directory"
mkdir ~/EticaDesktopWallet/.etica
echo "recreating .etica directory"
cp ~/EticaDesktopWallet/needs/static-nodes.json ~/EticaDesktopWallet/.etica
echo "copy static-nodes.json to .etica directory"
needs/geth --datadir "~/EticaDesktopWallet/.etica" --networkid 61803 init needs/etica_genesis.json
echo "initialize etica blockchain on your computer"
echo "Please run 'npm start' now"

