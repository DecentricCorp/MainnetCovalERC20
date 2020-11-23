"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _BasePackageProject = require("./BasePackageProject");

var _BasePackageProject2 = _interopRequireDefault(_BasePackageProject);

var _Package = require("../package/Package");

var _Package2 = _interopRequireDefault(_Package);

var _DeployError = require("../utils/errors/DeployError");

var _Semver = require("../utils/Semver");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PackageProject extends _BasePackageProject2.default {
  static async fetch(packageAddress, version = '0.1.0', txParams) {
    const thepackage = await _Package2.default.fetch(packageAddress, txParams);
    return new this(thepackage, version, txParams);
  }

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  static async fetchOrDeploy(version = '0.1.0', txParams = {}, { packageAddress = undefined } = {}) {
    let thepackage, directory;
    version = (0, _Semver.semanticVersionToString)(version);

    try {
      thepackage = packageAddress ? await _Package2.default.fetch(packageAddress, txParams) : await _Package2.default.deploy(txParams);
      directory = (await thepackage.hasVersion(version)) ? await thepackage.getDirectory(version) : await thepackage.newVersion(version);

      const project = new this(thepackage, version, txParams);
      project.directory = directory;

      return project;
    } catch (deployError) {
      throw new _DeployError.DeployError(deployError.message, { thepackage, directory });
    }
  }

  constructor(thepackage, version = '0.1.0', txParams = {}) {
    super(txParams);
    this.package = thepackage;
    this.version = (0, _Semver.semanticVersionToString)(version);
  }

  async getImplementation({ contractName }) {
    const directory = await this.getCurrentDirectory();
    return directory.getImplementation(contractName);
  }

  async getProjectPackage() {
    return this.package;
  }

  async getCurrentDirectory() {
    if (!this.directory) {
      const thepackage = await this.getProjectPackage();
      this.directory = await thepackage.getDirectory(this.version);
    }
    return this.directory;
  }

  async getCurrentVersion() {
    return this.version;
  }
}
exports.default = PackageProject;