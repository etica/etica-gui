// In renderer process (web page).
const {ipcRenderer} = require("electron");

let EticaContractJSON = require('../EticaRelease.json');

class Blockchain {

  constructor() {
    this.txSubscribe = null;
    this.bhSubscribe = null;
    this.ETICA_ADDRESS = null;
    this.DEFAULT_TIMEOUT = 30000; // 30 seconds default timeout for web3 calls
  }

  /**
   * Wrap a promise with a timeout to prevent hanging when WebSocket disconnects.
   * @param {Promise} promise - The promise to wrap
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {string} operationName - Name of operation for error message
   * @returns {Promise} - Promise that rejects if timeout is reached
   */
  withTimeout(promise, timeoutMs, operationName = 'Operation') {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.log('[Blockchain] TIMEOUT:', operationName, 'after', timeoutMs + 'ms');
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms - Geth connection may be lost`));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.log('[Blockchain] ERROR in', operationName + ':', error.message || error);
          reject(error);
        });
    });
  }

  /**
   * Check if web3 connection is alive.
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<boolean>} - True if connected, false otherwise
   */
  async isConnected(timeoutMs = 5000) {
    try {
      await this.withTimeout(
        web3Local.eth.net.isListening(),
        timeoutMs,
        'Connection check'
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  setEticaContractAddress(_wallet) {
    if(_wallet.type == 'mainnet'){
      this.ETICA_ADDRESS = '0x34c61EA91bAcdA647269d4e310A86b875c09946f'; // // Etica mainnet smart contract
    }
    else {
      this.ETICA_ADDRESS = _wallet.contractaddress;
    }
  } 

  getEticaContractAddress() {
    return this.ETICA_ADDRESS;
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
    const ETICA_ADDRESS = this.ETICA_ADDRESS;
    let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    contract.getPastEvents('allEvents', options, function (error, block) {
      if (error) {
        clbError(error);
      } else {
        clbSuccess(block);
      }
    });
  }

  /**
   * Get past events for a range of blocks (batch fetching).
   * Returns a Promise for easier async/await usage.
   * Includes timeout to prevent hanging when Geth disconnects.
   * @param {number} fromBlock - Start block number
   * @param {number} toBlock - End block number
   * @param {number} timeoutMs - Optional timeout in milliseconds (default: 30s)
   * @returns {Promise<Array>} - Array of events
   */
  getPastEventsForRange(fromBlock, toBlock, timeoutMs = null) {
    const ETICA_ADDRESS = this.ETICA_ADDRESS;
    const timeout = timeoutMs || this.DEFAULT_TIMEOUT;
    let contract = new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    const eventsPromise = contract.getPastEvents('allEvents', {
      fromBlock: fromBlock,
      toBlock: toBlock
    });
    return this.withTimeout(eventsPromise, timeout, `getPastEvents(${fromBlock}-${toBlock})`);
  }

  /**
   * Fetch multiple blocks in parallel.
   * Includes timeout to prevent hanging when Geth disconnects.
   * @param {Array<number>} blockNumbers - Array of block numbers to fetch
   * @param {boolean} includeData - Whether to include full transaction data
   * @param {number} timeoutMs - Optional timeout in milliseconds (default: 30s)
   * @returns {Promise<Array>} - Array of block objects (in same order as input)
   */
  async getBlocksParallel(blockNumbers, includeData, timeoutMs = null) {
    const timeout = timeoutMs || this.DEFAULT_TIMEOUT;
    const promises = blockNumbers.map(blockNum =>
      web3Local.eth.getBlock(blockNum, includeData)
    );
    return this.withTimeout(Promise.all(promises), timeout, `getBlocksParallel(${blockNumbers.length} blocks)`);
  }

  /**
   * Fetch a single block as a Promise (for easier async/await).
   * Includes timeout to prevent hanging when Geth disconnects.
   * @param {number} blockNumber - Block number to fetch
   * @param {boolean} includeData - Whether to include full transaction data
   * @param {number} timeoutMs - Optional timeout in milliseconds (default: 30s)
   * @returns {Promise<Object>} - Block object
   */
  getBlockAsync(blockNumber, includeData, timeoutMs = null) {
    const timeout = timeoutMs || this.DEFAULT_TIMEOUT;
    return this.withTimeout(
      web3Local.eth.getBlock(blockNumber, includeData),
      timeout,
      `getBlock(${blockNumber})`
    );
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

  getAccounts_nocallback(timeoutMs = null) {
    const timeout = timeoutMs || this.DEFAULT_TIMEOUT;
    return this.withTimeout(
      web3Local.eth.getAccounts(),
      timeout,
      'getAccounts'
    );
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


async unlockAccounts(password, duration) {
  
    // unlock accounts
    
      web3Local.eth.getAccounts(async function (err, res) {
        if (err) {
          clbError(err);
        } else {
          for (var w = 0; w < res.length; w++) {
            const account = res[w];
            await web3Local.eth.personal.unlockAccount(account, password, duration, async function (error, result) { 
              if (error) {
                console.log("error unlocking accounts!", error);
                return false;
              }

              let isunlocked = await EticaBlockchain.isUnlocked(account);
              console.log('unlocked accounts', isunlocked);
            });
          }
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
    
    // since getAccountsData is a function called very early in init process need to set ETICA_ADDRESS if not yet
    // ETICA_ADDRESS is set by syncing.setEticaContractAddress() otherwise
    if(!this.ETICA_ADDRESS){
      let _wallet = ipcRenderer.sendSync("getRunningWallet");
      this.setEticaContractAddress(_wallet);
    }
    const ETICA_ADDRESS = this.ETICA_ADDRESS;
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
    //console.log('checking is deployed at address', address);
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
