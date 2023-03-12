// In renderer process (web page).
const {ipcRenderer} = require("electron");

let EticaContractJSON = require('../EticaRelease.json');

//const ETICA_ADDRESS = '0x34c61EA91bAcdA647269d4e310A86b875c09946f'; // mainnet
const ETICA_ADDRESS = '0x49E32a9706b5cBa3E609Cad9973c087b2E0a7BDe'; // local dev blockchain

class Blockchain {
  
  constructor() {
    this.txSubscribe = null;
    this.bhSubscribe = null;
  }

  getBlock(blockToGet, includeData, clbError, clbSuccess) {
    web3Local.eth.getBlock(blockToGet, includeData, function (error, block) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(block);
      }
    });
  }

  getPastEvents(options, clbError, clbSuccess) {
    let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    contract.getPastEvents('allEvents', options, function (error, block) {
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

  async AsyncgetAccounts() {

    async function getaccounts() {
    try {
      let _result;
      await web3Local.eth.getAccounts(function (err, res) {
        if (err) {
          _result = err;
        } else {
          _result = res;
        }
      });

      return _result;

      } catch (e) {
        console.log('AsyncgetAccounts() catched error e is:', e)
        console.error(e);
        return e;
      }

    }
    return getaccounts();

  }

  getAccounts_nocallback() {
    return web3Local.eth.getAccounts();
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

  // returns locked if account is currently locked or unlocked if it is unlocked
  async isUnlocked(fromAddress) {

    async function isunlocked() {
    try {
      let _result;
      await web3Local.eth.signTransaction({
        from: fromAddress,
        nonce: "0x1",
        gasPrice: "20000000000",
        gas: "21000",
        to: '0x3535353535353535353535353535353535353535',
        value: "1000000000000000000",
        data: ""
    }, fromAddress, function (error, result) {
        if (error) {
          _result = 'locked';
        } else {
          _result = 'unlocked';
        }
      });

      return _result;

      } catch (e) {
        console.log('isUnlocked() catched error e is:', e)
        console.error(e);
        return 'locked';
      }

    }
    return isunlocked();

  }


// returns locked if account unlocked with success or locked if failure to unlock
  async unlockAccount(password, fromAddress, duration) {

  async function unlock() {
    try {
      let _result = await web3Local.eth.personal.unlockAccount(fromAddress, password, duration, function (error, result) {

        if (error) {
          return false;
        } else {
          return result;
        }

      });

      // _result equals true if unlock success
      if(_result == true){
        return 'unlocked';
      }
      else {
        return 'locked';
      }

      } catch (e) {
        //console.log('unlockAccount() catched error e is:', e)
        //console.error(e);
        return 'locked';
      }

    }
    return unlock();

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

    var addressesnames = EticaDatabase.getAddressesNames();
    var counter = 0;

    web3Local.eth.getAccounts(function (err, res) {
      if (err) {
        clbError(err);
      } else {
        for (var i = 0; i < res.length; i++) {
          var addressName = vsprintf("Account %d", [i + 1]);
          if (addressesnames) {
            addressName = addressesnames.names[res[i]] || addressName;
          }

          var addressInfo = {};
          addressInfo.balance = 0;
          addressInfo.balance_eti = 0;
          addressInfo.address = res[i];
          addressInfo.name = addressName;
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
        if (error) {
          clbError(error);
        } else {
        rendererData.addressData[index].balance = parseFloat(web3Local.utils.fromWei(balance, "ether")).toFixed(2);
        rendererData.sumBalance = rendererData.sumBalance + parseFloat(web3Local.utils.fromWei(balance, "ether"));

        if (index < rendererData.addressData.length - 1) {
          index++;
          updateBalance(index);
        } else {
          rendererData.sumBalance = parseFloat(rendererData.sumBalance).toFixed(2);
          clbSuccess(rendererData);
        }
      }
      });
    }

    async function updateBalanceETI(index) {

      let _isEticaContractDeployed = await isEticaContractDeployed(ETICA_ADDRESS);
      
      if(_isEticaContractDeployed == '0x'){

          rendererData.addressData[index].balance_eti = 0;
          rendererData.sumBalanceEti = 0;
          
          if (index < rendererData.addressData.length - 1) {
            index++;
            updateBalanceETI(index);
          } else {
            rendererData.sumBalanceEti = parseFloat(rendererData.sumBalanceEti).toFixed(2);
            clbSuccess(rendererData);
          }

      }
      
      else {

      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let balance = await contract.methods.balanceOf(rendererData.addressData[index].address).call();

        rendererData.addressData[index].balance_eti = parseFloat(web3Local.utils.fromWei(balance, "ether")).toFixed(2);
        rendererData.sumBalanceEti = rendererData.sumBalanceEti + parseFloat(web3Local.utils.fromWei(balance, "ether"));

        if (index < rendererData.addressData.length - 1) {
          index++;
          updateBalanceETI(index);
        } else {
          rendererData.sumBalanceEti = parseFloat(rendererData.sumBalanceEti).toFixed(2);
          clbSuccess(rendererData);
        }

    }

  }


  // created for Update ETI function, checks if smart contract deployed before querying Etica smart contract to avoid issues with testnet smart contracts not deployed 
  // or smart contract not accessible at first sync
  async function isEticaContractDeployed(address) {

    let isdeployed = await web3Local.eth.getCode(address, (error, bytecode) => {
       if (error) {
         console.error(error);
       } else {
         if (bytecode === '0x') {
           return false;
         } else {
           return true;
         }
       }
     });
 
     return isdeployed;
 
   }

}

  getAddressListData(clbError, clbSuccess) {
    var rendererData = {};
    rendererData.addressData = [];

    var addressesnames = EticaDatabase.getAddressesNames();
    var counter = 0;

    web3Local.eth.getAccounts(function (err, res) {
      if (err) {
        clbError(err);
      } else {
        for (var i = 0; i < res.length; i++) {
          var addressName = vsprintf("Account %d", [i + 1]);
          if (addressesnames) {
            addressName = addressesnames.names[res[i]] || addressName;
          }

          var addressInfo = {};
          addressInfo.address = res[i];
          addressInfo.name = addressName;
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
        ipcRenderer.send("saveAccount", account);
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
