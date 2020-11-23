"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _BasePackageProject = require("./BasePackageProject");

var _BasePackageProject2 = _interopRequireDefault(_BasePackageProject);

var _App = require("../app/App");

var _App2 = _interopRequireDefault(_App);

var _Package = require("../package/Package");

var _Package2 = _interopRequireDefault(_Package);

var _DeployError = require("../utils/errors/DeployError");

var _Semver = require("../utils/Semver");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEFAULT_NAME = 'main';
const DEFAULT_VERSION = '0.1.0';

class AppProject extends _BasePackageProject2.default {

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  static async fetchOrDeploy(name = DEFAULT_NAME, version = DEFAULT_VERSION, txParams = {}, { appAddress = undefined, packageAddress = undefined } = {}) {
    let thepackage, directory, app;
    version = (0, _Semver.semanticVersionToString)(version);

    try {
      app = appAddress ? await _App2.default.fetch(appAddress, txParams) : await _App2.default.deploy(txParams);
      if (packageAddress) {
        thepackage = await _Package2.default.fetch(packageAddress, txParams);
      } else if (await app.hasPackage(name, version)) {
        thepackage = (await app.getPackage(name)).package;
      } else {
        thepackage = await _Package2.default.deploy(txParams);
      }
      directory = (await thepackage.hasVersion(version)) ? await thepackage.getDirectory(version) : await thepackage.newVersion(version);
      if (!(await app.hasPackage(name, version))) await app.setPackage(name, thepackage.address, version);
      const project = new this(app, name, version, txParams);
      project.directory = directory;
      project.package = thepackage;
      return project;
    } catch (deployError) {
      throw new _DeployError.DeployError(deployError.message, { thepackage, directory, app });
    }
  }

  // REFACTOR: This code is similar to the SimpleProjectDeployer, consider unifying them
  static async fromSimpleProject(simpleProject, version = DEFAULT_VERSION, existingAddresses = {}) {
    const appProject = await this.fetchOrDeploy(simpleProject.name, version, simpleProject.txParams, existingAddresses);

    await Promise.all(_lodash2.default.concat(_lodash2.default.map(simpleProject.implementations, (contractInfo, contractAlias) => appProject.registerImplementation(contractAlias, contractInfo)), _lodash2.default.map(simpleProject.dependencies, (dependencyInfo, dependencyName) => appProject.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version))));
    return appProject;
  }

  constructor(app, name = DEFAULT_NAME, version = DEFAULT_VERSION, txParams = {}) {
    super(txParams);
    this.app = app;
    this.name = name;
    this.version = (0, _Semver.semanticVersionToString)(version);
  }

  async newVersion(version) {
    version = (0, _Semver.semanticVersionToString)(version);
    const directory = await super.newVersion(version);
    const thepackage = await this.getProjectPackage();
    await this.app.setPackage(this.name, thepackage.address, version);
    return directory;
  }

  getApp() {
    return this.app;
  }

  async getProjectPackage() {
    if (!this.package) {
      const packageInfo = await this.app.getPackage(this.name);
      this.package = packageInfo.package;
    }
    return this.package;
  }

  async getCurrentDirectory() {
    if (!this.directory) {
      this.directory = await this.app.getProvider(this.name);
    }
    return this.directory;
  }

  async getCurrentVersion() {
    return this.version;
  }

  // TODO: Testme
  async getImplementation({ packageName, contractName }) {
    return this.app.getImplementation(packageName || this.name, contractName);
  }

  // TODO: Testme
  async createContract(contractClass, { packageName, contractName, initMethod, initArgs } = {}) {
    if (!contractName) contractName = contractClass.contractName;
    if (!packageName) packageName = this.name;
    return this.app.createContract(contractClass, packageName, contractName, initMethod, initArgs);
  }

  async createProxy(contractClass, { packageName, contractName, initMethod, initArgs } = {}) {
    if (!contractName) contractName = contractClass.contractName;
    if (!packageName) packageName = this.name;
    if (!_lodash2.default.isEmpty(initArgs) && !initMethod) initMethod = 'initialize';
    return this.app.createProxy(contractClass, packageName, contractName, initMethod, initArgs);
  }

  async upgradeProxy(proxyAddress, contractClass, { packageName, contractName, initMethod, initArgs } = {}) {
    if (!contractName) contractName = contractClass.contractName;
    if (!packageName) packageName = this.name;
    return this.app.upgradeProxy(proxyAddress, contractClass, packageName, contractName, initMethod, initArgs);
  }

  async changeProxyAdmin(proxyAddress, newAdmin) {
    return this.app.changeProxyAdmin(proxyAddress, newAdmin);
  }

  async getDependencyPackage(name) {
    const packageInfo = await this.app.getPackage(name);
    return packageInfo.package;
  }

  async getDependencyVersion(name) {
    const packageInfo = await this.app.getPackage(name);
    return packageInfo.version;
  }

  async hasDependency(name) {
    return this.app.hasPackage(name);
  }

  async setDependency(name, packageAddress, version) {
    return this.app.setPackage(name, packageAddress, version);
  }

  async unsetDependency(name) {
    return this.app.unsetPackage(name);
  }
}
exports.default = AppProject;