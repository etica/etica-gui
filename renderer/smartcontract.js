// In renderer process (web page).
const {ipcRenderer} = require("electron");

let EticaContractJSON = require('../EticaRelease.json');
const ETICA_ADDRESS = '0x34c61EA91bAcdA647269d4e310A86b875c09946f';

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


  prepareTransaction_SendETI(password, fromAddress, receiverAddress, amount, clbError, clbSuccess) {
    web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
      if (error) {
        clbError("Wrong password for the selected address!");
      } else {
        web3Local.eth.getTransactionCount(fromAddress, "pending", function (error, result) {
          if (error) {
            clbError(error);
          } else {


            var txData = this.web3.eth.abi.encodeFunctionCall({
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
          }, [receiverAddress, amount ]);

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




  

  


}

// create new contract variable
EticaContract = new SmartContract();
