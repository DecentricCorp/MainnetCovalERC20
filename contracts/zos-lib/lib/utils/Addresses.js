'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ZERO_ADDRESS = undefined;
exports.toAddress = toAddress;
exports.isZeroAddress = isZeroAddress;
exports.uint256ToAddress = uint256ToAddress;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ZERO_ADDRESS = exports.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function toAddress(contractOrAddress) {
  if (_lodash2.default.isEmpty(contractOrAddress)) {
    throw Error(`Contract or address expected`);
  } else if (_lodash2.default.isString(contractOrAddress)) {
    return contractOrAddress;
  } else {
    return contractOrAddress.address;
  }
}

function isZeroAddress(address) {
  return !address || address === ZERO_ADDRESS;
}

function uint256ToAddress(uint256) {
  return uint256.toString().replace('0x000000000000000000000000', '0x');
}