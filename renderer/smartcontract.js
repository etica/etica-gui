// In renderer process (web page).
const {ipcRenderer} = require("electron");

let EticaContractJSON = require('../EticaRelease.json');
//const ETICA_ADDRESS = '0x34c61EA91bAcdA647269d4e310A86b875c09946f'; // mainnet
const ETICA_ADDRESS = '0xa61B0CE4A212abdea3bA72D4681DB00e54a004C8'; // local dev blockchain

class SmartContract {
  constructor() {
  }

  getEticaContract()
  {
    var contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    return contract;
  } 


  isAddress(address) {
    return web3Local.utils.isAddress(address);
  }



  getStakesData(clbError, clbSuccess) {
    var rendererData = {};
    rendererData.sumBalance = 0;
    rendererData.sumBalanceEti = 0;
    rendererData.sumStakedEti = 0;
    rendererData.sumBlockedEti = 0;
    rendererData.sumBosoms = 0;
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
          addressInfo.stakesamount = 0;
          addressInfo.blockedeticas = 0;
          addressInfo.bosoms = 0;
          addressInfo.address = res[i];
          addressInfo.name = walletName;
          rendererData.addressData.push(addressInfo);
        }

        if (rendererData.addressData.length > 0) {
          updateBalance(counter);
          updateBalanceETI(counter);
          updateStakeAmount(counter);
          updateBlockedEticas(counter);
          updateBalanceBosoms(counter);
        } else {
          clbSuccess(rendererData);
        }
      }
    });

    function updateBalance(index) {
      web3Local.eth.getBalance(rendererData.addressData[index].address, function (error, balance) {
        rendererData.addressData[index].balance = parseFloat(web3Local.utils.fromWei(balance, "ether")).toFixed(4);
        rendererData.sumBalance = rendererData.sumBalance + parseFloat(web3Local.utils.fromWei(balance, "ether"));

        if (counter < rendererData.addressData.length - 1) {
          counter++;
          updateBalance(counter);
        } else {
          rendererData.sumBalance = parseFloat(rendererData.sumBalance).toFixed(4);
          clbSuccess(rendererData);
        }
      });
    }

    async function updateBalanceETI(index) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let balance = await contract.methods.balanceOf(rendererData.addressData[index].address).call();

        rendererData.addressData[index].balance_eti = parseFloat(web3Local.utils.fromWei(balance, "ether")).toFixed(4);
        rendererData.sumBalanceEti = rendererData.sumBalanceEti + parseFloat(web3Local.utils.fromWei(balance, "ether"));

        if (counter < rendererData.addressData.length - 1) {
          counter++;
          updateBalanceETI(counter);
        } else {
          rendererData.sumBalanceEti = parseFloat(rendererData.sumBalanceEti).toFixed(2);
          clbSuccess(rendererData);
        }
    }

    async function updateStakeAmount(index) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let amount = await contract.methods.stakesAmount(rendererData.addressData[index].address).call();

        rendererData.addressData[index].stakesamount = parseFloat(web3Local.utils.fromWei(amount, "ether")).toFixed(4);
        rendererData.sumStakedEti = rendererData.sumStakedEti + parseFloat(web3Local.utils.fromWei(amount, "ether"));

        if (counter < rendererData.addressData.length - 1) {
          counter++;
          updateStakeAmount(counter);
        } else {
          rendererData.sumStakedEti = parseFloat(rendererData.sumStakedEti).toFixed(2);
          clbSuccess(rendererData);
        }
    }

    async function updateBlockedEticas(index) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let amount = await contract.methods.blockedeticas(rendererData.addressData[index].address).call();

        rendererData.addressData[index].blockedeticas = parseFloat(web3Local.utils.fromWei(amount, "ether")).toFixed(4);
        rendererData.sumBlockedEti = rendererData.sumBlockedEti + parseFloat(web3Local.utils.fromWei(amount, "ether"));

        if (counter < rendererData.addressData.length - 1) {
          counter++;
          updateBlockedEticas(counter);
        } else {
          rendererData.sumBlockedEti = parseFloat(rendererData.sumBlockedEti).toFixed(4);
          clbSuccess(rendererData);
        }
    }

    async function updateBalanceBosoms(index) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let amount = await contract.methods.bosoms(rendererData.addressData[index].address).call();

        rendererData.addressData[index].bosoms = parseFloat(web3Local.utils.fromWei(amount, "ether")).toFixed(4);
        rendererData.sumBosoms = rendererData.sumBosoms + parseFloat(web3Local.utils.fromWei(amount, "ether"));

        if (counter < rendererData.addressData.length - 1) {
          counter++;
          updateBalanceBosoms(counter);
        } else {
          rendererData.sumBosoms = parseFloat(rendererData.sumBosoms).toFixed(4);
          clbSuccess(rendererData);
        }
    }

  }



  stakesAmount(fromAddress, clbError, clbSuccess) {

  let _stakesAmount = get_stakesAmount(fromAddress);
  clbSuccess(_stakesAmount);

  async function get_stakesAmount(fromAddress) {
          let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
          let amount = await contract.methods.stakesAmount(fromAddress).call();
          return amount;
      }

  }


  balanceEti(fromAddress) {

    let _balanceEti = get_balanceEti(fromAddress);
    return _balanceEti;
  
    async function get_balanceEti(fromAddress) {
            let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
            let amount = await contract.methods.balanceOf(fromAddress).call();
            return amount;
        }
  
    }


  getTranasctionFee_sendEti(fromAddress, toAddress, amount, clbError, clbSuccess) {
    web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
      if (error) {
        clbError(error);
      } else {
        
        toAddress = toAddress.toLowerCase(); // make sure toAddress is in lower case to avoid invalid type address error in txData object:
        var amountToSend = web3Local.utils.toWei(amount, "ether"); //convert to wei value
        var txData = web3Local.eth.abi.encodeFunctionCall({
          name: 'transfer',
          type: 'function',
          inputs: [{
              type: 'address',
              name: 'address'
          },
          {
              type: 'uint256',
              name: 'amount'
          }]
      }, [toAddress, amountToSend ]);

        var RawTransaction = {
          from: fromAddress,
          to: ETICA_ADDRESS,
          value: 0,
          nonce: result,
          data: txData
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


  prepareTransaction_SendEti(password, fromAddress, toAddress, amount, clbError, clbSuccess) {
    web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
      if (error) {
        clbError("Wrong password for the selected address!");
      } else {
        web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
          if (error) {
            clbError(error);
          } else {

            toAddress = toAddress.toLowerCase(); // make sure toAddress is in lower case to avoid invalid type address error in txData object:
            var amountToSend = web3Local.utils.toWei(amount, "ether"); //convert to wei value
            var txData = web3Local.eth.abi.encodeFunctionCall({
              name: 'transfer',
              type: 'function',
              inputs: [{
                  type: 'address',
                  name: 'address'
              },
              {
                  type: 'uint256',
                  name: 'amount'
              }]
          }, [toAddress, amountToSend ]);

            var RawTransaction = {
              from: fromAddress,
              to: ETICA_ADDRESS,
              value: 0,
              nonce: result,
              data: txData
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

   // SEND ETI //


   // STAKE ETI //

   getTranasctionFee_stakeEti(fromAddress, amount, clbError, clbSuccess) {
    web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
      if (error) {
        clbError(error);
      } else {
        
        var fromAddress_lowercase = fromAddress.toLowerCase(); // make sure fromAddress is in lower case to avoid invalid type address error in txData object:
        var amountToStake = web3Local.utils.toWei(amount, "ether"); //convert to wei value
        var txData = web3Local.eth.abi.encodeFunctionCall({
          name: 'eticatobosoms',
          type: 'function',
          inputs: [{
              type: 'address',
              name: 'address'
          },
          {
              type: 'uint256',
              name: 'amount'
          }]
      }, [fromAddress_lowercase, amountToStake ]);

        var RawTransaction = {
          from: fromAddress,
          to: ETICA_ADDRESS,
          value: 0,
          nonce: result,
          data: txData
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


  prepareTransaction_StakeEti(password, fromAddress, amount, clbError, clbSuccess) {
    web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
      if (error) {
        clbError("Wrong password for the selected address!");
      } else {
        web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
          if (error) {
            clbError(error);
          } else {

            var fromAddress_lowercase = fromAddress.toLowerCase(); // make sure fromAddress_lowercase is in lower case to avoid invalid type address error in txData object:
            var amountToSend = web3Local.utils.toWei(amount, "ether"); //convert to wei value
            var txData = web3Local.eth.abi.encodeFunctionCall({
              name: 'eticatobosoms',
              type: 'function',
              inputs: [{
                  type: 'address',
                  name: 'address'
              },
              {
                  type: 'uint256',
                  name: 'amount'
              }]
          }, [fromAddress_lowercase, amountToSend ]);

            var RawTransaction = {
              from: fromAddress,
              to: ETICA_ADDRESS,
              value: 0,
              nonce: result,
              data: txData
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



   // STAKE ETI //



      //  CREATE DISEASE //

      getTranasctionFee_createdisease(fromAddress, _diseasename, clbError, clbSuccess) {
        console.log('in getTranasctionFee_createdisease()');
        console.log('getTranasctionFee_createdisease() fromAddress is ', fromAddress);
        console.log('getTranasctionFee_createdisease() _diseasename is ', _diseasename);
        web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
          if (error) {
            clbError(error);
          } else {
            
            var txData = web3Local.eth.abi.encodeFunctionCall({
              name: 'createdisease',
              type: 'function',
              inputs: [{
                  type: 'string',
                  name: 'name'
              }]
          }, [_diseasename]);
    
            var RawTransaction = {
              from: fromAddress,
              to: ETICA_ADDRESS,
              value: 0,
              nonce: result,
              data: txData
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
    
    
      prepareTransaction_createdisease(password, fromAddress, _diseasename, clbError, clbSuccess) {
        web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
          if (error) {
            clbError("Wrong password for the selected address!");
          } else {
            web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
              if (error) {
                clbError(error);
              } else {
    
                var txData = web3Local.eth.abi.encodeFunctionCall({
                  name: 'createdisease',
                  type: 'function',
                  inputs: [{
                      type: 'string',
                      name: 'name'
                  }]
              }, [_diseasename]);
    
                var RawTransaction = {
                  from: fromAddress,
                  to: ETICA_ADDRESS,
                  value: 0,
                  nonce: result,
                  data: txData
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
    
    
    
       // CREATE DISEASE //
  

        //  CREATE CHUNK //

        getTranasctionFee_createchunk(fromAddress, _diseasehash, _title, _description, clbError, clbSuccess) {
          web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
            if (error) {
              clbError(error);
            } else {
              
              var txData = web3Local.eth.abi.encodeFunctionCall({
                name: 'createchunk',
                type: 'function',
                inputs: [{
                    type: 'bytes32',
                    name: 'diseasehash'
                },
                {
                  type: 'string',
                  name: 'title'
              },
              {
                type: 'string',
                name: 'description'
            }]
            }, [_diseasehash, _title, _description]);
      
              var RawTransaction = {
                from: fromAddress,
                to: ETICA_ADDRESS,
                value: 0,
                nonce: result,
                data: txData
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
      
      
        prepareTransaction_createchunk(password, fromAddress, _diseasehash, _title, _description, clbError, clbSuccess) {
          web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
            if (error) {
              clbError("Wrong password for the selected address!");
            } else {
              web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
                if (error) {
                  clbError(error);
                } else {
      
                  var txData = web3Local.eth.abi.encodeFunctionCall({
                    name: 'createchunk',
                type: 'function',
                inputs: [{
                    type: 'bytes32',
                    name: 'diseasehash'
                },
                {
                  type: 'string',
                  name: 'title'
                },
                {
                type: 'string',
                name: 'description'
                }]
                }, [_diseasehash, _title, _description]);
      
                  var RawTransaction = {
                    from: fromAddress,
                    to: ETICA_ADDRESS,
                    value: 0,
                    nonce: result,
                    data: txData
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
      
      
      
         // CREATE CHUNK //



        //  CREATE PROPOSAL //

        getTranasctionFee_createproposal(fromAddress, _diseasehash, _title, _description, raw_release_hash, _freefield, _chunkid, clbError, clbSuccess) {
          web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
            if (error) {
              clbError(error);
            } else {
              
              var txData = web3Local.eth.abi.encodeFunctionCall({
                name: 'propose',
                type: 'function',
                inputs: [{
                    type: 'bytes32',
                    name: 'diseasehash'
                },
                {
                  type: 'string',
                  name: 'title'
              },
              {
                type: 'string',
                name: 'description'
              },
              {
                type: 'string',
                name: 'raw_release_hash'
              },
              {
                type: 'string',
                name: 'freefield'
              },
              {
                type: 'uint256',
                name: 'chunkid'
              }
          ]
            }, [_diseasehash, _title, _description, raw_release_hash, _freefield, _chunkid]);
      
              var RawTransaction = {
                from: fromAddress,
                to: ETICA_ADDRESS,
                value: 0,
                nonce: result,
                data: txData
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
      
      
        prepareTransaction_createproposal(password, fromAddress, _diseasehash, _title, _description, raw_release_hash, _freefield, _chunkid, clbError, clbSuccess) {
          web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
            if (error) {
              clbError("Wrong password for the selected address!");
            } else {
              web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
                if (error) {
                  clbError(error);
                } else {
      
                  var txData = web3Local.eth.abi.encodeFunctionCall({
                    name: 'propose',
                type: 'function',
                inputs: [{
                  type: 'bytes32',
                  name: 'diseasehash'
              },
              {
                type: 'string',
                name: 'title'
            },
            {
              type: 'string',
              name: 'description'
            },
            {
              type: 'string',
              name: 'raw_release_hash'
            },
            {
              type: 'string',
              name: 'freefield'
            },
            {
              type: 'uint256',
              name: 'chunkid'
            }]
                }, [_diseasehash, _title, _description, raw_release_hash, _freefield, _chunkid]);
      
                  var RawTransaction = {
                    from: fromAddress,
                    to: ETICA_ADDRESS,
                    value: 0,
                    nonce: result,
                    data: txData
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
      
      
      
         // CREATE PROPOSAL //


         //  COMMIT VOTE //

        getTranasctionFee_commitvote(fromAddress, _votehash, amount, clbError, clbSuccess) {
          web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
            if (error) {
              clbError(error);
            } else {
              
            var amountToVote = web3Local.utils.toWei(amount, "ether"); //convert to wei value
              var txData = web3Local.eth.abi.encodeFunctionCall({
                name: 'commitvote',
                type: 'function',
                inputs: [{
                    type: 'bytes32',
                    name: 'votehash'
                },
                {
                  type: 'uint256',
                  name: 'amount'
                }
          ]
            }, [_votehash, amountToVote]);
      
              var RawTransaction = {
                from: fromAddress,
                to: ETICA_ADDRESS,
                value: 0,
                nonce: result,
                data: txData
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
      
      
        prepareTransaction_commitvote(password, fromAddress, _votehash, amount, clbError, clbSuccess) {
          web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
            if (error) {
              clbError("Wrong password for the selected address!");
            } else {
              web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
                if (error) {
                  clbError(error);
                } else {
      
                  var amountToVote = web3Local.utils.toWei(amount, "ether"); //convert to wei value
                  var txData = web3Local.eth.abi.encodeFunctionCall({
                    name: 'commitvote',
                    type: 'function',
                    inputs: [{
                        type: 'bytes32',
                        name: 'votehash'
                    },
                    {
                      type: 'uint256',
                      name: 'amount'
                    }
              ]
                }, [_votehash, amountToVote]);
      
                  var RawTransaction = {
                    from: fromAddress,
                    to: ETICA_ADDRESS,
                    value: 0,
                    nonce: result,
                    data: txData
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
      
         // COMMIT VOTE //

         //  REVEAL VOTE //

        getTranasctionFee_revealvote(fromAddress, _proposed_release_hash, _approved, _vary, clbError, clbSuccess) {
          web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
            if (error) {
              clbError(error);
            } else {

              var txData = web3Local.eth.abi.encodeFunctionCall({
                name: 'revealvote',
                type: 'function',
                inputs: [{
                    type: 'bytes32',
                    name: '_proposed_release_hash'
                },
                {
                  type: 'bool',
                  name: '_approved'
                },
                {
                  type: 'string',
                  name: '_vary'
                }
            ]
            }, [_proposed_release_hash, _approved, _vary]);
      
              var RawTransaction = {
                from: fromAddress,
                to: ETICA_ADDRESS,
                value: 0,
                nonce: result,
                data: txData
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
      
      
        prepareTransaction_revealvote(password, fromAddress, _proposed_release_hash, _approved, _vary, clbError, clbSuccess) {
          web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
            if (error) {
              clbError("Wrong password for the selected address!");
            } else {
              web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
                if (error) {
                  clbError(error);
                } else {
      
                var txData = web3Local.eth.abi.encodeFunctionCall({
                    name: 'revealvote',
                type: 'function',
                inputs: [{
                    type: 'bytes32',
                    name: '_proposed_release_hash'
                },
                {
                  type: 'bool',
                  name: '_approved'
                },
                {
                  type: 'string',
                  name: '_vary'
                }
                ]
                }, [_proposed_release_hash, _approved, _vary]);
      
                  var RawTransaction = {
                    from: fromAddress,
                    to: ETICA_ADDRESS,
                    value: 0,
                    nonce: result,
                    data: txData
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
      
         // REVEAL VOTE //


         //  CLAIM PROPOSAL //

        getTranasctionFee_claimproposal(fromAddress, _proposed_release_hash, clbError, clbSuccess) {
          web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
            if (error) {
              clbError(error);
            } else {

              var txData = web3Local.eth.abi.encodeFunctionCall({
                name: 'clmpropbyhash',
                type: 'function',
                inputs: [{
                    type: 'bytes32',
                    name: '_proposed_release_hash'
                }
            ]
            }, [_proposed_release_hash]);
      
              var RawTransaction = {
                from: fromAddress,
                to: ETICA_ADDRESS,
                value: 0,
                nonce: result,
                data: txData
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
      
      
        prepareTransaction_claimproposal(password, fromAddress, _proposed_release_hash, clbError, clbSuccess) {
          web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
            if (error) {
              clbError("Wrong password for the selected address!");
            } else {
              web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
                if (error) {
                  clbError(error);
                } else {
      
                var txData = web3Local.eth.abi.encodeFunctionCall({
                  name: 'clmpropbyhash',
                  type: 'function',
                  inputs: [{
                      type: 'bytes32',
                      name: '_proposed_release_hash'
                  }
                  ]
                }, [_proposed_release_hash]);
      
                  var RawTransaction = {
                    from: fromAddress,
                    to: ETICA_ADDRESS,
                    value: 0,
                    nonce: result,
                    data: txData
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
      
         // CLAIM PROPOSAL //


        //  CONSOLIDATE STAKE //

   getTranasctionFee_stakescsldt(fromAddress, _endTime, _min_limit, _maxidx, clbError, clbSuccess) {
    web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
      if (error) {
        clbError(error);
      } else {
        
        var txData = web3Local.eth.abi.encodeFunctionCall({
          name: 'stakescsldt',
          type: 'function',
          inputs: [{
              type: 'uint256',
              name: '_endTime'
          },
          {
            type: 'uint256',
            name: '_min_limit'
         },
         {
          type: 'uint256',
          name: '_maxidx'
         }]
      }, [_endTime, _min_limit, _maxidx]);

        var RawTransaction = {
          from: fromAddress,
          to: ETICA_ADDRESS,
          value: 0,
          nonce: result,
          data: txData
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


  prepareTransaction_stakescsldt(password, fromAddress, _endTime, _min_limit, _maxidx, clbError, clbSuccess) {
    web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
      if (error) {
        clbError("Wrong password for the selected address!");
      } else {
        web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
          if (error) {
            clbError(error);
          } else {

            var txData = web3Local.eth.abi.encodeFunctionCall({
              name: 'stakescsldt',
              type: 'function',
              inputs: [{
               type: 'uint256',
               name: '_endTime'
              },
            {
             type: 'uint256',
             name: '_min_limit'
            },
            {
             type: 'uint256',
             name: '_maxidx'
            }]
          }, [_endTime, _min_limit, _maxidx]);

            var RawTransaction = {
              from: fromAddress,
              to: ETICA_ADDRESS,
              value: 0,
              nonce: result,
              data: txData
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



   // CONSOLIDATE STAKE // 

   //  SNAP STAKE //

   getTranasctionFee_stakesnap(fromAddress, stakeidx, amount, clbError, clbSuccess) {
    web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
      if (error) {
        clbError(error);
      } else {
        
        var amountToSnap = web3Local.utils.toWei(amount, "ether"); //convert to wei value
        var txData = web3Local.eth.abi.encodeFunctionCall({
          name: 'stakesnap',
          type: 'function',
          inputs: [{
              type: 'uint256',
              name: '_stakeidx'
          },
          {
            type: 'uint256',
            name: '_snapamount'
         }]
      }, [stakeidx, amountToSnap]);

        var RawTransaction = {
          from: fromAddress,
          to: ETICA_ADDRESS,
          value: 0,
          nonce: result,
          data: txData
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


  prepareTransaction_stakesnap(password, fromAddress, stakeidx, amount, clbError, clbSuccess) {
    web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
      if (error) {
        clbError("Wrong password for the selected address!");
      } else {
        web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
          if (error) {
            clbError(error);
          } else {

            var amountToSnap = web3Local.utils.toWei(amount, "ether"); //convert to wei value
            var txData = web3Local.eth.abi.encodeFunctionCall({
              name: 'stakesnap',
              type: 'function',
              inputs: [{
                type: 'uint256',
                name: '_stakeidx'
              },
              {
                type: 'uint256',
                name: '_snapamount'
              }]
          }, [stakeidx, amountToSnap]);

            var RawTransaction = {
              from: fromAddress,
              to: ETICA_ADDRESS,
              value: 0,
              nonce: result,
              data: txData
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

   // SNAP STAKE // 


   //  CLAIM STAKE //

   getTranasctionFee_stakeclmidx(fromAddress, stakeidx, clbError, clbSuccess) {
    web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
      if (error) {
        clbError(error);
      } else {
        
        var txData = web3Local.eth.abi.encodeFunctionCall({
          name: 'stakeclmidx',
          type: 'function',
          inputs: [{
              type: 'uint256',
              name: '_stakeidx'
          }]
      }, [stakeidx]);

        var RawTransaction = {
          from: fromAddress,
          to: ETICA_ADDRESS,
          value: 0,
          nonce: result,
          data: txData
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


  prepareTransaction_stakeclmidx(password, fromAddress, stakeidx, clbError, clbSuccess) {
    web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
      if (error) {
        clbError("Wrong password for the selected address!");
      } else {
        web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
          if (error) {
            clbError(error);
          } else {

            var txData = web3Local.eth.abi.encodeFunctionCall({
              name: 'stakeclmidx',
              type: 'function',
              inputs: [{
                type: 'uint256',
                name: '_stakeidx'
              }]
          }, [stakeidx]);

            var RawTransaction = {
              from: fromAddress,
              to: ETICA_ADDRESS,
              value: 0,
              nonce: result,
              data: txData
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

   // CLAIM STAKE // 



}

// create new contract variable
EticaContract = new SmartContract();
