// In renderer process (web page).
const {ipcRenderer} = require("electron");

let EticaContractJSON = require('../EticaRelease.json');
//const ETICA_ADDRESS = '0x34c61EA91bAcdA647269d4e310A86b875c09946f'; // mainnet
const ETICA_ADDRESS = '0x3856a409F8B7488AFAd37A00Ee4aF876cEdAF1cF'; // local dev blockchain

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


  async prepareTransaction_SendEti(password, fromAddress, toAddress, amount, clbError, clbSuccess) {

        let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

        if(isunlocked == 'locked'){
          await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
            if (error) {
              clbError("Wrong password for the selected address!");
            }
          });
        }

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


  async prepareTransaction_StakeEti(password, fromAddress, amount, clbError, clbSuccess) {

    let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

        if(isunlocked == 'locked'){
          await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
            if (error) {
              clbError("Wrong password for the selected address!");
            }
          });
        }

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
    
    
      async prepareTransaction_createdisease(password, fromAddress, _diseasename, clbError, clbSuccess) {

        let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

        if(isunlocked == 'locked'){
          await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
            if (error) {
              clbError("Wrong password for the selected address!");
            }
          });
        }

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
      
      
        async prepareTransaction_createchunk(password, fromAddress, _diseasehash, _title, _description, clbError, clbSuccess) {
          
          let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

             if(isunlocked == 'locked'){
                await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
                if (error) {
                   clbError("Wrong password for the selected address!");
              }
              });
        }

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
      
      
        async prepareTransaction_createproposal(password, fromAddress, _diseasehash, _title, _description, raw_release_hash, _freefield, _chunkid, clbError, clbSuccess) {
          
          let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

             if(isunlocked == 'locked'){
                 await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
                 if (error) {
                    clbError("Wrong password for the selected address!");
                 }
              });
             }

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
      
      
      
         // CREATE PROPOSAL //


         //  COMMIT VOTE //

        getTranasctionFee_commitvote(fromAddress, votehash, amount, clbError, clbSuccess) {
          web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
            if (error) {
              clbError(error);
            } else {
              
            var amountToVote = web3Local.utils.toWei(amount, "ether"); //convert to wei value
              var txData = web3Local.eth.abi.encodeFunctionCall({
                name: 'commitvote',
                type: 'function',
                inputs: [,
                  {
                    type: 'uint256',
                    name: '_amount'
                  },
                  {
                    type: 'bytes32',
                    name: '_votehash'
                }
          ]
            }, [amountToVote, votehash]);
      
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
      
      
        async prepareTransaction_commitvote(password, fromAddress, votehash, amount, clbError, clbSuccess) {
          
          let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

            if(isunlocked == 'locked'){
              await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
              if (error) {
                clbError("Wrong password for the selected address!");
              }
            });
          }

              web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
                if (error) {
                  clbError(error);
                } else {
      
                  var amountToVote = web3Local.utils.toWei(amount, "ether"); //convert to wei value
                  var txData = web3Local.eth.abi.encodeFunctionCall({
                    name: 'commitvote',
                    type: 'function',
                    inputs: [{
                        type: 'uint256',
                        name: '_amount'
                      },
                      {
                        type: 'bytes32',
                        name: '_votehash'
                    }
              ]
                }, [amountToVote, votehash]);
      
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
      
      
        async prepareTransaction_revealvote(password, fromAddress, _proposed_release_hash, _approved, _vary, clbError, clbSuccess) {
          
          let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

          if(isunlocked == 'locked'){
              await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
              if (error) {
                clbError("Wrong password for the selected address!");
              }
            });
          }

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
      
      
        async prepareTransaction_claimproposal(password, fromAddress, _proposed_release_hash, clbError, clbSuccess) {
          
          let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

          if(isunlocked == 'locked'){
              await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
              if (error) {
                clbError("Wrong password for the selected address!");
              }
            });
          }

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


  async prepareTransaction_stakescsldt(password, fromAddress, _endTime, _min_limit, _maxidx, clbError, clbSuccess) {
    
              let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

              if(isunlocked == 'locked'){
                  await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
                  if (error) {
                    clbError("Wrong password for the selected address!");
                  }
                });
              }

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


  async prepareTransaction_stakesnap(password, fromAddress, stakeidx, amount, clbError, clbSuccess) {
    
    let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

      if(isunlocked == 'locked'){
        await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
        if (error) {
          clbError("Wrong password for the selected address!");
        }
      });
    }

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


  async prepareTransaction_stakeclmidx(password, fromAddress, stakeidx, clbError, clbSuccess) {
    
    let isunlocked = await EticaBlockchain.isUnlocked(fromAddress);

       if(isunlocked == 'locked'){
          await web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) { 
          if (error) {
             clbError("Wrong password for the selected address!");
          }
        });
      }

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

   // CLAIM STAKE // 




   // GETTER FUNCTIONS

   getStakesData(clbError, clbSuccess) {
    var rendererData = {};
    rendererData.sumBalance = 0;
    rendererData.sumBalanceEti = 0;
    rendererData.sumStakedEti = 0;
    rendererData.sumBlockedEti = 0;
    rendererData.sumBosoms = 0;
    rendererData.addressData = [];

    var addressesnames = EticaDatabase.getAddressesNames();
    var counter_balance = 0;
    var counter_balance_eti = 0;
    var counter_stakes = 0;
    var counter_bosoms = 0;
    var counter_blockedeticas = 0;
    

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
          addressInfo.stakesamount = 0;
          addressInfo.blockedeticas = 0;
          addressInfo.bosoms = 0;
          addressInfo.address = res[i];
          addressInfo.name = addressName;
          rendererData.addressData.push(addressInfo);
        }

        if (rendererData.addressData.length > 0) {
          updateBalance(counter_balance);
          updateBalanceETI(counter_balance_eti);
          updateStakeAmount(counter_stakes);
          updateBlockedEticas(counter_blockedeticas);
          updateBalanceBosoms(counter_bosoms);
        } else {
          clbSuccess(rendererData);
        }
      }
    });

    function updateBalance(index) {
      web3Local.eth.getBalance(rendererData.addressData[index].address, function (error, balance) {
        rendererData.addressData[index].balance = parseFloat(web3Local.utils.fromWei(balance, "ether")).toFixed(4);
        rendererData.sumBalance = rendererData.sumBalance + parseFloat(web3Local.utils.fromWei(balance, "ether"));

        if (index < rendererData.addressData.length - 1) {
          index++;
          updateBalance(index);
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

        if (index < rendererData.addressData.length - 1) {
          index++;
          updateBalanceETI(index);
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

        if (index < rendererData.addressData.length - 1) {
          index++;
          updateStakeAmount(index);
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

        if (index < rendererData.addressData.length - 1) {
          index++;
          updateBlockedEticas(index);
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

        if (index < rendererData.addressData.length - 1) {
          index++;
          updateBalanceBosoms(index);
        } else {
          rendererData.sumBosoms = parseFloat(rendererData.sumBosoms).toFixed(4);
          clbSuccess(rendererData);
        }
    }

  }



  async getStakesBoardBalancesofAddress(address) {
    
         var addressesnames = EticaDatabase.getAddressesNames();
         var addressName = "";
          if (addressesnames) {
            addressName = addressesnames.names[address] || addressName;
          }

          var addressInfo = {};
          addressInfo.addressbalance = await _getBalance(address);
          addressInfo.addressbalance_eti = await _getBalanceETI(address);
          addressInfo.addressstakesamount = await _getStakeAmount(address);
          addressInfo.addressblockedeticas = await _getBlockedEticas(address);
          addressInfo.addressbosoms = await _getBalanceBosoms(address);
          addressInfo.address = address;
          addressInfo.name = addressName;

          return addressInfo;
    
    async function _getBalance(address) {

              let amount = await web3Local.eth.getBalance(address);
      
              return parseFloat(web3Local.utils.fromWei(amount, "ether")).toFixed(4);
    }
    
    
    async function _getBalanceETI(address) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let amount = await contract.methods.balanceOf(address).call();

        return parseFloat(web3Local.utils.fromWei(amount, "ether")).toFixed(4);
    }
    
    
    async function _getStakeAmount(address) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let amount = await contract.methods.stakesAmount(address).call();

        return parseFloat(web3Local.utils.fromWei(amount, "ether")).toFixed(4);
    }

    async function _getBlockedEticas(address) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let amount = await contract.methods.blockedeticas(address).call();

        return parseFloat(web3Local.utils.fromWei(amount, "ether")).toFixed(4);
    }

    async function _getBalanceBosoms(address) {
      let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let amount = await contract.methods.bosoms(address).call();

        return parseFloat(web3Local.utils.fromWei(amount, "ether")).toFixed(4);
    }

  }



  async getStakesofAddress(address) {
    
     var addressStakes = {};
     let stakescounter = await getStakesCounters(address);
     addressStakes.stakes = await getStakes(address, stakescounter);
     addressStakes.stakescounter = stakescounter;
     return addressStakes;   

     async function getStakesCounters(address) {

         let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
         let _stakescounter =  await contract.methods.stakesCounters(address).call();

         return _stakescounter;
    }


    async function getStakes(_address, _stakescounter) {

         let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
         let address_stakes = [];
         let onestake;

         for(let i =1;i<= _stakescounter;i++){
             onestake = await contract.methods.stakes(_address, i).call();
             address_stakes.push(onestake);
        }

         return address_stakes;
    }

}



  async testgetProposal(clbError, clbSuccess) {

    let datas ={};
    let prophash = await getProposaltest();
    let prophash2 = await getProposaltest2();
    let diseasehash1 = await getDiseasetest1();
    let diseasehash2 = await getDiseasetest2();
    datas.diseasehash1 = diseasehash1;
    datas.diseasehash2 = diseasehash2;
    datas.prophash = prophash;
    datas.prophash2 = prophash2;
    datas.diseasehash2 = diseasehash2;
    clbSuccess(datas);

  async function getProposaltest() {
    let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let proposalhash = await contract.methods.diseaseproposals('0xf6d8716087544b8fe1a306611913078dd677450d90295497e433503483ffea6e',1).call();
      return proposalhash;
  }
  async function getProposaltest2() {
    let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let proposalhash = await contract.methods.diseaseproposals('0x569e75fc77c1a856f6daaf9e69d8a9566ca34aa47f9133711ce065a571af0cfd',1).call();
      return proposalhash;
  }
  async function getDiseasetest1() {
    let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let diseasehash = await contract.methods.getdiseasehashbyName('Disease Test').call();
      return diseasehash;
  }
  async function getDiseasetest2() {
    let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
      let diseasehash = await contract.methods.getdiseasehashbyName('').call();
      return diseasehash;
  }

}



async diseasesbyIds(_hash) {


  async function callwithlogerrors() {
  try {
  let diseaseindex = await diseasesbyIds(_hash);
  return diseaseindex;
  } catch (e) {
    console.log('diseasesbyIds() error e is:', e)
    console.error(e);
    return e;
  }
}

async function diseasesbyIds(_diseasehash) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _diseaseindex = await contract.methods.diseasesbyIds(_diseasehash).call();
    return _diseaseindex;
}

return callwithlogerrors();

}

//returns whole disease object from global index, returns 0 if disease doesnt exists:
async diseases(_index) {

  let disease = await diseases(_index);
  return disease;

async function diseases(_diseaseindex) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _disease = await contract.methods.diseases(_diseaseindex).call();
    return _disease;
}

}


