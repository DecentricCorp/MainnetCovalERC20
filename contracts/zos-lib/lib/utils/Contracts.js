'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _truffleContract = require('truffle-contract');

var _truffleContract2 = _interopRequireDefault(_truffleContract);

var _truffleProvisioner = require('truffle-provisioner');

var _truffleProvisioner2 = _interopRequireDefault(_truffleProvisioner);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEFAULT_TESTING_TX_PARAMS = {
  gas: 6721975,
  gasPrice: 100000000000
};

const DEFAULT_COVERAGE_TX_PARAMS = {
  gas: 0xfffffffffff,
  gasPrice: 0x01

  // Use same default timeout as truffle
};let syncTimeout = 240000;

// Cache truffle config
let truffleConfig = null;

exports.default = {
  getSyncTimeout() {
    return syncTimeout;
  },

  setSyncTimeout(value) {
    syncTimeout = value;
  },

  getLocalPath(contractName) {
    const buildDir = this.getLocalBuildDir();
    return `${buildDir}/${contractName}.json`;
  },

  getLocalBuildDir() {
    return this.getTruffleConfig().contracts_build_directory || `${process.cwd()}/build/contracts`;
  },

  getLibPath(contractName) {
    return _path2.default.resolve(__dirname, `../../build/contracts/${contractName}.json`);
  },

  getNodeModulesPath(dependency, contractName) {
    return `${process.cwd()}/node_modules/${dependency}/build/contracts/${contractName}.json`;
  },

  getFromLocal(contractName) {
    return this._getFromPath(this.getLocalPath(contractName));
  },

  getFromLib(contractName) {
    return this._getFromPath(this.getLibPath(contractName));
  },

  getFromNodeModules(dependency, contractName) {
    return this._getFromPath(this.getNodeModulesPath(dependency, contractName));
  },

  getTruffleConfig() {
    if (!truffleConfig) {
      try {
        const TruffleConfig = require('truffle-config');
        truffleConfig = TruffleConfig.detect({ logger: console });
      } catch (_err) {
        return {};
      }
    }
    return truffleConfig;
  },

  listBuildArtifacts() {
    const buildDir = this.getLocalBuildDir();
    return _glob2.default.sync(`${buildDir}/*.json`);
  },

  artifactsDefaults() {
    if (typeof artifacts === 'undefined' || !artifacts) {
      return {};
    }
    return artifacts.options || {};
  },

  _getFromPath(path) {
    const contract = (0, _truffleContract2.default)(require(path));
    return process.env.NODE_ENV === 'test' ? this._provideContractForTesting(contract) : this._provideContractForProduction(contract);
  },

  _provideContractForProduction(contract) {
    (0, _truffleProvisioner2.default)(contract, this.artifactsDefaults());
    contract.synchronization_timeout = syncTimeout;
    return contract;
  },

  _provideContractForTesting(contract) {
    const defaults = process.env.SOLIDITY_COVERAGE ? DEFAULT_COVERAGE_TX_PARAMS : DEFAULT_TESTING_TX_PARAMS;
    contract.setProvider(web3.currentProvider);
    contract.defaults(_extends({ from: web3.eth.accounts[0] }, defaults));
    contract.synchronization_timeout = syncTimeout;
    contract.setNetwork('test');
    return contract;
  }
};