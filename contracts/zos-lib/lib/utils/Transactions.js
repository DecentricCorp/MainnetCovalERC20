'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.state = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; // This util has public sendTransaction and deploy methods that estimate the gas
// of a transaction or contract deployment, and then inject that esimation into
// the original call. This should actually be handled by the contract abstraction,
// but is only part of the next branch in truffle, so we are handling it manually.
// (see https://github.com/trufflesuite/truffle-contract/pull/95/files#diff-26bcc3534c5a2e62e22643287a7d3295R145)

exports.sendTransaction = sendTransaction;
exports.deploy = deploy;
exports.sendDataTransaction = sendDataTransaction;
exports.estimateGas = estimateGas;
exports.estimateActualGasFnCall = estimateActualGasFnCall;
exports.estimateActualGas = estimateActualGas;
exports.isGanacheNode = isGanacheNode;
exports.awaitConfirmations = awaitConfirmations;
exports.hasBytecode = hasBytecode;

var _util = require('util');

var _sleep = require('../helpers/sleep');

var _sleep2 = _interopRequireDefault(_sleep);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _Contracts = require('./Contracts');

var _Contracts2 = _interopRequireDefault(_Contracts);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Cache, exported for testing
const state = exports.state = {};

// API for gas price guesses
const GAS_API_URL = "https://ethgasstation.info/json/ethgasAPI.json";

// Gas estimates are multiplied by this value to allow for an extra buffer (for reference, truffle-next uses 1.25)
const GAS_MULTIPLIER = 1.25;

// Max number of retries for transactions or queries
const RETRY_COUNT = 3;

// Time to sleep between retries for query operations
const RETRY_SLEEP_TIME = process.env.NODE_ENV === 'test' ? 1 : 3000;

// Truffle defaults gas price to 100gwei
const TRUFFLE_DEFAULT_GAS_PRICE = (0, _bignumber2.default)(100000000000);

/**
 * Wraps the _sendTransaction function and manages transaction retries
 * @param contractFn contract function to be executed as the transaction
 * @param args arguments of the call (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 * @param retries number of transaction retries
 */
async function sendTransaction(contractFn, args = [], txParams = {}, retries = RETRY_COUNT) {
  await fixGasPrice(txParams);

  try {
    return await _sendTransaction(contractFn, args, txParams);
  } catch (error) {
    if (!error.message.match(/nonce too low/) || retries <= 0) throw Error(error);
    return sendTransaction(contractFn, args, txParams, retries - 1);
  }
}

/**
 * Wraps the _deploy and manages deploy retries
 * @param contract truffle contract to be deployed
 * @param args arguments of the constructor (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 * @param retries number of deploy retries
 */
async function deploy(contract, args = [], txParams = {}, retries = RETRY_COUNT) {
  await fixGasPrice(txParams);

  try {
    return await _deploy(contract, args, txParams);
  } catch (error) {
    if (!error.message.match(/nonce too low/) || retries <= 0) throw Error(error);
    return deploy(contract, args, txParams, retries - 1);
  }
}

/**
 * Sends a transaction to the blockchain with data precalculated
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contract contract instance to send the tx to
 * @param txParams all transaction parameters (data, from, gasPrice, etc)
 */
async function sendDataTransaction(contract, txParams) {
  // TODO: Add retries similar to sendTransaction
  await fixGasPrice(txParams);

  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contract.sendTransaction(txParams);
  }
  // Estimate gas for the call and run the tx
  const gas = await estimateActualGas(_extends({ to: contract.address }, txParams));
  return contract.sendTransaction(_extends({ gas }, txParams));
}

/**
 * Sends a transaction to the blockchain, estimating the gas to be used.
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contractFn contract function to be executed as the transaction
 * @param args arguments of the call (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 */
async function _sendTransaction(contractFn, args = [], txParams = {}) {
  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contractFn(...args, txParams);
  }

  // Estimate gas for the call
  const gas = await estimateActualGasFnCall(contractFn, args, txParams);

  return contractFn(...args, _extends({ gas }, txParams));
}

/**
 * Deploys a contract to the blockchain, estimating the gas to be used.
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contract truffle contract to be deployed
 * @param args arguments of the constructor (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 */
async function _deploy(contract, args = [], txParams = {}) {
  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contract.new(...args, txParams);
  }

  // Required by truffle
  await contract.detectNetwork();

  // Get raw binary transaction for creating the contract
  const txOpts = _extends({ data: contract.binary }, txParams);
  const txData = web3.eth.contract(contract.abi).new.getData(...args, txOpts);

  // Deploy the contract using estimated gas
  const gas = await estimateActualGas(_extends({ data: txData }, txParams));
  return contract.new(...args, _extends({ gas }, txParams));
}

