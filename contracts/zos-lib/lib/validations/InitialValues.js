'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasInitialValuesInDeclarations = hasInitialValuesInDeclarations;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Contracts = require('../utils/Contracts');

var _Contracts2 = _interopRequireDefault(_Contracts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function hasInitialValuesInDeclarations(contractClass) {
  return detectInitialValues(contractClass);
}

function detectInitialValues(contractClass) {
  const nodes = contractClass.ast.nodes.filter(n => n.name === contractClass.contractName);
  for (let node of nodes) {
    if (hasInitialValues(node)) return true;
    for (let baseContract of node.baseContracts || []) {
      const parentContract = _Contracts2.default.getFromLocal(baseContract.baseName.name);
      return detectInitialValues(parentContract);
    }
  }
  return false;
}

function hasInitialValues(node) {
  const initializedVariables = node.nodes.filter(node => !node.constant && node.nodeType === 'VariableDeclaration').filter(node => node.value != null);

  return !_lodash2.default.isEmpty(initializedVariables);
}