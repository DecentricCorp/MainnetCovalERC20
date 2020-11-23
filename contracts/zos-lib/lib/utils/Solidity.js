'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flattenSourceCode = flattenSourceCode;

var _truffleFlattener = require('truffle-flattener');

var _truffleFlattener2 = _interopRequireDefault(_truffleFlattener);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function flattenSourceCode(contract) {
  return (0, _truffleFlattener2.default)(contract);
}