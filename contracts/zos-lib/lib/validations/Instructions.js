"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasSelfDestruct = hasSelfDestruct;
exports.hasDelegateCall = hasDelegateCall;

var _Contracts = require("../utils/Contracts");

var _Contracts2 = _interopRequireDefault(_Contracts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function hasSelfDestruct(contractClass) {
  return hasTypeIdentifier(contractClass, "t_function_selfdestruct_nonpayable$_t_address_$returns$__$");
}

function hasDelegateCall(contractClass) {
  return hasTypeIdentifier(contractClass, "t_function_baredelegatecall_nonpayable$__$returns$_t_bool_$");
}

function hasTypeIdentifier(contractClass, typeIdentifier) {
  for (const node of contractClass.ast.nodes.filter(n => n.name === contractClass.contractName)) {
    if (hasKeyValue(node, "typeIdentifier", typeIdentifier)) return true;
    for (const baseContract of node.baseContracts || []) {
      if (hasTypeIdentifier(_Contracts2.default.getFromLocal(baseContract.baseName.name), typeIdentifier)) return true;
    }
  }
  return false;
}

function hasKeyValue(data, key, value) {
  if (!data) return false;
  if (data[key] === value) return true;
  for (const childKey in data) {
    if (typeof data[childKey] === 'object' && hasKeyValue(data[childKey], key, value)) return true;
  }
  return false;
}