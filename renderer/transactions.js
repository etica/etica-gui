const {ipcRenderer} = require("electron");
const v8 = require('v8');

class Transactions {
  constructor() {
    this.filter = "";
    this.isSyncing = false;
    this.isLoading = false;
  }

  /**
   * ============================================================================
   * ETICA SMART CONTRACT CONSTANTS
   * ============================================================================
   *
   * These constants are used for calculating proposal/commit timestamps.
   * They are hardcoded here because:
   *   1. They have NEVER changed since Etica v1 (genesis)
   *   2. Fetching from blockchain would require an archive node for historical blocks
   *   3. Hardcoding eliminates RPC calls and improves scanning performance
   *
   * Source: EticaRelease.sol (Etica smart contract)
   *
   * Current values (unchanged since v1):
   *   - REWARD_INTERVAL = 7 days = 604800 seconds
   *   - DEFAULT_VOTING_TIME = 21 days = 1814400 seconds
   *   - DEFAULT_REVEALING_TIME = 7 days = 604800 seconds
   *
   * ============================================================================
   * HOW TO UPDATE IF A FUTURE HARDFORK CHANGES THESE VALUES:
   * ============================================================================
   *
   * If a future hardfork (e.g., v7) changes any of these constants:
   *
   * 1. Add the new hardfork block heights to HARDFORK_BLOCKS below:
   *      mainnet: { ..., v7: <block_number> }
   *      testnet: { ..., v7: <block_number> }
   *
   * 2. Add the new values to CONTRACT_CONSTANTS below:
   *      v7: { REWARD_INTERVAL: <new_value>, ... }
   *
   * 3. Update getContractConstants() to check block number against hardfork blocks
   *    and return the appropriate constants for that era.
   *
   * Example if v7 hardfork changes DEFAULT_VOTING_TIME to 14 days:
   *
   *   static HARDFORK_BLOCKS = {
   *     mainnet: { v1: 0, v7: 9000000 },
   *     testnet: { v1: 0, v7: 5000000 }
   *   };
   *
   *   static CONTRACT_CONSTANTS = {
   *     v1: { REWARD_INTERVAL: 604800, DEFAULT_VOTING_TIME: 1814400, DEFAULT_REVEALING_TIME: 604800 },
   *     v7: { REWARD_INTERVAL: 604800, DEFAULT_VOTING_TIME: 1209600, DEFAULT_REVEALING_TIME: 604800 }
   *   };
   *
   *   getContractConstants(blockNumber) {
   *     const network = this.getNetworkType();
   *     if (blockNumber >= Transactions.HARDFORK_BLOCKS[network].v7) {
   *       return Transactions.CONTRACT_CONSTANTS.v7;
   *     }
   *     return Transactions.CONTRACT_CONSTANTS.v1;
   *   }
   *
   * ============================================================================
   * HARDFORK HISTORY (for reference, these did NOT change the constants below):
   * ============================================================================
   *
   * Mainnet (NetworkID: 61803):
   *   - v1: Block 0 (Genesis)
   *   - v2 (Meticulous): Block 4481000 - Changed PROPOSAL_DEFAULT_VOTE: 10 -> 100 ETI
   *   - v3 (Guardian): Block 5914050 - Changed PROPOSAL_DEFAULT_VOTE: 100 -> 1000 ETI, DISEASE_CREATION_AMOUNT: 100 -> 500 ETI
   *   - v5 (Aegis): Block 7004300
   *   - v6 (Themis): Block 7604000
   *
   * Crucible Testnet (NetworkID: 61888):
   *   - v1: Block 0 (Genesis)
   *   - v2 (Meticulous): Block 703000
   *   - v3 (Guardian): Block 1861250
   *   - v5 (Aegis): Block 2894610
   *   - v6 (Themis): Block 3518110
   *
   * ============================================================================
   */

  // Hardcoded constants (same for all hardforks v1 through v6)
  static CONTRACT_CONSTANTS = {
    REWARD_INTERVAL: 604800,         // 7 days in seconds
    DEFAULT_VOTING_TIME: 1814400,    // 21 days in seconds
    DEFAULT_REVEALING_TIME: 604800,  // 7 days in seconds
    MIN_CLAIM_INTERVAL: 5            // Calculated: ((21 days + 7 days) / 7 days) + 1 = 5
  };

  /**
   * Returns the Etica smart contract constants used for timestamp calculations.
   * These values have been the same since Etica genesis (v1).
   *
   * @param {number} blockNumber - Optional, currently unused since constants never changed.
   *                               Kept for API compatibility if future hardfork changes values.
   * @returns {Object} Contract constants
   */
  getContractConstants(blockNumber = null) {
    // Currently all hardforks (v1-v6) use the same values, so we return the static constants.
    //
    // EXAMPLE: If v7 hardfork at block 9000000 (mainnet) changes DEFAULT_VOTING_TIME to 14 days:
    //
    // 1. Change CONTRACT_CONSTANTS to store v1 values:
    //    static CONTRACT_CONSTANTS_V1 = {
    //      REWARD_INTERVAL: 604800,
    //      DEFAULT_VOTING_TIME: 1814400,    // 21 days
    //      DEFAULT_REVEALING_TIME: 604800,
    //      MIN_CLAIM_INTERVAL: 5
    //    };
    //
    // 2. Add v7 constants:
    //    static CONTRACT_CONSTANTS_V7 = {
    //      REWARD_INTERVAL: 604800,
    //      DEFAULT_VOTING_TIME: 1209600,    // 14 days (changed)
    //      DEFAULT_REVEALING_TIME: 604800,
    //      MIN_CLAIM_INTERVAL: 4            // Recalculated: ((14 + 7) / 7) + 1 = 4
    //    };
    //
    // 3. Add hardfork block heights:
    //    static HARDFORK_V7_BLOCK = { mainnet: 9000000, testnet: 5000000 };
    //
    // 4. Update this method:
    //    getContractConstants(blockNumber = null) {
    //      if (blockNumber !== null) {
    //        const wallet = ipcRenderer.sendSync("getRunningWallet");
    //        const network = (wallet && wallet.type === 'mainnet') ? 'mainnet' : 'testnet';
    //        const v7Block = Transactions.HARDFORK_V7_BLOCK[network];
    //        if (blockNumber >= v7Block) {
    //          return Transactions.CONTRACT_CONSTANTS_V7;
    //        }
    //      }
    //      return Transactions.CONTRACT_CONSTANTS_V1;
    //    }
    //
    return Transactions.CONTRACT_CONSTANTS;
  }

  /**
   * Process a batch of blocks with pre-fetched events.
   * Fetches blocks in parallel and events for the entire range at once,
   * then processes them sequentially to maintain DB write order.
   *
   * @param {Array} addressList - List of wallet addresses
   * @param {number} fromBlock - Start block number
   * @param {number} toBlock - End block number
   * @param {number} parallelBlockFetch - Number of blocks to fetch in parallel (default: 10)
   * @returns {Promise<string>} - 'done' when complete
   */
  async syncTransactionsBatch(addressList, fromBlock, toBlock, parallelBlockFetch = 10) {
    let addressListlowercase = addressList.map(element => element.toLowerCase());

    // Helper to check if error is a connection/timeout issue
    const isConnectionError = (error) => {
      if (!error) return false;
      const errorMsg = error.message || error.toString();
      return errorMsg.includes('timed out') ||
             errorMsg.includes('connection') ||
             errorMsg.includes('CONNECTION') ||
             errorMsg.includes('ECONNREFUSED') ||
             errorMsg.includes('WebSocket');
    };

    try {
      // Fetch all events for the block range at once
      let allEvents = [];
      try {
        allEvents = await EticaBlockchain.getPastEventsForRange(fromBlock, toBlock);
      } catch (eventError) {
        // If it's a connection error, throw it up to trigger recovery
        if (isConnectionError(eventError)) {
          throw eventError;
        }
        console.log('Batch event fetch failed, falling back to block-by-block:', eventError);
        // Fallback to original method if batch fetch fails (non-connection error)
        for (let blocknb = fromBlock; blocknb <= toBlock; blocknb++) {
          await this.syncTransactionsofWalletAddresses(addressList, blocknb, toBlock);
        }
        return 'done';
      }

      // Create a map of events by block number for efficient lookup
      const eventsByBlock = new Map();
      for (const event of allEvents) {
        const blockNum = event.blockNumber;
        if (!eventsByBlock.has(blockNum)) {
          eventsByBlock.set(blockNum, []);
        }
        eventsByBlock.get(blockNum).push(event);
      }

      // Debug logging (uncomment for troubleshooting)
      // console.log('[syncTransactionsBatch] Blocks:', fromBlock, '-', toBlock, '| Events found:', allEvents.length, '| Blocks with events:', eventsByBlock.size);

      // Fetch blocks in parallel batches
      const blockNumbers = [];
      for (let i = fromBlock; i <= toBlock; i++) {
        blockNumbers.push(i);
      }

      // Process blocks in parallel chunks
      for (let i = 0; i < blockNumbers.length; i += parallelBlockFetch) {
        const chunkBlockNumbers = blockNumbers.slice(i, i + parallelBlockFetch);

        // Fetch blocks in parallel
        const blocks = await EticaBlockchain.getBlocksParallel(chunkBlockNumbers, true);

        // Process each block sequentially (to maintain DB write order)
        for (let j = 0; j < blocks.length; j++) {
          const block = blocks[j];
          const blockNum = chunkBlockNumbers[j];
          const logevents = eventsByBlock.get(blockNum) || [];

          if (block && block.transactions) {
            // Process this block using the pre-fetched events
            await this.processBlockWithEvents(addressListlowercase, block, logevents);
          }
        }
      }

      return 'done';
    } catch (error) {
      console.log('syncTransactionsBatch error:', error);
      // If it's a connection error, throw it up to trigger recovery at ScanTxs level
      if (isConnectionError(error)) {
        throw error;
      }
      // Fallback to original sequential processing for non-connection errors
      for (let blocknb = fromBlock; blocknb <= toBlock; blocknb++) {
        await this.syncTransactionsofWalletAddresses(addressList, blocknb, toBlock);
      }
      return 'done';
    }
  }

