'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.validate = validate;
exports.newValidationErrors = newValidationErrors;
exports.validationPasses = validationPasses;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Logger = require('../utils/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _Constructors = require('./Constructors');

var _Instructions = require('./Instructions');

var _Initializers = require('./Initializers');

var _Storage = require('./Storage');

var _Layout = require('./Layout');

var _InitialValues = require('./InitialValues');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = new _Logger2.default('validate');

function validate(contractClass, existingContractInfo = {}, buildArtifacts = null) {
  const storageValidation = validateStorage(contractClass, existingContractInfo, buildArtifacts);
  const uninitializedBaseContracts = [];

  return _extends({
    hasConstructor: (0, _Constructors.hasConstructor)(contractClass),
    hasSelfDestruct: (0, _Instructions.hasSelfDestruct)(contractClass),
    hasDelegateCall: (0, _Instructions.hasDelegateCall)(contractClass),
    hasInitialValuesInDeclarations: (0, _InitialValues.hasInitialValuesInDeclarations)(contractClass),
    uninitializedBaseContracts
  }, storageValidation);
}

function newValidationErrors(validations, existingValidations = {}) {
  const {
    hasConstructor,
    hasSelfDestruct,
    hasDelegateCall,
    hasInitialValuesInDeclarations,
    uninitializedBaseContracts,
    storageDiff,
    storageUncheckedVars
  } = validations;

  return {
    hasConstructor: hasConstructor && !existingValidations.hasConstructor,
    hasSelfDestruct: hasSelfDestruct && !existingValidations.hasSelfDestruct,
    hasDelegateCall: hasDelegateCall && !existingValidations.hasDelegateCall,
    hasInitialValuesInDeclarations: hasInitialValuesInDeclarations && !existingValidations.hasInitialValuesInDeclarations,
    uninitializedBaseContracts: _lodash2.default.difference(uninitializedBaseContracts, existingValidations.uninitializedBaseContracts),
    storageUncheckedVars: _lodash2.default.difference(storageUncheckedVars, existingValidations.storageUncheckedVars),
    storageDiff
  };
}

function validationPasses(validations) {
  const {
    hasConstructor,
    hasSelfDestruct,
    hasDelegateCall,
    hasInitialValuesInDeclarations,
    uninitializedBaseContracts,
    storageDiff
  } = validations;

  return _lodash2.default.every(storageDiff, diff => diff.action === 'append') && !hasConstructor && !hasSelfDestruct && !hasDelegateCall && !hasInitialValuesInDeclarations && _lodash2.default.isEmpty(uninitializedBaseContracts);
}

function validateStorage(contractClass, existingContractInfo = {}, buildArtifacts = null) {
  const originalStorageInfo = _lodash2.default.pick(existingContractInfo, 'storage', 'types');
  if (_lodash2.default.isEmpty(originalStorageInfo.storage)) return {};

  const updatedStorageInfo = (0, _Storage.getStorageLayout)(contractClass, buildArtifacts);
  const storageUncheckedVars = (0, _Storage.getStructsOrEnums)(updatedStorageInfo);
  const storageDiff = (0, _Layout.compareStorageLayouts)(originalStorageInfo, updatedStorageInfo);

  return {
    storageUncheckedVars,
    storageDiff
  };
}

function tryGetUninitializedBaseContracts(contractClass) {
  try {
    return (0, _lodash2.default)((0, _Initializers.getUninitializedBaseContracts)(contractClass)).values().flatten().uniq().value();
  } catch (error) {
    log.error(`- Skipping uninitialized base contracts validation due to error: ${error.message}`);
    return [];
  }
}