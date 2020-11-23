'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Logger = require('../utils/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _Transactions = require('../utils/Transactions');

var _Contracts = require('../utils/Contracts');

var _Contracts2 = _interopRequireDefault(_Contracts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = new _Logger2.default('ImplementationDirectory');

class ImplementationDirectory {

  static async deploy(txParams = {}) {
    const contractClass = this.getContractClass();
    log.info(`Deploying new ${contractClass.contractName}...`);
    const directory = await (0, _Transactions.deploy)(contractClass, [], txParams);
    log.info(`Deployed ${contractClass.contractName} at ${directory.address}`);
    return new this(directory, txParams);
  }

  static async fetch(address, txParams = {}) {
    const klazz = this.getContractClass();
    const directory = await klazz.at(address);
    return new this(directory, txParams);
  }

  static getContractClass() {
    return _Contracts2.default.getFromLib('ImplementationDirectory');
  }

  constructor(directory, txParams = {}) {
    this.directoryContract = directory;
    this.txParams = txParams;
  }

  get contract() {
    return this.directoryContract;
  }

  get address() {
    return this.directoryContract.address;
  }

  async owner() {
    return this.directoryContract.owner(this.txParams);
  }

  async getImplementation(contractName) {
    if (!contractName) throw Error('Contract name is required to retrieve an implementation');
    return await this.directoryContract.getImplementation(contractName, this.txParams);
  }

  async setImplementation(contractName, implementationAddress) {
    log.info(`Setting ${contractName} implementation ${implementationAddress}...`);
    await (0, _Transactions.sendTransaction)(this.directoryContract.setImplementation, [contractName, implementationAddress], this.txParams);
    log.info(`Implementation set ${implementationAddress}`);
  }

  async unsetImplementation(contractName) {
    log.info(`Unsetting ${contractName} implementation...`);
    await (0, _Transactions.sendTransaction)(this.directoryContract.unsetImplementation, [contractName], this.txParams);
    log.info(`${contractName} implementation unset`);
  }

  async freeze() {
    log.info('Freezing implementation directory...');
    await (0, _Transactions.sendTransaction)(this.directoryContract.freeze, [], this.txParams);
    log.info('Frozen');
  }

  async isFrozen() {
    return await this.directoryContract.frozen();
  }
}
exports.default = ImplementationDirectory;