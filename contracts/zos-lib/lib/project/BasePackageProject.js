"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Transactions = require("../utils/Transactions");

var _Logger = require("../utils/Logger");

var _Logger2 = _interopRequireDefault(_Logger);

var _Semver = require("../utils/Semver");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = new _Logger2.default('PackageProject');

class BasePackageProject {

  constructor(txParams) {
    this.txParams = txParams;
  }

  async newVersion(version) {
    const thepackage = await this.getProjectPackage();
    const directory = await thepackage.newVersion(version);
    this.directory = directory;
    this.version = (0, _Semver.semanticVersionToString)(version);
    return directory;
  }

  // TODO: Testme
  async freeze() {
    const version = await this.getCurrentVersion();
    log.info(`Freezing version ${version}...`);
    const directory = await this.getCurrentDirectory();
    await directory.freeze();
    log.info(`Version ${version} has been frozen`);
  }

  async setImplementation(contractClass, contractName) {
    if (!contractName) contractName = contractClass.contractName;
    log.info(`Setting implementation of ${contractName} in directory...`);
    const implementation = await (0, _Transactions.deploy)(contractClass, [], this.txParams);
    const directory = await this.getCurrentDirectory();
    await directory.setImplementation(contractName, implementation.address);
    log.info(`Implementation set: ${implementation.address}`);
    return implementation;
  }

  async unsetImplementation(contractName) {
    log.info(`Unsetting implementation of ${contractName}...`);
    const directory = await this.getCurrentDirectory();
    await directory.unsetImplementation(contractName);
  }

  async registerImplementation(contractName, { address }) {
    log.info(`Registering implementation of ${contractName} at ${address} in directory...`);
    const directory = await this.getCurrentDirectory();
    await directory.setImplementation(contractName, address);
  }

  async getCurrentDirectory() {
    throw Error("Unimplemented");
  }

  async getProjectPackage() {
    throw Error("Unimplemented");
  }

  async getCurrentVersion() {
    throw Error("Unimplemented");
  }
}
exports.default = BasePackageProject;