async function estimateGas(txParams, retries = RETRY_COUNT) {
  // Use json-rpc method estimateGas to retrieve estimated value
  const estimateFn = (0, _util.promisify)(web3.eth.estimateGas.bind(web3.eth));

  // Retry if estimate fails. This could happen because we are depending
  // on a previous transaction being mined that still hasn't reach the node
  // we are working with, if the txs are routed to different nodes.
  // See https://github.com/zeppelinos/zos/issues/192 for more info.
  try {
    return await estimateFn(txParams);
  } catch (error) {
    if (retries <= 0) throw Error(error);
    await (0, _sleep2.default)(RETRY_SLEEP_TIME);
    return await estimateGas(txParams, retries - 1);
  }
}

async function estimateActualGasFnCall(contractFn, args, txParams, retries = RETRY_COUNT) {
  // Retry if estimate fails. This could happen because we are depending
  // on a previous transaction being mined that still hasn't reach the node
  // we are working with, if the txs are routed to different nodes.
  // See https://github.com/zeppelinos/zos/issues/192 for more info.
  try {
    return await calculateActualGas((await contractFn.estimateGas(...args, txParams)));
  } catch (error) {
    if (retries <= 0) throw Error(error);
    await (0, _sleep2.default)(RETRY_SLEEP_TIME);
    return estimateActualGasFnCall(contractFn, args, txParams, retries - 1);
  }
}

async function estimateActualGas(txParams) {
  const estimatedGas = await estimateGas(txParams);
  return await calculateActualGas(estimatedGas);
}

async function getNodeVersion() {
  if (!state.nodeInfo) {
    state.nodeInfo = await (0, _util.promisify)(web3.version.getNode.bind(web3.version))();
  }
  return state.nodeInfo;
}

async function getNetwork() {
  if (!state.network) {
    state.network = await (0, _util.promisify)(web3.version.getNetwork.bind(global.web3.version))();
  }
  return state.network;
}

async function getETHGasStationPrice() {
  if (state.gasPrice) return state.gasPrice;

  try {
    const { data: responseData } = await _axios2.default.get(GAS_API_URL);
    const gasPriceGwei = responseData.average / 10;
    const gasPrice = gasPriceGwei * 1e9;

    state.gasPrice = gasPrice;
    return state.gasPrice;
  } catch (err) {
    throw new Error(`Could not query gas price API to determine reasonable gas price, please provide one.`);
  }
}

async function fixGasPrice(txParams) {
  const network = await getNetwork();

  const gasPrice = txParams.gasPrice || _Contracts2.default.artifactsDefaults().gasPrice;

  if (TRUFFLE_DEFAULT_GAS_PRICE.eq(gasPrice) || !gasPrice) {
    if (network != '1') {
      return;
    }

    txParams.gasPrice = await getETHGasStationPrice();

    if (TRUFFLE_DEFAULT_GAS_PRICE.lte(txParams.gasPrice)) {
      throw new Error("The current gas price estimate from ethgasstation.info is over 100 gwei. If you do want to send a transaction with a gas price this high, please set it manually in your truffle.js configuration file.");
    }
  }

  return;
}

async function isGanacheNode() {
  const nodeVersion = await getNodeVersion();
  return nodeVersion.match(/TestRPC/);
}

async function getBlockGasLimit() {
  if (state.block) return state.block.gasLimit;
  state.block = await (0, _util.promisify)(web3.eth.getBlock.bind(web3.eth))('latest');
  return state.block.gasLimit;
}

async function calculateActualGas(estimatedGas) {
  const blockLimit = await getBlockGasLimit();
  let gasToUse = parseInt(estimatedGas * GAS_MULTIPLIER);
  // Ganache has a bug (https://github.com/trufflesuite/ganache-core/issues/26) that causes gas 
  // refunds to be included in the gas estimation; but the transaction needs to send the total
  // amount of gas to work. Geth and Parity return the correct value, so here we are adding the
  // value of the refund of setting a storage position to zero (which we do on unsetImplementation).
  // This is a viable workaround as long as we don't have other methods that have higher refunds,
  // such as cleaning more storage positions or selfdestructing a contract. We should be able to fix
  // this once the issue is resolved.
  if (await isGanacheNode()) gasToUse += 15000;
  return gasToUse >= blockLimit ? blockLimit - 1 : gasToUse;
}

async function awaitConfirmations(transactionHash, confirmations = 12, interval = 1000, timeout = 10 * 60 * 1000) {
  if (await isGanacheNode()) return;
  const getTxBlock = () => (0, _util.promisify)(web3.eth.getTransactionReceipt.bind(web3.eth))(transactionHash).then(r => r.blockNumber);
  const getCurrentBlock = () => (0, _util.promisify)(web3.eth.getBlock.bind(web3.eth))('latest').then(b => b.number);
  const now = +new Date();

  while (true) {
    if (new Date() - now > timeout) {
      throw new Error(`Exceeded timeout of ${timeout / 1000} seconds awaiting confirmations for transaction ${transactionHash}`);
    }
    const currentBlock = await getCurrentBlock();
    const txBlock = await getTxBlock();
    if (currentBlock - txBlock >= confirmations) return true;
    await (0, _sleep2.default)(interval);
  }
}

async function hasBytecode(address) {
  const bytecode = await (0, _util.promisify)(web3.eth.getCode.bind(web3.eth))(address);
  return bytecode.length > 2;
}