//returns whole chunk object from global index, returns 0 if disease doesnt exists:
async chunks(_index) {

  let chunk = await chunks(_index);
  return chunk;

async function chunks(_chunkindex) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _chunk = await contract.methods.chunks(_chunkindex).call();
    return _chunk;
}

}

async diseaseproposals(_hash, _index) {

  let _diseaseproposals = await getDiseaseProposals(_hash, _index);
  return _diseaseproposals;

  async function getDiseaseProposals(_diseasehash, _proposalindex) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _proposal = await contract.methods.diseaseproposals(_diseasehash, _proposalindex).call();
    return _proposal;
}

}


async diseaseProposalsCounter(_hash) {

  let _diseasenbproposals = await diseaseProposalsCounter(_hash);
  return _diseasenbproposals;

  async function diseaseProposalsCounter(_diseasehash) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _nbproposal = await contract.methods.diseaseProposalsCounter(_diseasehash).call();
    return _nbproposal;
}

}

async diseaseChunksCounter(_hash) {

  let _diseasenbchunks = await diseaseChunksCounter(_hash);
  return _diseasenbchunks;

  async function diseaseChunksCounter(_diseasehash) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _nbchunk = await contract.methods.diseaseChunksCounter(_diseasehash).call();
    return _nbchunk;
}

}

