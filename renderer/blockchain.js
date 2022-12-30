// In renderer process (web page).
const {ipcRenderer} = require("electron");

let EticaContractJSON = require('../EticaRelease.json');

//const ETICA_ADDRESS = '0x34c61EA91bAcdA647269d4e310A86b875c09946f'; // mainnet
const ETICA_ADDRESS = '0xa61B0CE4A212abdea3bA72D4681DB00e54a004C8'; // local dev blockchain

class Blockchain {
  
  constructor() {
    this.txSubscribe = null;
    this.bhSubscribe = null;
  }

  getBlock(blockToGet, options, clbError, clbSuccess) {
    web3Local.eth.getBlock(blockToGet, options, function (error, block) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(block);
      }
    });
  }

  getPastLogs(blockToGet, includeData, clbError, clbSuccess) {
    web3Local.eth.getPastLogs(blockToGet, includeData, function (error, block) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(block);
      }
    });
  }

  getAccounts(clbError, clbSuccess) {
    web3Local.eth.getAccounts(function (err, res) {
      if (err) {
        clbError(err);
      } else {
        clbSuccess(res);
      }
    });
  }

  isAddress(address) {
    return web3Local.utils.isAddress(address);
  }

  getTransaction(thxid, clbError, clbSuccess) {
    web3Local.eth.getTransaction(thxid, function (error, result) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(result);
      }
    });
  }

  getTranasctionFee(fromAddress, toAddress, value, clbError, clbSuccess) {
    web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
      if (error) {
        clbError(error);
      } else {
        var amountToSend = web3Local.utils.toWei(value, "ether"); //convert to wei value
        var RawTransaction = {
          from: fromAddress,
          to: toAddress,
          value: amountToSend,
          nonce: result
        };

        web3Local.eth.estimateGas(RawTransaction, function (error, result) {
          if (error) {
            clbError(error);
          } else {
            var usedGas = result + 1;
            web3Local.eth.getGasPrice(function (error, result) {
              if (error) {
                clbError(error);
              } else {
                clbSuccess(result * usedGas);
              }
            });
          }
        });
      }
    });
  }

  prepareTransaction(password, fromAddress, toAddress, value, clbError, clbSuccess) {
    web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
      if (error) {
        clbError("Wrong password for the selected address!");
      } else {
        web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
          if (error) {
            clbError(error);
          } else {
            var amountToSend = web3Local.utils.toWei(value, "ether"); //convert to wei value
            var RawTransaction = {
              from: fromAddress,
              to: toAddress,
              value: amountToSend,
              nonce: result
            };

            web3Local.eth.estimateGas(RawTransaction, function (error, result) {
              if (error) {
                clbError(error);
              } else {
                RawTransaction.gas = result + 1;
                web3Local.eth.getGasPrice(function (error, result) {
                  if (error) {
                    clbError(error);
                  } else {
                    RawTransaction.gasPrice = result;
                    web3Local.eth.signTransaction(RawTransaction, fromAddress, function (error, result) {
                      if (error) {
                        clbError(error);
                      } else {
                        clbSuccess(result);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  sendTransaction(rawTransaction, clbError, clbSuccess) {
    web3Local.eth.sendSignedTransaction(rawTransaction, function (error, result) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(result);
      }
    });
  }

  getAccountsData(clbError, clbSuccess) {
    var rendererData = {};
    rendererData.sumBalance = 0;
    rendererData.sumBalanceEti = 0;
    rendererData.addressData = [];

    var wallets = EticaDatatabse.getWallets();
    var counter = 0;

    web3Local.eth.getAccounts(function (err, res) {
      if (err) {
        clbError(err);
      } else {
        for (var i = 0; i < res.length; i++) {
          var walletName = vsprintf("Account %d", [i + 1]);
          if (wallets) {
            walletName = wallets.names[res[i]] || walletName;
          }

          var addressInfo = {};
          addressInfo.balance = 0;
          addressInfo.balance_eti = 0;
          addressInfo.address = res[i];
          addressInfo.name = walletName;
          rendererData.addressData.push(addressInfo);
        }

        if (rendererData.addressData.length > 0) {
          updateBalance(counter);
          updateBalanceETI(counter);
        } else {
          clbSuccess(rendererData);
        }
      }
    });

    function updateBalance(index) {
      web3Local.eth.getBalance(rendererData.addressData[index].address, function (error, balance) {
        rendererData.addressData[index].balance = parseFloat(web3Local.utils.fromWei(balance, "ether")).toFixed(2);
        rendererData.sumBalance = rendererData.sumBalance + parseFloat(web3Local.utils.fromWei(balance, "ether"));

        if (counter < rendererData.addressData.length - 1) {
          counter++;
          updateBalance(counter);
        } else {
          rendererData.sumBalance = parseFloat(rendererData.sumBalance).toFixed(2);
          clbSuccess(rendererData);
        }
      });
    }

    async function updateBalanceETI(index) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let balance = await contract.methods.balanceOf(rendererData.addressData[index].address).call();

        rendererData.addressData[index].balance_eti = parseFloat(web3Local.utils.fromWei(balance, "ether")).toFixed(2);
        rendererData.sumBalanceEti = rendererData.sumBalanceEti + parseFloat(web3Local.utils.fromWei(balance, "ether"));

        if (counter < rendererData.addressData.length - 1) {
          counter++;
          updateBalanceETI(counter);
        } else {
          rendererData.sumBalanceEti = parseFloat(rendererData.sumBalanceEti).toFixed(2);
          clbSuccess(rendererData);
        }
    }

  }

  getAddressListData(clbError, clbSuccess) {
    var rendererData = {};
    rendererData.addressData = [];

    var wallets = EticaDatatabse.getWallets();
    var counter = 0;

    web3Local.eth.getAccounts(function (err, res) {
      if (err) {
        clbError(err);
      } else {
        for (var i = 0; i < res.length; i++) {
          var walletName = vsprintf("Account %d", [i + 1]);
          if (wallets) {
            walletName = wallets.names[res[i]] || walletName;
          }

          var addressInfo = {};
          addressInfo.address = res[i];
          addressInfo.name = walletName;
          rendererData.addressData.push(addressInfo);
        }

        clbSuccess(rendererData);
      }
    });
  }

  createNewAccount(password, clbError, clbSuccess) {
    web3Local.eth.personal.newAccount(password, function (error, account) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(account);
      }
    });
  }

  importFromPrivateKey(privateKey, keyPassword, clbError, clbSuccess) {
    web3Local.eth.personal.importRawKey(privateKey, keyPassword, function (error, account) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(account);
      }
    });
  }

  subsribePendingTransactions(clbError, clbSuccess, clbData) {
    this.txSubscribe = web3Local.eth.subscribe("pendingTransactions", function (error, result) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(result);
      }
    }).on("data", function (transaction) {
      if (clbData) {
        clbData(transaction);
      }
    });
  }

  unsubsribePendingTransactions(clbError, clbSuccess) {
    if (this.txSubscribe) {
      this.txSubscribe.unsubscribe(function (error, success) {
        if (error) {
          clbError(error);
        } else {
          clbSuccess(success);
        }
      });
    }
  }

  subsribeNewBlockHeaders(clbError, clbSuccess, clbData) {
    this.bhSubscribe = web3Local.eth.subscribe("newBlockHeaders", function (error, result) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(result);
      }
    }).on("data", function (blockHeader) {
      if (clbData) {
        clbData(blockHeader);
      }
    });
  }

  unsubsribeNewBlockHeaders(clbError, clbSuccess) {
    if (this.bhSubscribe) {
      this.bhSubscribe.unsubscribe(function (error, success) {
        if (error) {
          clbError(error);
        } else {
          clbSuccess(success);
        }
      });
    }
  }

  closeConnection() {
    web3Local.currentProvider.connection.close();
  }
}

// create new blockchain variable
EticaBlockchain = new Blockchain();
