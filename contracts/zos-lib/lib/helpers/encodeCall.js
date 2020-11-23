'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SCIENTIFIC_NOTATION_PATTERN = undefined;
exports.default = encodeCall;
exports.decodeCall = decodeCall;

var _ethereumjsAbi = require('ethereumjs-abi');

var _ethereumjsAbi2 = _interopRequireDefault(_ethereumjsAbi);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const SCIENTIFIC_NOTATION_PATTERN = exports.SCIENTIFIC_NOTATION_PATTERN = /^\s*[-]?\d+(\.\d+)?e(\+)?\d+\s*$/;

function encodeCall(name, args = [], rawValues = []) {
  const values = rawValues.map(formatValue);
  const methodId = _ethereumjsAbi2.default.methodID(name, args).toString('hex');
  const params = _ethereumjsAbi2.default.rawEncode(args, values).toString('hex');
  return '0x' + methodId + params;
}

function decodeCall(types, data) {
  if (typeof data === 'string') data = Buffer.from(data, 'hex');
  const values = _ethereumjsAbi2.default.rawDecode(types, data);

  types.filter(type => type.startsWith('address')).forEach((type, index) => {
    if (typeof values[index] === 'string') values[index] = `0x${values[index]}`;else values[index] = values[index].map(value => `0x${value}`);
  });

  return values;
}

function formatValue(value) {
  if (_bignumber2.default.isBigNumber(value)) return value.toString(10);
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string' && value.match(SCIENTIFIC_NOTATION_PATTERN)) return new _bignumber2.default(value).toString(10);
  return value;
}