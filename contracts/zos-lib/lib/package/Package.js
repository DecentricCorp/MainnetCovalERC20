'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Logger = require('../utils/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _Transactions = require('../utils/Transactions');

var _ImplementationDirectory = require('../directory/ImplementationDirectory');

var _ImplementationDirectory2 = _interopRequireDefault(_ImplementationDirectory);

var _Contracts = require('../utils/Contracts');

var _Contracts2 = _interopRequireDefault(_Contracts);

var _Addresses = require('../utils/Addresses');

var _Semver = require('../utils/Semver');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = new _Logger2.default('Package');

class Package {

  static async fetch(address, txParams = {}) {
    if ((0, _Addresses.isZeroAddress)(address)) return null;
    const Package = _Contracts2.default.getFromLib('Package');
    const packageContract = await Package.at(address);
    return new this(packageContract, txParams);
  }

  static async deploy(txParams = {}) {
    log.info('Deploying new Package...');
    const Package = _Contracts2.default.getFromLib('Package');
    const packageContract = await (0, _Transactions.deploy)(Package, [], txParams);
    log.info(`Deployed Package ${packageContract.address}`);
    return new this(packageContract, txParams);
  }

  constructor(packageContract, txParams = {}) {
    this.packageContract = packageContract;
    this.txParams = txParams;
  }

  get contract() {
    return this.packageContract;
  }

  get address() {
    return this.packageContract.address;
  }

  async hasVersion(version) {
    return this.packageContract.hasVersion((0, _Semver.toSemanticVersion)(version));
  }

  async isFrozen(version) {
    const directory = await this.getDirectory(version);
    return directory.isFrozen();
  }

  async freeze(version) {
    const directory = await this.getDirectory(version);
    if (!directory.freeze) throw Error("Implementation directory does not support freezing");
    return directory.freeze();
  }

  async getImplementation(version, contractName) {
    const directory = await this.getDirectory(version);
    return directory.getImplementation(contractName);
  }

  async newVersion(version, content = "") {
    log.info('Adding new version...');
    const semver = (0, _Semver.toSemanticVersion)(version);
    const directory = await _ImplementationDirectory2.default.deploy(this.txParams);
    await (0, _Transactions.sendTransaction)(this.packageContract.addVersion, [semver, directory.address, content], this.txParams);
    log.info(`Added version ${semver.join('.')}`);
    return directory;
  }

  async getDirectory(version) {
    if (!version) throw Error("Cannot get a directory from a package without specifying a version");
    const directoryAddress = await this.packageContract.getContract((0, _Semver.toSemanticVersion)(version));
    return _ImplementationDirectory2.default.fetch(directoryAddress, this.txParams);
  }
}
exports.default = Package;