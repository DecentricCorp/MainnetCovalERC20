'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Logger = require('../utils/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _decodeLogs = require('../helpers/decodeLogs');

var _decodeLogs2 = _interopRequireDefault(_decodeLogs);

var _copyContract = require('../helpers/copyContract');

var _copyContract2 = _interopRequireDefault(_copyContract);

var _Transactions = require('../utils/Transactions');

var _Addresses = require('../utils/Addresses');

var _ABIs = require('../utils/ABIs');

var _Contracts = require('../utils/Contracts');

var _Contracts2 = _interopRequireDefault(_Contracts);

var _Semver = require('../utils/Semver');

var _2 = require('..');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = new _Logger2.default('App');

class App {

  static async fetch(address, txParams = {}) {
    const appContract = await this.getContractClass().at(address);
    return new this(appContract, txParams);
  }

  static async deploy(txParams = {}) {
    log.info('Deploying new App...');
    const appContract = await (0, _Transactions.deploy)(this.getContractClass(), [], txParams);
    log.info(`Deployed App at ${appContract.address}`);
    return new this(appContract, txParams);
  }

  static getContractClass() {
    return _Contracts2.default.getFromLib('App');
  }

  constructor(appContract, txParams = {}) {
    this.appContract = appContract;
    this.txParams = txParams;
  }

  async getPackage(name) {
    const [address, version] = await this.appContract.getPackage(name);
    const thepackage = await _2.Package.fetch(address, this.txParams);
    return { package: thepackage, version };
  }

  async hasPackage(name, expectedVersion = undefined) {
    const [address, version] = await this.appContract.getPackage(name);
    return !(0, _Addresses.isZeroAddress)(address) && (!expectedVersion || (0, _Semver.semanticVersionEqual)(expectedVersion, version));
  }

  async setPackage(name, packageAddress, version) {
    return await (0, _Transactions.sendTransaction)(this.appContract.setPackage, [name, (0, _Addresses.toAddress)(packageAddress), (0, _Semver.toSemanticVersion)(version)], this.txParams);
  }

  async unsetPackage(name) {
    return await (0, _Transactions.sendTransaction)(this.appContract.unsetPackage, [name], this.txParams);
  }

  get address() {
    return this.appContract.address;
  }

  get contract() {
    return this.appContract;
  }

  async getImplementation(packageName, contractName) {
    return this.appContract.getImplementation(packageName, contractName);
  }

  async getProxyImplementation(proxyAddress) {
    return this.appContract.getProxyImplementation(proxyAddress, this.txParams);
  }

  async hasProvider(name) {
    return (await this.getProvider(name)) != null;
  }

  async getProvider(name) {
    const address = await this.appContract.getProvider(name);
    if ((0, _Addresses.isZeroAddress)(address)) return null;
    return await _2.ImplementationDirectory.fetch(address, this.txParams);
  }

  async changeProxyAdmin(proxyAddress, newAdmin) {
    log.info(`Changing admin for proxy ${proxyAddress} to ${newAdmin}...`);
    await (0, _Transactions.sendTransaction)(this.appContract.changeProxyAdmin, [proxyAddress, newAdmin], this.txParams);
    log.info(`Admin for proxy ${proxyAddress} set to ${newAdmin}`);
  }

  async createContract(contractClass, packageName, contractName, initMethodName, initArgs) {
    const instance = await this._copyContract(packageName, contractName, contractClass);
    await this._initNonUpgradeableInstance(instance, contractClass, packageName, contractName, initMethodName, initArgs);
    return instance;
  }

  async createProxy(contractClass, packageName, contractName, initMethodName, initArgs) {
    const { receipt } = typeof initArgs === 'undefined' ? await this._createProxy(packageName, contractName) : await this._createProxyAndCall(contractClass, packageName, contractName, initMethodName, initArgs);

    log.info(`TX receipt received: ${receipt.transactionHash}`);
    const logs = (0, _decodeLogs2.default)(receipt.logs, this.constructor.getContractClass());
    const address = _lodash2.default.findLast(logs, l => l.event === 'ProxyCreated').args.proxy;
    log.info(`${packageName} ${contractName} proxy: ${address}`);
    return new contractClass(address);
  }

  async upgradeProxy(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs) {
    const { receipt } = typeof initArgs === 'undefined' ? await this._upgradeProxy(proxyAddress, packageName, contractName) : await this._upgradeProxyAndCall(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs);
    log.info(`TX receipt received: ${receipt.transactionHash}`);
    return new contractClass(proxyAddress);
  }

  async _createProxy(packageName, contractName) {
    log.info(`Creating ${packageName} ${contractName} proxy without initializing...`);
    const initializeData = '';
    return (0, _Transactions.sendTransaction)(this.appContract.create, [packageName, contractName, initializeData], this.txParams);
  }

  async _createProxyAndCall(contractClass, packageName, contractName, initMethodName, initArgs) {
    const { method: initMethod, callData } = (0, _ABIs.buildCallData)(contractClass, initMethodName, initArgs);
    log.info(`Creating ${packageName} ${contractName} proxy and calling ${(0, _ABIs.callDescription)(initMethod, initArgs)}`);
    return (0, _Transactions.sendTransaction)(this.appContract.create, [packageName, contractName, callData], this.txParams);
  }

  async _upgradeProxy(proxyAddress, packageName, contractName) {
    log.info(`Upgrading ${packageName} ${contractName} proxy without running migrations...`);
    return (0, _Transactions.sendTransaction)(this.appContract.upgrade, [proxyAddress, packageName, contractName], this.txParams);
  }

  async _upgradeProxyAndCall(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs) {
    const { method: initMethod, callData } = (0, _ABIs.buildCallData)(contractClass, initMethodName, initArgs);
    log.info(`Upgrading ${packageName} ${contractName} proxy and calling ${(0, _ABIs.callDescription)(initMethod, initArgs)}...`);
    return (0, _Transactions.sendTransaction)(this.appContract.upgradeAndCall, [proxyAddress, packageName, contractName, callData], this.txParams);
  }

  async _copyContract(packageName, contractName, contractClass) {
    log.info(`Creating new non-upgradeable instance of ${packageName} ${contractName}...`);
    const implementation = await this.getImplementation(packageName, contractName);
    const instance = await (0, _copyContract2.default)(contractClass, implementation, this.txParams);
    log.info(`${packageName} ${contractName} instance created at ${instance.address}`);
    return instance;
  }

  async _initNonUpgradeableInstance(instance, contractClass, packageName, contractName, initMethodName, initArgs) {
    if (typeof initArgs !== 'undefined') {
      // this could be front-run, waiting for new initializers model
      const { method: initMethod, callData } = (0, _ABIs.buildCallData)(contractClass, initMethodName, initArgs);
      log.info(`Initializing ${packageName} ${contractName} instance at ${instance.address} by calling ${(0, _ABIs.callDescription)(initMethod, initArgs)}`);
      await (0, _Transactions.sendDataTransaction)(instance, Object.assign({}, this.txParams, { data: callData }));
    }
  }
}
exports.default = App;