  /**
   * Process a single block with pre-fetched events.
   * This extracts the core logic from syncTransactionsofWalletAddresses
   * to work with pre-fetched data.
   *
   * @param {Array} addressListlowercase - Lowercase wallet addresses
   * @param {Object} data - Block data with transactions
   * @param {Array} logevents - Pre-fetched events for this block
   */
  async processBlockWithEvents(addressListlowercase, data, logevents) {
    // Process each transaction in the block
    for (const onetx of data.transactions) {
      if (onetx.from && onetx.to) {
        // Check for batch payment transfer events
        let existTransfertoWallet = false;

        if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)) {
          var txevents_temp = logevents.filter(function(onelogevent) {
            return onelogevent.transactionHash == onetx.hash;
          });

          let wallettransferevents = txevents_temp.filter(function(onevent) {
            return (onevent.event == 'Transfer' && addressListlowercase.includes((onevent.returnValues.to).toLowerCase()));
          });

          if (wallettransferevents && wallettransferevents.length > 0) {
            existTransfertoWallet = true;
          }
        }

        if (addressListlowercase.includes((onetx.from).toLowerCase()) || addressListlowercase.includes((onetx.to).toLowerCase()) || existTransfertoWallet) {
          if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)) {
            var txevents = logevents.filter(function(onelogevent) {
              if (onelogevent.event == 'Transfer' && !(addressListlowercase.includes((onelogevent.returnValues.to).toLowerCase()) || addressListlowercase.includes((onelogevent.returnValues.from).toLowerCase()))) {
                return false;
              } else {
                return onelogevent.transactionHash == onetx.hash;
              }
            });

            // Remove transfer events if non-transfer events exist
            let nonetransferevents = txevents.filter(function(onevent) {
              return onevent.event != 'Transfer';
            });

            if (nonetransferevents && nonetransferevents.length > 0) {
              let transferevents = txevents.filter(function(onevent) {
                return onevent.event == 'Transfer';
              });

              transferevents.forEach(f => {
                let _eventindex = txevents.findIndex(e => e.logIndex === f.logIndex);
                txevents.splice(_eventindex, 1);
              });
            }

            // Process each event (this calls the same event processing logic)
            for (const onetxevent of txevents) {
              await this.processTransactionEvent(addressListlowercase, data, onetx, onetxevent);
            }
          }

