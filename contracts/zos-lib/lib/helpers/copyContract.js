'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('util');

var _Contracts = require('../utils/Contracts');

var _Contracts2 = _interopRequireDefault(_Contracts);

var _Transactions = require('../utils/Transactions');

var _sleep = require('./sleep');

var _sleep2 = _interopRequireDefault(_sleep);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const RECEIPT_CHECK_TIMEBOX = 1000;
const DEPLOYMENT_TIMEOUT_ERROR = 'Contract deployment timed out';

async function sendTransaction(params) {
  if (!params.gas) params.gas = await (0, _Transactions.estimateGas)(params);
  return (0, _util.promisify)(web3.eth.sendTransaction.bind(web3.eth))(params);
}

async function getTransactionReceipt(txHash) {
  let timeout = false;
  const timer = setTimeout(() => timeout = true, _Contracts2.default.getSyncTimeout());

  while (!timeout) {
    const receipt = await (0, _util.promisify)(web3.eth.getTransactionReceipt.bind(web3.eth))(txHash);
    if (receipt) {
      clearTimeout(timer);
      return receipt;
    }
    await (0, _sleep2.default)(RECEIPT_CHECK_TIMEBOX);
  }

  throw Error(DEPLOYMENT_TIMEOUT_ERROR);
}

exports.default = async function copyContract(contractClass, address, txParams = {}) {
  address = address.replace('0x', '');

  // This is EVM assembly will return of the code of a foreign address.
  //
  // operation    | bytecode   | stack representation
  // =================================================
  // push20 ADDR  | 0x73 ADDR  | ADDR
  // dup1         | 0x80       | ADDR ADDR
  // extcodesize  | 0x3B       | ADDR 0xCS
  // dup1         | 0x80       | ADDR 0xCS 0xCS
  // swap2        | 0x91       | 0xCS 0xCS ADDR
  // push1 00     | 0x60 0x00  | 0xCS 0xCS ADDR 0x00
  // dup1         | 0x80       | 0xCS 0xCS ADDR 0x00 0x00
  // swap2        | 0x91       | 0xCS 0xCS 0x00 0x00 ADDR
  // extcodecopy  | 0x3C       | 0xCS
  // push1 00     | 0x60 0x00  | 0xCS 0x00
  // return       | 0xF3       |

  const ASM_CODE_COPY = `0x73${address}803b8091600080913c6000f3`;

  const params = Object.assign({}, contractClass.defaults(), txParams, { to: null, data: ASM_CODE_COPY });
  const txHash = await sendTransaction(params);
  const receipt = await getTransactionReceipt(txHash);
  return contractClass.at(receipt.contractAddress);
};