async getdiseasehashbyName(_name) {

  let diseasehash = await getdiseasehashbyName(_name);
  return diseasehash;

  async function getdiseasehashbyName(_diseasename) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _diseasehash = await contract.methods.getdiseasehashbyName(_diseasename).call();
    return _diseasehash;
}

}


async proposals(_hash) {

  let proposal = await proposals(_hash);
  return proposal;

async function proposals(_proposalhash) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _proposal = await contract.methods.proposals(_proposalhash).call();
    return _proposal;
}

}

async propsdatas(_hash) {

  let propopsaldata = await propsdatas(_hash);
  return propopsaldata;

async function propsdatas(_proposalhash) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let proposaldata = await contract.methods.propsdatas(_proposalhash).call();
    return proposaldata;
}

}

async getdiseasehashbyName(_name) {

  let diseasehash = await getdiseasehashbyName(_name);
  return diseasehash;

async function getdiseasehashbyName(_name) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _diseasehash = await contract.methods.getdiseasehashbyName(_name).call();
    return _diseasehash;
}

}


async periods(_id) {

  let period = await periods(_id);
  return period;

async function periods(periodid) {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _period = await contract.methods.periods(periodid).call();
    return _period;
}

}


async DEFAULT_REVEALING_TIME() {

  let _revealingduration = await revealingduration();
  return _revealingduration;

async function revealingduration() {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _duration = await contract.methods.DEFAULT_REVEALING_TIME().call();
    return _duration;
}

}

async DEFAULT_VOTING_TIME() {

  let _votingduration = await votingduration();
  return _votingduration;

async function votingduration() {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _duration = await contract.methods.DEFAULT_VOTING_TIME().call();
    return _duration;
}

}


async REWARD_INTERVAL() {

  let _intervalduration = await intervalduration();
  return _intervalduration;

async function intervalduration() {
  let contract =  new web3Local.eth.Contract(EticaContractJSON.abi, ETICA_ADDRESS);
    let _duration = await contract.methods.REWARD_INTERVAL().call();
    return _duration;
}

}




   // GETTER FUNCTIONS



}

// create new contract variable
EticaContract = new SmartContract();