          // Handle pure EGAZ transfers (no events)
          if (onetx.input == '0x' && !existTransfertoWallet) {
            if (!addressListlowercase.includes((onetx.from).toLowerCase()) && !addressListlowercase.includes((onetx.to).toLowerCase())) {
              continue;
            }

            let _inoroutegaz = 'neutral';
            if (addressListlowercase.includes((onetx.from).toLowerCase())) {
              _inoroutegaz = 'sent';
            } else if (addressListlowercase.includes((onetx.to).toLowerCase())) {
              _inoroutegaz = 'received';
            }

            var Transaction = {
              block: onetx.blockNumber.toString(),
              txhash: onetx.hash.toLowerCase(),
              fromaddr: onetx.from.toLowerCase(),
              timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
              toaddr: onetx.to.toLowerCase(),
              value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
              eventtype: 'EgazTransfer',
              logIndex: null,
              valueeti: 0,
              fromaddreti: null,
              toaddreti: null,
              slashduration: null,
              inorout: _inoroutegaz
            };

            ipcRenderer.send("storeTransaction", Transaction);
          }
        }
      }
    }
  }

  /**
   * Process a single transaction event.
   * This extracts the event processing logic from syncTransactionsofWalletAddresses.
   *
   * @param {Array} addressListlowercase - Lowercase wallet addresses
   * @param {Object} data - Block data
   * @param {Object} onetx - Transaction object
   * @param {Object} onetxevent - Event object
   */
  async processTransactionEvent(addressListlowercase, data, onetx, onetxevent) {
    let _valueeti = 0;
    let _fromaddreti = null;
    let _toaddreti = null;
    let _slashduration = null;
    let _inorout = 'neutral';
    let includedevents = ['Transfer', 'NewCommit', 'NewProposal', 'NewChunk', 'NewDisease', 'NewFee', 'NewSlash', 'NewReveal', 'NewStake', 'StakeClaimed', 'RewardClaimed', 'NewStakesnap', 'NewStakescsldt', 'TieClaimed', 'NewRecover'];
    var _toaddress = onetx.to.toLowerCase();

    if (!includedevents.includes(onetxevent.event)) {
      return;
    }

    if (onetxevent.event == 'Transfer') {
      _valueeti = onetxevent.returnValues.tokens;
      _fromaddreti = onetxevent.returnValues.from;
      _toaddreti = onetxevent.returnValues.to;
      _toaddress = onetxevent.returnValues.to;

      if (addressListlowercase.includes((onetxevent.returnValues.from).toLowerCase())) {
        _inorout = 'sent';
      } else if (addressListlowercase.includes((onetxevent.returnValues.to).toLowerCase())) {
        _inorout = 'received';
      }
    }

    if (onetxevent.event == 'NewCommit') {
      _valueeti = onetxevent.returnValues.amount;
      _fromaddreti = onetxevent.returnValues._voter;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewProposal') {
      _valueeti = web3Local.utils.toWei('10', 'ether');
      _fromaddreti = onetxevent.returnValues._proposer;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewChunk') {
      _valueeti = web3Local.utils.toWei('5', 'ether');
      _fromaddreti = onetx.from;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewDisease') {
      _valueeti = web3Local.utils.toWei('100', 'ether');
      _fromaddreti = onetx.from;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewFee') {
      _valueeti = onetxevent.returnValues.fee;
      _fromaddreti = onetxevent.returnValues.voter;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewSlash') {
      _valueeti = onetxevent.returnValues.amount;
      _fromaddreti = onetxevent.returnValues.voter;
      _toaddreti = onetx.to;
      _slashduration = onetxevent.returnValues.duration;
    }

    if (onetxevent.event == 'NewReveal') {
      _valueeti = onetxevent.returnValues.amount;
      _fromaddreti = onetxevent.returnValues._voter;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewStake') {
      _valueeti = onetxevent.returnValues.amount;
      _fromaddreti = onetxevent.returnValues.staker;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'StakeClaimed') {
      _valueeti = onetxevent.returnValues.stakeamount;
      _fromaddreti = onetxevent.returnValues.staker;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'RewardClaimed') {
      _valueeti = onetxevent.returnValues.amount;
      _fromaddreti = onetxevent.returnValues.voter;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'TieClaimed') {
      _valueeti = 0;
      _fromaddreti = onetxevent.returnValues.voter;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewStakescsldt') {
      _valueeti = 0;
      _fromaddreti = onetxevent.returnValues.staker;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewStakesnap') {
      _valueeti = onetxevent.returnValues.snapamount;
      _fromaddreti = onetxevent.returnValues.staker;
      _toaddreti = onetx.to;
    }

    if (onetxevent.event == 'NewRecover') {
      _valueeti = onetxevent.returnValues.amount;
      _fromaddreti = onetxevent.returnValues._voter;
      _toaddreti = onetx.to;
    }

    var Transaction = {
      block: onetx.blockNumber.toString(),
      txhash: onetx.hash.toLowerCase(),
      fromaddr: onetx.from.toLowerCase(),
      timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
      toaddr: _toaddress,
      value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
      eventtype: onetxevent.event,
      logIndex: onetxevent.logIndex,
      valueeti: _valueeti,
      fromaddreti: _fromaddreti,
      toaddreti: _toaddreti,
      slashduration: _slashduration,
      inorout: _inorout
    };

    ipcRenderer.send("storeTransaction", Transaction);

    // Process special events (NewCommit, NewReveal, NewProposal, RewardClaimed, NewSlash, NewFee)
    if (onetxevent.event == 'NewCommit') {
      let _hashinput = ipcRenderer.sendSync("getHashinput", {commithash: onetxevent.returnValues.votehash});
      let _commit = ipcRenderer.sendSync("getCommit", {votehash: onetxevent.returnValues.votehash, voter: onetxevent.returnValues._voter});
      let _hashchoice = null;
      let _hashvary = null;
      let _hashproposalhash = null;
      let _hashproposaltitle = null;
      let _hashproposalend = null;
      let _hashproposaldeadline = null;
      let _timestamp_claimable = null;
      let _status = 1;

      if (_commit && _commit.status) {
        _status = _commit.status;
      }

      if (_hashinput && _hashinput.commithash == onetxevent.returnValues.votehash) {
        _hashchoice = _hashinput.choice;
        _hashvary = _hashinput.vary;
        _hashproposalhash = _hashinput.proposalhash;

        let _proposal = await EticaContract.proposals(_hashinput.proposalhash);
        let _proposaldata = await EticaContract.propsdatas(_hashinput.proposalhash);

        _hashproposaltitle = _proposal[6];
        let _propend = _proposaldata[1];

        // Pass block number to get hardfork-appropriate constants
        let contractConsts = await EticaTransactions.getContractConstants(data.number);
        let _period = await EticaContract.periods(_proposal[3]);
        let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);

        _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
        _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
        let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME, 'seconds');
        _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
      }

      var _NewCommit = {
        votehash: onetxevent.returnValues.votehash,
        txhash: onetx.hash.toLowerCase(),
        voter: onetxevent.returnValues._voter,
        timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
        valueeti: _valueeti,
        choice: _hashchoice,
        vary: _hashvary,
        proposalhash: _hashproposalhash,
        proposaltitle: _hashproposaltitle,
        proposalend: _hashproposalend,
        proposaldeadline: _hashproposaldeadline,
        timestampclaimable: _timestamp_claimable,
        isDone: false,
        status: _status,
      };

      ipcRenderer.send("storeCommit", _NewCommit);
    }

    if (onetxevent.event == 'NewReveal') {
      let inputs = web3Local.eth.abi.decodeParameters(
        [
          { type: 'bytes32', name: '_proposed_release_hash' },
          { type: 'bool', name: '_approved' },
          { type: 'string', name: '_vary' }
        ],
        `0x${onetx.input.substring(10)}`
      );

      let calculatedhash = EticaCommitHistory.calculateHash(inputs._proposed_release_hash, inputs._approved, onetxevent.returnValues._voter, inputs._vary);
      let _commit = ipcRenderer.sendSync("getCommit", {votehash: calculatedhash, voter: onetxevent.returnValues._voter});

      if (_commit && _commit.votehash == calculatedhash) {
        let _status = 2;

        if (_commit.status >= 3) {
          _status = _commit.status;
        }

        let _proposal = await EticaContract.proposals(_commit.proposalhash);
        let _proposaldata = await EticaContract.propsdatas(_commit.proposalhash);

        // Pass block number to get hardfork-appropriate constants
        let contractConsts = await EticaTransactions.getContractConstants(data.number);

        let _period = await EticaContract.periods(_proposal[3]);
        let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);
        let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

        let _hashproposaltitle = _proposal[6];
        let _propend = _proposaldata[1];
        let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
        let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME, 'seconds');
        let _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");

        var _UpdatedCommit = {
          votehash: calculatedhash,
          voter: onetxevent.returnValues._voter,
          choice: inputs._approved,
          vary: inputs._vary,
          proposalhash: _commit.proposalhash,
          proposaltitle: _hashproposaltitle,
          proposalend: _hashproposalend,
          proposaldeadline: _hashproposaldeadline,
          timestampclaimable: _timestamp_claimable,
          status: _status
        };

        ipcRenderer.send("updateCommitwithStatus", _UpdatedCommit);
      }
    }

    if (onetxevent.event == 'RewardClaimed') {
      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});

      if (_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash) {
        var _UpdatedCommit = {
          votehash: _commit.votehash,
          voter: onetxevent.returnValues.voter,
          status: 3,
          rewardamount: onetxevent.returnValues.amount
        };

        ipcRenderer.send("updateCommitRewardAmount", _UpdatedCommit);
      }

      if (_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash) {
        let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
        let _status = _proposal.status;
        let _claimed = true;

        if (proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)) {
          _status = proposaldata.status;
        }

        var _UpdatedProposal = {
          proposalhash: _proposal.proposalhash,
          proposer: onetxevent.returnValues.voter,
          status: _status,
          claimed: _claimed,
          rewardamount: onetxevent.returnValues.amount,
          fees: 0,
          slashduration: 0,
          slashamount: 0
        };

        ipcRenderer.send("updateProposalReward", _UpdatedProposal);
      }
    }

    if (onetxevent.event == 'NewSlash') {
      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});

      if (_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash) {
        var _UpdatedCommit = {
          votehash: _commit.votehash,
          voter: onetxevent.returnValues.voter,
          status: 3,
          slashduration: onetxevent.returnValues.duration,
          slashamount: onetxevent.returnValues.amount
        };

        ipcRenderer.send("updateCommitSlash", _UpdatedCommit);
      }

      if (_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash) {
        let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
        let _status = _proposal.status;

        if (proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)) {
          _status = proposaldata.status;
        }

        let _claimed = true;

        var _UpdatedProposal = {
          proposalhash: _proposal.proposalhash,
          proposer: onetxevent.returnValues.voter,
          status: _status,
          claimed: _claimed,
          slashduration: onetxevent.returnValues.duration,
          slashamount: onetxevent.returnValues.amount
        };

        ipcRenderer.send("updateProposalSlash", _UpdatedProposal);
      }
    }

    if (onetxevent.event == 'NewFee') {
      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});

      if (_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash) {
        var _UpdatedCommit = {
          votehash: _commit.votehash,
          voter: onetxevent.returnValues.voter,
          status: 3,
          fee: onetxevent.returnValues.fee
        };

        ipcRenderer.send("updateCommitFee", _UpdatedCommit);
      }

      if (_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash) {
        let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
        let _status = _proposal.status;

        if (proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)) {
          _status = proposaldata.status;
        }

        let _claimed = true;

        var _UpdatedProposal = {
          proposalhash: _proposal.proposalhash,
          proposer: onetxevent.returnValues.voter,
          status: _status,
          claimed: _claimed,
          fee: onetxevent.returnValues.fee
        };

        ipcRenderer.send("updateProposalFee", _UpdatedProposal);
      }
    }

    if (onetxevent.event == 'NewProposal') {
      let _savedproposal = ipcRenderer.sendSync("getProposal", {proposalhash: onetxevent.returnValues.proposed_release_hash});

      let _hashproposalend = null;
      let _hashproposaldeadline = null;
      let _timestamp_claimable = null;
      let _status = 2;
      let _claimed = false;

      if (_savedproposal && _savedproposal.status) {
        if (_savedproposal.status) {
          _status = _savedproposal.status;
        }

        if (_savedproposal.claimed) {
          _claimed = _savedproposal.claimed;
        }
      }

      let _proposal = await EticaContract.proposals(onetxevent.returnValues.proposed_release_hash);
      let _proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposed_release_hash);
      let _propend = _proposaldata[1];

      // Pass block number to get hardfork-appropriate constants
      let contractConsts = await EticaTransactions.getContractConstants(data.number);

      let _period = await EticaContract.periods(_proposal[3]);
      let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);

      _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

      _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
      let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME, 'seconds');
      _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");

      let _diseaseindex = await EticaContract.diseasesbyIds(_proposal.disease_id);
      let _disease = await EticaContract.diseases(_diseaseindex);
      let _chunk = await EticaContract.chunks(_proposal.chunk_id);

      var _NewProposal = {
        proposalhash: _proposal.proposed_release_hash,
        proposer: onetxevent.returnValues._proposer,
        rawreleasehash: _proposal.raw_release_hash,
        title: _proposal.title,
        diseasename: _disease.name,
        diseasehash: _disease.disease_hash,
        chunktitle: _chunk.title,
        chunkid: _chunk.id,
        proposalend: _hashproposalend,
        proposaldeadline: _hashproposaldeadline,
        timestampclaimable: _timestamp_claimable,
        txhash: onetx.hash.toLowerCase(),
        status: _status,
        claimed: _claimed,
        approvalthreshold: _proposaldata.approvalthreshold,
        timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
        blocknumber: data.number
      };

      ipcRenderer.send("storeProposal", _NewProposal);
    }
  }

  setIsSyncing(value) {
    this.isSyncing = value;
  }

  getIsSyncing() {
    return this.isSyncing;
  }

  setIsLoading(value) {
    this.isLoading = value;
  }

  getIsLoading() {
    return this.isLoading;
  }

  setFilter(text) {
    this.filter = text;
  }

  getFilter() {
    return this.filter;
  }

  clearFilter() {
    this.filter = "";
  }

  async syncTransactionsofWalletAddresses(addressList, startBlock, lastBlock) {

   let addressListlowercase = addressList.map(element => element.toLowerCase());
   //console.log('addressListlowercase is', addressListlowercase);


      //console.log('startBlock is', startBlock);
      //console.log('lastBlock is', lastBlock);


/*
      var params = vsprintf("?address=%s&fromBlock=%d&toBlock=%d", [
        addressList[counter].toLowerCase(),
        startBlock,
        lastBlock
      ]);

      $.getJSON("http://richlist.dkc.services/transactions_list.php" + params , function (result) {
        result.data.forEach(element => {
          if (element.fromaddr && element.toaddr) {
            ipcRenderer.send("storeTransaction", {
              block: element.block.toString(),
              txhash: element.txhash.toLowerCase(),
              fromaddr: element.fromaddr.toLowerCase(),
              timestamp: element.timestamp,
              toaddr: element.toaddr.toLowerCase(),
              value: element.value
            });
          }
        }); */
      
        let blocknb = startBlock;

        await EticaBlockchain.getBlock(blocknb, true, function (error) {
         // EticaMainGUI.showGeneralError(error);
        }, async function (data) {
          if (data.transactions) {

            let options = {
              fromBlock: blocknb,
              toBlock: blocknb
            };

            await EticaBlockchain.getPastEvents(options, function (error) {
              //EticaMainGUI.showGeneralError(error);
              console.log('getPastEvents() error: ', error);
            }, async function (logevents) {

             // console.log('in getPastEvents, logevents loaded');
            data.transactions.forEach(async (onetx) => {
            //  console.log('onetx step1 ok');
            //  console.log('onetx step1', onetx);
              if (onetx.from && onetx.to) {
               // console.log('onetx step2, onetx.from && onetx.to: ', onetx);
               // console.log('addressListlowercase is', addressListlowercase);


               // NEED TO CHECK TRANSFERS IN CASE OF BATCHED PAYMENT TRANSFER EVENTS //
               // (for ETI transfers made in batch by batch payment contracts, wallet address is not in tx.from or tx.to):  //
               let existTransfertoWallet = false;

               if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){
               
                var txevents_temp = logevents.filter(function(onelogevent) {
                return onelogevent.transactionHash == onetx.hash;
              });

              let wallettransferevents = txevents_temp.filter(function(onevent) {
                return (onevent.event == 'Transfer' && addressListlowercase.includes((onevent.returnValues.to).toLowerCase()));
              });

              if(wallettransferevents && wallettransferevents.length > 0){
                existTransfertoWallet = true;
              }
            
              }

               // (for ETI transfers made in batch by batch payment contracts, wallet address is not in tx.from or tx.to):  //
               // NEED TO CHECK TRANSFERS IN CASE OF BATCHED PAYMENT TRANSFER EVENTS //
               




               if (addressListlowercase.includes((onetx.from).toLowerCase()) || addressListlowercase.includes((onetx.to).toLowerCase()) || existTransfertoWallet) {

                //  console.log('onetx step3, EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to) :', EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to));
                //  console.log('onetx step3, onetx is:', onetx);

                  if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){
                //    console.log('onevent => onevent.transactionHash === onetx.hash) is true:', onetx);
                    /*var txevents = logevents.filter(function(onelogevent) {
                      return onelogevent.transactionHash == onetx.hash;
                    }); */

                    var txevents = logevents.filter(function(onelogevent) {
                      if (onelogevent.event == 'Transfer' && !(addressListlowercase.includes((onelogevent.returnValues.to).toLowerCase()) || addressListlowercase.includes((onelogevent.returnValues.from).toLowerCase()))) {
                        return false; // exclude this element because transfer doesnt belong to this wallet (probably a transfer from a batch payment)
                      } else {
                        return onelogevent.transactionHash == onetx.hash; // keep this element
                      }
                    });
  
                 //   console.log('I txevents before is: ', txevents);
                   

                    // if none transfer events in tx we remove transfers events as main event is not a transfer (unless tx made from another smart contract but we dont handle that case):
                    let nonetransferevents = txevents.filter(function(onevent) {
                      return onevent.event != 'Transfer' 
                    });

                    if(nonetransferevents && nonetransferevents.length > 0){
                 //     console.log('II in nonetransferevents is: ', nonetransferevents);
                      let transferevents = txevents.filter(function(onevent) {
                        return onevent.event == 'Transfer' 
                      });

                      transferevents.forEach(f => {
                        let _eventindex = txevents.findIndex(e => e.logIndex === f.logIndex);
                  //   console.log('I _eventindex  is: ', _eventindex);
                        txevents.splice(_eventindex,1);
                      });
                    }
                    
                   // console.log('txevents after is: ', txevents);

                    txevents.forEach(async (onetxevent) => { 
                    //  console.log('onetxevent step4 :', onetxevent);
                  let _valueeti = 0;
                  let _fromaddreti = null;
                  let _toaddreti = null;
                  let _slashduration = null;
                  let _slashamount = null;
                  let _inorout = 'neutral'; // if tx is received: received, if tx is sent: sent
                  let includedevents = ['Transfer', 'NewCommit', 'NewProposal', 'NewChunk', 'NewDisease', 'NewFee', 'NewSlash', 'NewReveal', 'NewStake', 'StakeClaimed', 'RewardClaimed', 'NewStakesnap', 'NewStakescsldt', 'TieClaimed', 'NewRecover'];
                  var _toaddress = onetx.to.toLowerCase();

                // if event is not among the ones shown to users we skip, example, CreatedPeriod event (event created at new proposal txs for first proposer of the period):
                if(!includedevents.includes(onetxevent.event)){
                   return;
                }

                  if(onetxevent.event == 'Transfer'){

                    _valueeti = onetxevent.returnValues.tokens;
                    _fromaddreti = onetxevent.returnValues.from;
                    _toaddreti = onetxevent.returnValues.to;
                    _toaddress = onetxevent.returnValues.to;

                    if(addressListlowercase.includes((onetxevent.returnValues.from).toLowerCase())){
                     _inorout = 'sent';
                    }
                    else if(addressListlowercase.includes((onetxevent.returnValues.to).toLowerCase())){
                      _inorout = 'received';
                    }

                  }

                  if(onetxevent.event == 'NewCommit'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues._voter;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewProposal'){

                    _valueeti = web3Local.utils.toWei('10', 'ether');
                    _fromaddreti = onetxevent.returnValues._proposer;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewChunk'){

                    _valueeti = web3Local.utils.toWei('5', 'ether');
                    _fromaddreti = onetx.from;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewDisease'){

                    _valueeti = web3Local.utils.toWei('100', 'ether');
                    _fromaddreti = onetx.from;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewFee'){

                    _valueeti = onetxevent.returnValues.fee;
                    _fromaddreti = onetxevent.returnValues.voter;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewSlash'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues.voter;
                    _toaddreti = onetx.to;
                    _slashduration = onetxevent.returnValues.duration;

                  }

                  if(onetxevent.event == 'NewReveal'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues._voter;
                    _toaddreti = onetx.to;

                  }


                  if(onetxevent.event == 'NewStake'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues.staker;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'StakeClaimed'){

                    _valueeti = onetxevent.returnValues.stakeamount;
                    _fromaddreti = onetxevent.returnValues.staker;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'RewardClaimed'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues.voter;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'TieClaimed'){

                    _valueeti = 0;
                    _fromaddreti = onetxevent.returnValues.voter;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewStakescsldt'){

                    _valueeti = 0;
                    _fromaddreti = onetxevent.returnValues.staker;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewStakesnap'){

                    _valueeti = onetxevent.returnValues.snapamount;
                    _fromaddreti = onetxevent.returnValues.staker;
                    _toaddreti = onetx.to;

                  }

                  if(onetxevent.event == 'NewRecover'){

                    _valueeti = onetxevent.returnValues.amount;
                    _fromaddreti = onetxevent.returnValues._voter;
                    _toaddreti = onetx.to;

                  }



                  var Transaction = {
                    block: onetx.blockNumber.toString(),
                    txhash: onetx.hash.toLowerCase(),
                    fromaddr: onetx.from.toLowerCase(),
                    timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    toaddr: _toaddress,
                    value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                    eventtype: onetxevent.event,
                    logIndex:onetxevent.logIndex, // index position in the block
                    valueeti: _valueeti,
                    fromaddreti: _fromaddreti,
                    toaddreti: _toaddreti,
                    slashduration: _slashduration,
                    inorout: _inorout
                  };
                  
                  
                  // store transaction and notify about new transactions
                  ipcRenderer.send("storeTransaction", Transaction);
              

                  if(onetxevent.event == 'NewCommit'){

                    let _hashinput = ipcRenderer.sendSync("getHashinput", {commithash: onetxevent.returnValues.votehash});
                    let _commit = ipcRenderer.sendSync("getCommit", {votehash: onetxevent.returnValues.votehash, voter: onetxevent.returnValues._voter});
                    let _hashchoice = null;
                    let _hashvary = null;
                    let _hashproposalhash =null;
                    let _hashproposaltitle =null;
                    let _hashproposalend=null;
                    let _hashproposaldeadline =null;
                    let _timestamp_claimable=null;
                    let _status = 1;

                    // prevent reactualisation of status on resyncs:
                    if(_commit && _commit.status){
                      _status = _commit.status;
                    }
  
                    if(_hashinput && _hashinput.commithash == onetxevent.returnValues.votehash){
                      _hashchoice = _hashinput.choice;
                      _hashvary = _hashinput.vary;
                       _hashproposalhash = _hashinput.proposalhash;
  
                       let _proposal = await EticaContract.proposals(_hashinput.proposalhash);

                       let _proposaldata = await EticaContract.propsdatas(_hashinput.proposalhash);

                       _hashproposaltitle = _proposal[6];
                       let _propend = _proposaldata[1]; // endtime

                       // Use cached contract constants with block number for hardfork awareness
                       let contractConsts = await EticaTransactions.getContractConstants(blocknb);

                       let _period = await EticaContract.periods(_proposal[3]);

                       let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);
          
                       _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                       _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                       let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME,'seconds');
                       _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
                    }


                    var _NewCommit = {
                    votehash: onetxevent.returnValues.votehash,
                    txhash: onetx.hash.toLowerCase(),
                    voter: onetxevent.returnValues._voter,
                    timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    valueeti: _valueeti,
                    choice: _hashchoice,
                    vary: _hashvary,
                    proposalhash: _hashproposalhash,
                    proposaltitle: _hashproposaltitle,
                    proposalend: _hashproposalend,
                    proposaldeadline: _hashproposaldeadline,
                    timestampclaimable: _timestamp_claimable,
                    isDone: false,
                    status: _status,
                    };

                    ipcRenderer.send("storeCommit", _NewCommit);

                  }



                  if(onetxevent.event == 'NewReveal'){


                    let inputs = web3Local.eth.abi.decodeParameters(
                    // ERC20 transfer method args
                    [
                      { type: 'bytes32', name: '_proposed_release_hash' },
                      { type: 'bool', name: '_approved' },
                      { type: 'string', name: '_vary' }
                    ],
                    `0x${onetx.input.substring(10)}`
                  );
      
      
                        let calculatedhash = EticaCommitHistory.calculateHash(inputs._proposed_release_hash, inputs._approved,  onetxevent.returnValues._voter, inputs._vary);
      
                        let _commit = ipcRenderer.sendSync("getCommit", {votehash: calculatedhash, voter: onetxevent.returnValues._voter});
                 
                        if(_commit && _commit.votehash == calculatedhash){

                          let _status = 2;

                          if(_commit.status >= 3){
                            _status = _commit.status;
                          }

                          let _proposal = await EticaContract.proposals(_commit.proposalhash);
                          let _proposaldata = await EticaContract.propsdatas(_commit.proposalhash);

                          // Use cached contract constants with block number for hardfork awareness
                          let contractConsts = await EticaTransactions.getContractConstants(blocknb);

                          let _period = await EticaContract.periods(_proposal[3]);

                          let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);

                          let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

                          let _hashproposaltitle = _proposal[6];
                          let _propend = _proposaldata[1]; // endtime
                          let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                          let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME,'seconds');
                          let _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");

                          var _UpdatedCommit = {
                              votehash: calculatedhash,
                              voter: onetxevent.returnValues._voter,
                              choice: inputs._approved,
                              vary: inputs._vary,
                              proposalhash: _commit.proposalhash,
                              proposaltitle: _hashproposaltitle,
                              proposalend: _hashproposalend,
                              proposaldeadline: _hashproposaldeadline,
                              timestampclaimable: _timestamp_claimable,
                              status: _status
                          };
      
              ipcRenderer.send("updateCommitwithStatus", _UpdatedCommit);
      
                       }
      
                      }


                      if(onetxevent.event == 'RewardClaimed'){               
    
                        let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});

                        let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});                         
                 
                        if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
      
                          var _UpdatedCommit = {
                              votehash: _commit.votehash,
                              voter: onetxevent.returnValues.voter,
                              status: 3,
                              rewardamount: onetxevent.returnValues.amount
                          };

                          ipcRenderer.send("updateCommitRewardAmount", _UpdatedCommit);
      
                       }



                        if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

                          let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                          let _status = _proposal.status;
                          let _claimed = true;
                       
                        
                        // make sure we retrieved proposal without issues, to avoid undefinied status:
                        if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                          _status = proposaldata.status;
                        }
      
                          var _UpdatedProposal = {
                              proposalhash: _proposal.proposalhash,
                              proposer: onetxevent.returnValues.voter,
                              status: _status,
                              claimed: _claimed,
                              rewardamount: onetxevent.returnValues.amount,
                              fees:0,
                              slashduration:0,
                              slashamount:0
                          };
      
                          ipcRenderer.send("updateProposalReward", _UpdatedProposal);
      
                        } 
      
                      }


                      if(onetxevent.event == 'NewSlash'){ 
    
                        let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                        let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});
  
                 
                        if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
      
                          var _UpdatedCommit = {
                              votehash: _commit.votehash,
                              voter: onetxevent.returnValues.voter,
                              status: 3,
                              slashduration: onetxevent.returnValues.duration,
                              slashamount: onetxevent.returnValues.amount
                          };
  
              ipcRenderer.send("updateCommitSlash", _UpdatedCommit);
      
      
                       }
  
  
  
                       if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){
  
                        let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                        let _status = _proposal.status;
  
                        // make sure we retrieved proposal without issues, to avoid undefinied status:
                        if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                           _status = proposaldata.status;
                        }
  
                        let _claimed = true;
    
                        var _UpdatedProposal = {
                            proposalhash: _proposal.proposalhash,
                            proposer: onetxevent.returnValues.voter,
                            status: _status,
                            claimed: _claimed,
                            slashduration: onetxevent.returnValues.duration,
                            slashamount: onetxevent.returnValues.amount
                        };
    
                        ipcRenderer.send("updateProposalSlash", _UpdatedProposal);  
    
                      } 
  
                      }
  
  
                      if(onetxevent.event == 'NewFee'){ 
      
                        let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                        let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});
  
                 
                        if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
      
                          var _UpdatedCommit = {
                              votehash: _commit.votehash,
                              voter: onetxevent.returnValues.voter,
                              status: 3,
                              fee: onetxevent.returnValues.fee
                          };
      
              ipcRenderer.send("updateCommitFee", _UpdatedCommit);
      
                       }
  
  
  
                       if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){
  
                        let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                        let _status = _proposal.status;
  
                        // make sure we retrieved proposal without issues, to avoid undefinied status:
                        if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                           _status = proposaldata.status;
                        }
  
                        let _claimed = true;
    
                        var _UpdatedProposal = {
                            proposalhash: _proposal.proposalhash,
                            proposer: onetxevent.returnValues.voter,
                            status: _status,
                            claimed: _claimed,
                            fee: onetxevent.returnValues.fee
                        };
    
                        ipcRenderer.send("updateProposalFee", _UpdatedProposal);
    
                      } 
  
                      }


                      if(onetxevent.event == 'NewProposal'){

                        let _savedproposal = ipcRenderer.sendSync("getProposal", {proposalhash: onetxevent.returnValues.proposed_release_hash});
  
                        let _hashproposalend =null;
                        let _hashproposaldeadline =null;
                        let _timestamp_claimable =null;
                        let _status = 2; // pending
                        let _claimed = false;
      
                        // prevent reactualisation of status on resyncs:
                        if(_savedproposal && _savedproposal.status){
                          if ( _savedproposal.status){
                            _status = _savedproposal.status;
                          }
  
                          if ( _savedproposal.claimed){
                            _claimed = _savedproposal.claimed;
                          }
                        }
      
                           let _proposal = await EticaContract.proposals(onetxevent.returnValues.proposed_release_hash);
                           let _proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposed_release_hash);
                           let _propend = _proposaldata[1]; // endtime

                            // Use cached contract constants with block number for hardfork awareness
                            let contractConsts = await EticaTransactions.getContractConstants(blocknb);

                            let _period = await EticaContract.periods(_proposal[3]);
                            let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);

                            _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

                            _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                            let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME,'seconds');
                             _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");

                           let _diseaseindex = await EticaContract.diseasesbyIds(_proposal.disease_id);
                           let _disease = await EticaContract.diseases(_diseaseindex);
                           let _chunk = await EticaContract.chunks(_proposal.chunk_id);
      
      
                        var _NewProposal = {
                          proposalhash: _proposal.proposed_release_hash,
                          proposer: onetxevent.returnValues._proposer,
                          rawreleasehash:  _proposal.raw_release_hash, // ipfs content
                          title: _proposal.title,
                          diseasename: _disease.name,
                          diseasehash: _disease.disease_hash,
                          chunktitle: _chunk.title,
                          chunkid: _chunk.id,
                          proposalend: _hashproposalend,
                          proposaldeadline: _hashproposaldeadline,
                          timestampclaimable: _timestamp_claimable, // when proposal is claimable
                          txhash: onetx.hash.toLowerCase(),
                          status: _status, // 0: Rejected, 1: Accepted, 2: Pending
                          claimed: _claimed, // false if proposer didnt claim yet, true if proposer claimed 
                          approvalthreshold: _proposaldata.approvalthreshold,
                          timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"), // blocktimestamp
                          blocknumber: data.number // blocktimestamp
                        };

                        ipcRenderer.send("storeProposal", _NewProposal);
      
                      }



                    
                    });
                  }

                  // If no input (0x) in tx then it is an egaz transfer:
                  if(onetx.input == '0x' && !existTransfertoWallet){

                    // add other check because of existTransfertoWallet, indeed existTransfertoWallet let pass txs that contain transfer events even if tx deosnt belong to wallet
                    // but is not necessary due to (&& !existTransfertoWallet) above:
                    if(!addressListlowercase.includes((onetx.from).toLowerCase()) && !addressListlowercase.includes((onetx.to).toLowerCase())){
                      // leave because tx doesnt belong to wallet
                      return false;
                     }

                    let _inoroutegaz = 'neutral';
                    if(addressListlowercase.includes((onetx.from).toLowerCase())){
                      _inoroutegaz = 'sent';
                     }
                     else if(addressListlowercase.includes((onetx.to).toLowerCase())){
                       _inoroutegaz = 'received';
                     }

                    var Transaction = {
                      block: onetx.blockNumber.toString(),
                      txhash: onetx.hash.toLowerCase(),
                      fromaddr: onetx.from.toLowerCase(),
                      timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                      toaddr: onetx.to.toLowerCase(),
                      value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                      eventtype: 'EgazTransfer',
                      logIndex:null, // index position in the block
                      valueeti:0,
                      fromaddreti: null,
                      toaddreti: null,
                      slashduration: null,
                      inorout: _inoroutegaz
                    };
    
                    // store transaction and notify about new transactions
                    ipcRenderer.send("storeTransaction", Transaction);


                  }
                 
                }
              }
            });


          });

          }

        });
        //console.log('syncTransactionsofWalletAddresses done for block', startBlock);
        return 'done';
      
   /* } else {

      //$("#ResyncTxsProgress").css("display", "block");
      SyncProgress.setText("Syncing transactions is complete.");
      EticaTransactions.setIsSyncing(false);
      return 'done2';
      
    } */
  }


  async ScanTxs(maincounter, lastBlock, batchSize) {

    // Prevent multiple simultaneous scans
    if (EticaTransactions.getIsSyncing()) {
      console.log('[ScanTxs] BLOCKED - scan already in progress');
      return;
    }

    console.log('[ScanTxs] START - initialBlock:', maincounter.block, 'lastBlock:', lastBlock, 'batchSize:', batchSize);

    // sync all the transactions to the current block
    EticaTransactions.setIsSyncing(true);
    // make sure ETICA_ADDRESS is loaded in smartcontract.js and blockchain.js
    EticaTransactions.setEticaContractAddress();
    let startBlock = maincounter.block;
    let data;
    try {
      data = await EticaBlockchain.getAccounts_nocallback();
    } catch (accountsError) {
      console.log('[ScanTxs] Failed to get accounts, connection may be lost:', accountsError);
      EticaTransactions.setIsSyncing(false);
      SyncProgress.setText("Connection error. Restarting...");
      setTimeout(() => {
        window.location.replace('./coolingscanning.html');
      }, 1000);
      return;
    }

    const parallelBlockFetch = 10;
    const initialBlock = maincounter.block;
    const scanStartTime = Date.now();
    var lastEstimateTime = 0;
    var cachedEstimateMinutes = null; // Store calculated estimate to avoid flickering
    const ESTIMATE_INTERVAL_MS = 30000; // Show estimated time every 30 seconds
    const ESTIMATE_DISPLAY_MS = 5000; // Show estimate for 5 seconds
    var batchCount = 0;
    var stopScanning = false;
    var batchInProgress = false; // Guard against overlapping batches (defensive)
    var lastEstimateBlock = initialBlock; // Track block at last estimate for rolling speed calculation
    var lastEstimateTimestamp = scanStartTime;

    // Show initial progress immediately
    SyncProgress.setText(vsprintf("Scanning wallet transactions %d/%d (0%%)", [
      startBlock,
      lastBlock
    ]));

    // Use sequential processing instead of setInterval to avoid race conditions
    async function processNextBatch() {
      if (stopScanning) return;

      // Defensive guard - should not happen with sequential processing but kept for safety
      if (batchInProgress) {
        console.log('[ScanTxs] SKIPPED - previous batch still in progress (unexpected)');
        setTimeout(processNextBatch, 100);
        return;
      }
      batchInProgress = true;

      batchCount++;
      let nextBatchLimit = startBlock + batchSize;
      var maxBlock = Math.min(nextBatchLimit, lastBlock);

      // Debug logging - uncomment for troubleshooting
      // var batchStartTime = Date.now();
      // if (batchCount % 10 === 0) {
      //   console.log('[ScanTxs] Batch #' + batchCount + ' - processing blocks ' + startBlock + ' to ' + maxBlock);
      // }

      try {
        await EticaTransactions.syncTransactionsBatch(data, startBlock, maxBlock, parallelBlockFetch);
        // Debug logging - uncomment for troubleshooting
        // if (batchCount % 10 === 0) {
        //   var batchDuration = Date.now() - batchStartTime;
        //   console.log('[ScanTxs] Batch #' + batchCount + ' completed in ' + batchDuration + 'ms');
        // }
      } catch (batchError) {
        const errorMsg = batchError.message || batchError.toString();
        const isConnectionError = errorMsg.includes('timed out') ||
                                  errorMsg.includes('connection') ||
                                  errorMsg.includes('CONNECTION') ||
                                  errorMsg.includes('ECONNREFUSED') ||
                                  errorMsg.includes('WebSocket');

        if (isConnectionError) {
          console.log('[ScanTxs] Connection error detected, triggering recovery:', errorMsg);
          // Stop scanning and trigger recovery
          stopScanning = true;
          batchInProgress = false;
          if (checkJSHeapInterval) {
            clearInterval(checkJSHeapInterval);
          }
          EticaTransactions.setIsSyncing(false);

          // Save progress before redirecting
          maincounter.block = startBlock;
          ipcRenderer.send("updateCounter", maincounter);

          // Show error and redirect to cooling page to trigger Geth restart
          SyncProgress.setText("Connection lost. Restarting...");
          if (web3Local && web3Local.currentProvider) {
            try {
              web3Local.currentProvider.connection.close();
            } catch (e) {
              // Ignore close errors
            }
          }
          // Redirect to cooling/scanning page which will restart Geth
          setTimeout(() => {
            window.location.replace('./coolingscanning.html');
          }, 1000);
          return;
        }

        console.log('[ScanTxs] Batch processing failed, falling back to sequential:', batchError);
        // Fallback to original method if batch fails (non-connection error)
        try {
          for (var blocknb = startBlock; blocknb <= maxBlock; blocknb++) {
            await EticaTransactions.syncTransactionsofWalletAddresses(data, blocknb, maxBlock);
          }
        } catch (fallbackError) {
          console.log('[ScanTxs] Fallback also failed:', fallbackError);
          // If fallback also fails, continue to next batch
        }
      }

      // Update counter and progress
      maincounter.block = maxBlock;
      ipcRenderer.send("updateCounter", maincounter);
      startBlock = maxBlock + 1;

      // Update progress display every batch
      var progressPercent = Math.floor(maxBlock / lastBlock * 100);
      var currentTime = Date.now();
      var timeSinceLastEstimate = currentTime - lastEstimateTime;

      // Every 30 seconds, calculate and show estimated time for 5 seconds
      // But only after 2 minutes of scanning (to get stable average speed)
      var elapsedSinceStart = currentTime - scanStartTime;
      var MIN_TIME_BEFORE_ESTIMATE = 120000; // 2 minutes

      if (timeSinceLastEstimate >= ESTIMATE_INTERVAL_MS && elapsedSinceStart >= MIN_TIME_BEFORE_ESTIMATE) {
        // Calculate estimate once when entering the display window
        if (cachedEstimateMinutes === null) {
          var elapsedMs = currentTime - scanStartTime;
          var blocksScanned = maxBlock - initialBlock;
          if (blocksScanned > 0) {
            var msPerBlock = elapsedMs / blocksScanned;
            var blocksRemaining = lastBlock - maxBlock;
            cachedEstimateMinutes = Math.round((blocksRemaining * msPerBlock) / 60000);
          }
        }

        // Show cached estimate for 5 seconds
        if (timeSinceLastEstimate < ESTIMATE_INTERVAL_MS + ESTIMATE_DISPLAY_MS && cachedEstimateMinutes !== null) {
          // Format time in human-friendly way
          var estimateText;
          if (cachedEstimateMinutes >= 60) {
            var hours = Math.floor(cachedEstimateMinutes / 60);
            var mins = cachedEstimateMinutes % 60;
            estimateText = hours + "h " + mins + "min";
          } else {
            estimateText = cachedEstimateMinutes + " minutes";
          }
          SyncProgress.setText("Estimated time remaining: " + estimateText);
        } else {
          // Reset timer and clear cache after 5 seconds
          lastEstimateTime = currentTime;
          cachedEstimateMinutes = null;
          SyncProgress.setText(vsprintf("Scanning wallet transactions %d/%d (%d%%)", [
            maxBlock,
            lastBlock,
            progressPercent
          ]));
        }
      } else {
        // Show block progress
        SyncProgress.setText(vsprintf("Scanning wallet transactions %d/%d (%d%%)", [
          maxBlock,
          lastBlock,
          progressPercent
        ]));
      }

      batchInProgress = false; // Release the lock

      // Check if scanning is complete
      if (maxBlock >= lastBlock) {
        console.log('[ScanTxs] COMPLETE - Total batches:', batchCount, 'Final block:', maxBlock);
        stopScanning = true;
        if (checkJSHeapInterval) {
          clearInterval(checkJSHeapInterval);
        }
        EticaTransactions.setIsSyncing(false);
        maincounter.block = maxBlock;
        ipcRenderer.send("updateCounter", maincounter);
        // signal that the sync is complete
        $(document).trigger("onSyncComplete");
        SyncProgress.setText("Scanning transactions is complete.");

        const currentPageURL = window.location.href;
        const url_parts = currentPageURL.split('/');
        const currentPageName = url_parts[url_parts.length - 1];

        // If was on scanning.html redirect to index.html once scanning long txs done.
        if (currentPageName != 'index.html' && currentPageName != 'index.html#') {
          var _wallet = ipcRenderer.sendSync("getRunningWallet");
          ipcRenderer.send("stopGeth", null);

          if (web3Local && web3Local.currentProvider) {
            web3Local.currentProvider.connection.close();
          }

          setTimeout(() => {
            ipcRenderer.send("startGeth", _wallet);
            window.location.replace('./index.html');
          }, 600);

        } else {
          // Check heap usage and reload if too high
          const heapStats = EticaTransactions.getHeapStatistics();
          const MaxHeapSizePercentage = 0.55;
          const limitReference = heapStats.total_available_size * MaxHeapSizePercentage;

          if ((heapStats.total_physical_size >= limitReference) || (heapStats.total_heap_size >= limitReference)) {
            var _wallet = ipcRenderer.sendSync("getRunningWallet");
            ipcRenderer.send("stopGeth", null);

            if (web3Local && web3Local.currentProvider) {
              web3Local.currentProvider.connection.close();
            }

            setTimeout(() => {
              ipcRenderer.send("startGeth", _wallet);
              window.location.replace('./cooling.html');
            }, 600);
          }
        }
        return; // Stop processing
      }

      // Schedule next batch (use setTimeout to allow UI to update)
      setTimeout(processNextBatch, 10);
    }

    // Start processing
    processNextBatch();



  var checkJSHeapInterval = setInterval(function () {
    const MaxHeapSizePercentage = 0.70; // Heap max allowed size is 70% of heapStats.total_available_size
    const heapStats = EticaTransactions.getHeapStatistics();
    const limitReference = heapStats.total_available_size * MaxHeapSizePercentage;

    // Debug logging - uncomment for troubleshooting
    // const physicalPercent = Math.round((heapStats.total_physical_size / heapStats.total_available_size) * 100);
    // const heapPercent = Math.round((heapStats.total_heap_size / heapStats.total_available_size) * 100);
    // console.log('[Heap] Physical:', physicalPercent + '%', '| Heap:', heapPercent + '%', '| Limit:', Math.round(MaxHeapSizePercentage * 100) + '%');

    if( (heapStats.total_physical_size >= limitReference) || (heapStats.total_heap_size >= limitReference)){
      // console.log('[Heap] LIMIT EXCEEDED - triggering cooling page');
      const currentPageURL = window.location.href;
      const url_parts = currentPageURL.split('/');
      const currentPageName = url_parts[url_parts.length - 1];

      if(web3Local && web3Local.currentProvider){
        web3Local.currentProvider.connection.close();
      }
      window.location.replace('./coolingscanning.html'); // will redirect to scanning.html as soon as heap size is ok

    }
    }, 10000);
              
  }


  getHeapStatistics() {
    const heapStatistics = v8.getHeapStatistics();
    return heapStatistics;
  }



  renderTransactions() {
    if (!EticaTransactions.getIsLoading()) {

      EticaTransactions.setIsLoading(true);

      EticaBlockchain.getAccountsData(function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        EticaMainGUI.renderTemplate("transactions.html", data);
        // show the loading overlay for transactions
        $("#loadingTransactionsOverlay").css("display", "block");
        $(document).trigger("render_transactions");
      });
      

      
      async function loadtransactions(){

        var dataTransactions = await ipcRenderer.sendSync("getTransactions");
        var addressList = EticaWallets.getAddressList();

        dataTransactions.forEach(function (element) {
          var isFromValid = addressList.indexOf(element[2].toLowerCase()) > -1;
          var isToValid = addressList.indexOf(element[3].toLowerCase()) > -1;

          if (isToValid && !isFromValid) {
            element.unshift(0);
          } else if (!isToValid && isFromValid) {
            element.unshift(1);
          } else {
            element.unshift(2);
          }
        });

        EticaTableTransactions.initialize("#tableTransactionsForAll", dataTransactions);
        EticaTransactions.setIsLoading(false);

        setTimeout(loadtransactions, 10000);

      }

      loadtransactions();



      /* setTimeout(async () => {
        var dataTransactions = await ipcRenderer.sendSync("getTransactions");
        var addressList = EticaWallets.getAddressList();

        dataTransactions.forEach(function (element) {
          var isFromValid = addressList.indexOf(element[2].toLowerCase()) > -1;
          var isToValid = addressList.indexOf(element[3].toLowerCase()) > -1;

          if (isToValid && !isFromValid) {
            element.unshift(0);
          } else if (!isToValid && isFromValid) {
            element.unshift(1);
          } else {
            element.unshift(2);
          }
        });

        EticaTableTransactions.initialize("#tableTransactionsForAll", dataTransactions);
        EticaTransactions.setIsLoading(false);
      }, 10000); */


    }
  }

  enableKeepInSync() {
    EticaBlockchain.subsribeNewBlockHeaders(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      EticaBlockchain.getBlock(data.number, true, function (error) {
        EticaMainGUI.showGeneralError(error);
      }, function (data) {
        if (data.transactions) {
          let unique_txs = [];

          let options = {
            fromBlock: data.number,
            toBlock: data.number
          };

          EticaBlockchain.getPastEvents(options, function (error) {
            //EticaMainGUI.showGeneralError(error);
            console.log('getPastEvents() error: ', error);
          }, async function (logevents) {

          data.transactions.forEach(onetx => {

            if (onetx.from && onetx.to) {



               // NEED TO CHECK TRANSFERS IN CASE OF BATCHED PAYMENT TRANSFER EVENTS //
               // (for ETI transfers made in batch by batch payment contracts, wallet address is not in tx.from or tx.to):  //
               var existTransfertoWallet = false;

               if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){
               
                var txevents_temp = logevents.filter(function(onelogevent) {
                return onelogevent.transactionHash == onetx.hash;
              });

              var wallettransferevents = txevents_temp.filter(function(onevent) {
                return (onevent.event == 'Transfer' && EticaWallets.getAddressExists((onevent.returnValues.to).toLowerCase()));
              });

              if(wallettransferevents && wallettransferevents.length > 0){
                existTransfertoWallet = true;
              }
            
              }

               // (for ETI transfers made in batch by batch payment contracts, wallet address is not in tx.from or tx.to):  //
               // NEED TO CHECK TRANSFERS IN CASE OF BATCHED PAYMENT TRANSFER EVENTS //


              if (EticaWallets.getAddressExists(onetx.from) || EticaWallets.getAddressExists(onetx.to) || existTransfertoWallet) {

                if (logevents.filter(onevent => onevent.transactionHash === onetx.hash)){

                 /* var txevents = logevents.filter(function(onelogevent) {
                    return onelogevent.transactionHash == onetx.hash;
                  }); */


                  var txevents = logevents.filter(function(onelogevent) {
                    if (onelogevent.event == 'Transfer' && !(EticaWallets.getAddressExists((onelogevent.returnValues.to).toLowerCase()) || EticaWallets.getAddressExists((onelogevent.returnValues.from).toLowerCase()))) {
                      return false; // exclude this element because transfer doesnt belong to this wallet (probably a transfer from a batch payment)
                    } else {
                      return onelogevent.transactionHash == onetx.hash; // keep this element
                    }
                  });

                  // if none transfer events in tx we remove transfers events as main event is not a transfer (unless tx made from another smart contract but we dont handle that case):
                  let nonetransferevents = txevents.filter(function(onevent) {
                    return onevent.event != 'Transfer' 
                  });

                  if(nonetransferevents && nonetransferevents.length > 0){
                    let transferevents = txevents.filter(function(onevent) {
                      return onevent.event == 'Transfer' 
                    });

                    transferevents.forEach(f => {
                      let _eventindex = txevents.findIndex(e => e.logIndex === f.logIndex);
                      txevents.splice(_eventindex,1);
                    });
                  }
                  
                  txevents.forEach( async(onetxevent) => { 
                let _valueeti = 0;
                let _fromaddreti = null;
                let _toaddreti = null;
                let _slashduration = null;
                let _inorout = 'neutral'; // if tx is received: received, if tx is sent: sent
                let includedevents = ['Transfer', 'NewCommit', 'NewProposal', 'NewChunk', 'NewDisease', 'NewFee', 'NewSlash', 'NewReveal', 'NewStake', 'StakeClaimed', 'RewardClaimed', 'NewStakesnap', 'NewStakescsldt', 'TieClaimed', 'NewRecover'];
                var _toaddress = onetx.to.toLowerCase();

                // if event is not among the ones shown to users we skip, example, CreatedPeriod event (event created at new proposal txs for first proposer of the period):
                if(!includedevents.includes(onetxevent.event)){
                   return;
                }

                if(onetxevent.event == 'Transfer'){

                  _valueeti = onetxevent.returnValues.tokens;
                  _fromaddreti = onetxevent.returnValues.from;
                  _toaddreti = onetxevent.returnValues.to;
                  _toaddress = onetxevent.returnValues.to;

                  if(EticaWallets.getAddressExists(onetxevent.returnValues.from)){
                    _inorout = 'sent';
                   }
                   else if(EticaWallets.getAddressExists(onetxevent.returnValues.to)){
                     _inorout = 'received';
                   }

                }

                if(onetxevent.event == 'NewCommit'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues.from;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewProposal'){

                  _valueeti = web3Local.utils.toWei('10', 'ether');
                  _fromaddreti = onetxevent.returnValues._proposer;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewChunk'){

                  _valueeti = web3Local.utils.toWei('5', 'ether');
                  _fromaddreti = onetx.from;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewDisease'){

                  _valueeti = web3Local.utils.toWei('100', 'ether');
                  _fromaddreti = onetx.from;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewFee'){

                  _valueeti = onetxevent.returnValues.fee;
                  _fromaddreti = onetxevent.returnValues.voter;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewSlash'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues.voter;
                  _toaddreti = onetx.to;
                  _slashduration = onetxevent.returnValues.duration;

                }

                if(onetxevent.event == 'NewReveal'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues._voter;
                  _toaddreti = onetx.to;

                }


                if(onetxevent.event == 'NewStake'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues.staker;
                  _toaddreti = onetx.to;

                }
                
                if(onetxevent.event == 'StakeClaimed'){

                  _valueeti = onetxevent.returnValues.stakeamount;
                  _fromaddreti = onetxevent.returnValues.staker;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'RewardClaimed'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues.voter;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'TieClaimed'){

                  _valueeti = 0;
                  _fromaddreti = onetxevent.returnValues.voter;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewStakescsldt'){

                  _valueeti = 0;
                  _fromaddreti = onetxevent.returnValues.staker;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewStakesnap'){

                  _valueeti = onetxevent.returnValues.snapamount;
                  _fromaddreti = onetxevent.returnValues.staker;
                  _toaddreti = onetx.to;

                }

                if(onetxevent.event == 'NewRecover'){

                  _valueeti = onetxevent.returnValues.amount;
                  _fromaddreti = onetxevent.returnValues._voter;
                  _toaddreti = onetx.to;

                }



                var Transaction = {
                  block: onetx.blockNumber.toString(),
                  txhash: onetx.hash.toLowerCase(),
                  fromaddr: onetx.from.toLowerCase(),
                  timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                  toaddr: _toaddress,
                  value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                  eventtype: onetxevent.event,
                  logIndex:onetxevent.logIndex, // index position in the block
                  valueeti: _valueeti,
                  fromaddreti:  _fromaddreti,
                  toaddreti: _toaddreti,
                  slashduration: _slashduration,
                  inorout: _inorout
                };
                
                // store transaction and notify about new transactions
                ipcRenderer.send("storeTransaction", Transaction);

                if(onetxevent.event == 'NewCommit'){

                  let _hashinput = ipcRenderer.sendSync("getHashinput", {commithash: onetxevent.returnValues.votehash});
                  let _commit = ipcRenderer.sendSync("getCommit", {votehash: onetxevent.returnValues.votehash, voter: onetxevent.returnValues._voter});
                  let _hashchoice = null;
                  let _hashvary = null;
                  let _hashproposalhash =null;
                  let _hashproposaltitle =null;
                  let _hashproposalend =null;
                  let _hashproposaldeadline =null;
                  let _timestamp_claimable =null;
                  let _status = 1;

                  // prevent reactualisation of status on resyncs:
                  if(_commit && _commit.status){
                      _status = _commit.status;
                  }

                  if(_hashinput && _hashinput.commithash == onetxevent.returnValues.votehash){
                    _hashchoice = _hashinput.choice;
                    _hashvary = _hashinput.vary;
                     _hashproposalhash = _hashinput.proposalhash;

                     let _proposal = await EticaContract.proposals(_hashinput.proposalhash);
                     let _proposaldata = await EticaContract.propsdatas(_hashinput.proposalhash);
                     _hashproposaltitle = _proposal[6];
                     let _propend = _proposaldata[1]; // endtime

                      // Use cached contract constants with block number for hardfork awareness
                      let contractConsts = await EticaTransactions.getContractConstants(data.number);

                      let _period = await EticaContract.periods(_proposal[3]);
                      let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);

                      _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");
                      _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                     let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME,'seconds');
                       _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");
                    }

                  var _NewCommit = {
                  votehash: onetxevent.returnValues.votehash,
                  txhash: onetx.hash.toLowerCase(),
                  voter: onetxevent.returnValues._voter,
                  timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                  valueeti: _valueeti,
                  choice: _hashchoice,
                  vary: _hashvary,
                  proposalhash: _hashproposalhash,
                  proposaltitle: _hashproposaltitle,
                  proposalend: _hashproposalend,
                  proposaldeadline: _hashproposaldeadline,
                  timestampclaimable: _timestamp_claimable,
                  isDone: false,
                  status: _status,
                  };

                  ipcRenderer.send("storeCommit", _NewCommit);

                }


               if(onetxevent.event == 'NewReveal'){


              let inputs = web3Local.eth.abi.decodeParameters(
              // ERC20 transfer method args
              [
                { type: 'bytes32', name: '_proposed_release_hash' },
                { type: 'bool', name: '_approved' },
                { type: 'string', name: '_vary' }
              ],
              `0x${onetx.input.substring(10)}`
            );


                  let calculatedhash = EticaCommitHistory.calculateHash(inputs._proposed_release_hash, inputs._approved,  onetxevent.returnValues._voter, inputs._vary);

                  let _commit = ipcRenderer.sendSync("getCommit", {votehash: calculatedhash, voter: onetxevent.returnValues._voter});
           
                  if(_commit && _commit.votehash == calculatedhash){

                    let _status = 2;

                    if(_commit.status >= 3){
                            _status = _commit.status;
                    }

                    let _proposal = await EticaContract.proposals(_commit.proposalhash);
                    let _proposaldata = await EticaContract.propsdatas(_commit.proposalhash);

                    // Use cached contract constants with block number for hardfork awareness
                    let contractConsts = await EticaTransactions.getContractConstants(data.number);

                    let _period = await EticaContract.periods(_proposal[3]);
                    let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);
                    let _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

                    let _hashproposaltitle = _proposal[6];
                    let _propend = _proposaldata[1]; // endtime
                    let _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");
                    let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME,'seconds');
                    let _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");

                    var _UpdatedCommit = {
                        votehash: calculatedhash,
                        voter: onetxevent.returnValues._voter,
                        choice: inputs._approved,
                        vary: inputs._vary,
                        proposalhash: _commit.proposalhash,
                        proposaltitle: _hashproposaltitle,
                        proposalend: _hashproposalend,
                        proposaldeadline: _hashproposaldeadline,
                        timestampclaimable: _timestamp_claimable,
                        status: _status
                    };

        ipcRenderer.send("updateCommitwithStatus", _UpdatedCommit);

                 }

                }


                if(onetxevent.event == 'RewardClaimed'){ 
    
                      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});
               
                      if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
    
                        var _UpdatedCommit = {
                            votehash: _commit.votehash,
                            voter: onetxevent.returnValues.voter,
                            status: 3,
                            rewardamount: onetxevent.returnValues.amount
                        };

            ipcRenderer.send("updateCommitRewardAmount", _UpdatedCommit);
  
                     }


                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

                      let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                      let _status = _proposal.status;

                      // make sure we retrieved proposal without issues, to avoid undefinied status:
                      if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                         _status = proposaldata.status;
                      }

                      let _claimed = true;
  
                      var _UpdatedProposal = {
                          proposalhash: _proposal.proposalhash,
                          proposer: onetxevent.returnValues.voter,
                          status: _status,
                          claimed: _claimed,
                          rewardamount: onetxevent.returnValues.amount,
                          fees:0,
                          slashduration:0,
                          slashamount:0
                      };

                      ipcRenderer.send("updateProposalReward", _UpdatedProposal);
  
  
                    } 

                    }


                    if(onetxevent.event == 'NewSlash'){ 
    
                      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});

               
                      if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
    
                        var _UpdatedCommit = {
                            votehash: _commit.votehash,
                            voter: onetxevent.returnValues.voter,
                            status: 3,
                            slashduration: onetxevent.returnValues.duration,
                            slashamount: onetxevent.returnValues.amount
                        };
    
            ipcRenderer.send("updateCommitSlash", _UpdatedCommit);
    
                     }


                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

                      let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                      let _status = _proposal.status;

                      // make sure we retrieved proposal without issues, to avoid undefinied status:
                      if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                         _status = proposaldata.status;
                      }

                      let _claimed = true;
  
                      var _UpdatedProposal = {
                          proposalhash: _proposal.proposalhash,
                          proposer: onetxevent.returnValues.voter,
                          status: _status,
                          claimed: _claimed,
                          slashduration: onetxevent.returnValues.duration,
                          slashamount: onetxevent.returnValues.amount
                      };
  
                      ipcRenderer.send("updateProposalSlash", _UpdatedProposal);
  
                    } 

                    }


                    if(onetxevent.event == 'NewFee'){ 
    
                      let _commit = ipcRenderer.sendSync("getCommitbyProposalHash", {proposalhash: onetxevent.returnValues.proposal_hash, voter: onetxevent.returnValues.voter});
                      let _proposal = ipcRenderer.sendSync("getProposalifOwner", {proposalhash: onetxevent.returnValues.proposal_hash, proposer: onetxevent.returnValues.voter});

               
                      if(_commit && _commit.proposalhash == onetxevent.returnValues.proposal_hash){
    
                        var _UpdatedCommit = {
                            votehash: _commit.votehash,
                            voter: onetxevent.returnValues.voter,
                            status: 3,
                            fee: onetxevent.returnValues.fee
                        };

            ipcRenderer.send("updateCommitFee", _UpdatedCommit);
    
    
                     }



                     if(_proposal && _proposal.proposalhash == onetxevent.returnValues.proposal_hash){

                      let proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposal_hash);
                      let _status = _proposal.status;

                      // make sure we retrieved proposal without issues, to avoid undefinied status:
                      if(proposaldata && (proposaldata.status == 0 || proposaldata.status == 1)){
                         _status = proposaldata.status;
                      }

                      let _claimed = true;
  
                      var _UpdatedProposal = {
                          proposalhash: _proposal.proposalhash,
                          proposer: onetxevent.returnValues.voter,
                          status: _status,
                          claimed: _claimed,
                          fee: onetxevent.returnValues.fee
                      };

                      ipcRenderer.send("updateProposalFee", _UpdatedProposal);
  
                    } 

                    }



                    if(onetxevent.event == 'NewProposal'){

                      let _savedproposal = ipcRenderer.sendSync("getProposal", {proposalhash: onetxevent.returnValues.proposed_release_hash});

                      let _hashproposalend =null;
                      let _hashproposaldeadline =null;
                      let _timestamp_claimable =null;
                      let _status = 2; // pending
                      let _claimed = false;
    
                      // prevent reactualisation of status on resyncs:
                      if(_savedproposal && _savedproposal.status){
                        if ( _savedproposal.status){
                          _status = _savedproposal.status;
                        }

                        if ( _savedproposal.claimed){
                          _claimed = _savedproposal.claimed;
                        }
                      }
    
                         let _proposal = await EticaContract.proposals(onetxevent.returnValues.proposed_release_hash);

                         let _proposaldata = await EticaContract.propsdatas(onetxevent.returnValues.proposed_release_hash);

                         let _propend = _proposaldata[1]; // endtime

                          // Use cached contract constants with block number for hardfork awareness
                          let contractConsts = await EticaTransactions.getContractConstants(data.number);

                          let _period = await EticaContract.periods(_proposal[3]);
                          let seconds_claimable = (parseInt(_period[1]) + parseInt(contractConsts.MIN_CLAIM_INTERVAL)) * parseInt(contractConsts.REWARD_INTERVAL);

                          _timestamp_claimable = moment.unix(seconds_claimable).format("YYYY-MM-DD HH:mm:ss");

                          _hashproposalend = moment.unix(parseInt(_propend)).format("YYYY-MM-DD HH:mm:ss");

                         let _deadline = moment.unix(parseInt(_propend)).add(contractConsts.DEFAULT_REVEALING_TIME,'seconds');
                          _hashproposaldeadline = _deadline.format("YYYY-MM-DD HH:mm:ss");


                         let _diseaseindex = await EticaContract.diseasesbyIds(_proposal.disease_id);
                         let _disease = await EticaContract.diseases(_diseaseindex);
                         let _chunk = await EticaContract.chunks(_proposal.chunk_id);
    
    
                      var _NewProposal = {
                        proposalhash: _proposal.proposed_release_hash,
                        proposer: onetxevent.returnValues._proposer,
                        rawreleasehash:  _proposal.raw_release_hash, // ipfs content
                        title: _proposal.title,
                        diseasename: _disease.name,
                        diseasehash: _disease.disease_hash,
                        chunktitle: _chunk.title,
                        chunkid: _chunk.id,
                        proposalend: _hashproposalend,
                        proposaldeadline: _hashproposaldeadline,
                        timestampclaimable: _timestamp_claimable, // when proposal is claimable
                        txhash: onetx.hash.toLowerCase(),
                        status: _status, // 0: Rejected, 1: Accepted, 2: Pending
                        claimed: _claimed, // false if proposer didnt claim yet, true if proposer claimed 
                        approvalthreshold: _proposaldata.approvalthreshold,
                        timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"), // blocktimestamp
                        blocknumber: data.number // blocktimestamp
                      };
    
                      ipcRenderer.send("storeProposal", _NewProposal);
    
                    }

                $(document).trigger("onNewAccountTransaction");
              
                if(!unique_txs.includes(onetx.hash.toLowerCase())){
                  iziToast.info({
                    title: "New Transaction",
                    message: vsprintf("Transaction from address %s to address %s was just processed", [Transaction.fromaddr, Transaction.toaddr]),
                    position: "topRight",
                    timeout: 10000
                  });
                  unique_txs.push(onetx.hash.toLowerCase());
                }
                

                if (EticaMainGUI.getAppState() == "transactions") {
                  setTimeout(function () {
                    EticaTransactions.renderTransactions();
                  }, 500);
                }



                  
                  });
                }

                // If no input (0x) in tx then it is an egaz transfer:
                if(onetx.input == '0x' && !existTransfertoWallet){

                  // add other check because of existTransfertoWallet, indeed existTransfertoWallet let pass txs that contain transfer events even if tx deosnt belong to wallet
                  // but is not necessary due to (&& !existTransfertoWallet) above:
                  if(!EticaWallets.getAddressExists(onetx.from) && !EticaWallets.getAddressExists(onetx.to)){
                    // leave because tx doesnt belong to wallet
                    return false;
                   }

                  let _inoroutegaz = 'neutral';

                  if(EticaWallets.getAddressExists(onetx.from)){
                    _inoroutegaz = 'sent';
                   }
                   else if(EticaWallets.getAddressExists(onetx.to)){
                     _inoroutegaz = 'received';
                   }


                  var Transaction = {
                    block: onetx.blockNumber.toString(),
                    txhash: onetx.hash.toLowerCase(),
                    fromaddr: onetx.from.toLowerCase(),
                    timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    toaddr: onetx.to.toLowerCase(),
                    value: Number(onetx.value).toExponential(5).toString().replace("+", ""),
                    eventtype: 'EgazTransfer',
                    logIndex:null, // index position in the block
                    valueeti:0,
                    fromaddreti: null,
                    toaddreti: null,
                    slashduration: null,
                    inorout: _inoroutegaz
                  };
 
                  // store transaction and notify about new transactions
                  ipcRenderer.send("storeTransaction", Transaction);             
                  
                $(document).trigger("onNewAccountTransaction");
                if(!unique_txs.includes(onetx.hash.toLowerCase())){
                  iziToast.info({
                    title: "New Transaction",
                    message: vsprintf("Transaction from address %s to address %s was just processed", [Transaction.fromaddr, Transaction.toaddr]),
                    position: "topRight",
                    timeout: 10000
                  });
                  unique_txs.push(onetx.hash.toLowerCase());
                }
                

                if (EticaMainGUI.getAppState() == "transactions") {
                  setTimeout(function () {
                    EticaTransactions.renderTransactions();
                  }, 500);
                }
                }
                
              }
            }
          });

        });
          
        }
      });
    });
  }

  disableKeepInSync() {
    EticaBlockchain.unsubsribeNewBlockHeaders(function (error) {
      EticaMainGUI.showGeneralError(error);
    }, function (data) {
      // success
    });
  }


  setEticaContractAddress() {

    // get running wallet:
    let _wallet = ipcRenderer.sendSync("getRunningWallet");
    
    if(_wallet.contractaddress){
    
      let etica_contract = EticaContract.getEticaContractAddress();
      let etica_blockchain = EticaBlockchain.getEticaContractAddress();
      if(etica_contract != _wallet.contractaddress){
        EticaContract.setEticaContractAddress(_wallet);
      }
      if(etica_blockchain != _wallet.contractaddress){
        EticaBlockchain.setEticaContractAddress(_wallet);
      }
    
    }
    // should never happen:
    else {
      EticaMainGUI.showGeneralError('Error, no smart contract address provided');
    }
  
  }

  
}

// create new transactions variable
EticaTransactions = new Transactions();

