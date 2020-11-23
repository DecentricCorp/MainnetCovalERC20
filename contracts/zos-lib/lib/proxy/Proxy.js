'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('util');

var _Contracts = require('../utils/Contracts');

var _Contracts2 = _interopRequireDefault(_Contracts);

var _Addresses = require('../utils/Addresses');

var _Transactions = require('../utils/Transactions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Proxy {
  static at(address, txParams = {}) {
    const ProxyContract = _Contracts2.default.getFromLib('AdminUpgradeabilityProxy');
    const contract = new ProxyContract((0, _Addresses.toAddress)(address));
    return new this(contract, txParams);
  }

  static async deploy(implementation, initData, txParams = {}) {
    const contract = await (0, _Transactions.deploy)(_Contracts2.default.getFromLib('AdminUpgradeabilityProxy'), [(0, _Addresses.toAddress)(implementation), initData || ""], txParams);
    return new this(contract, txParams);
  }

  constructor(contract, txParams = {}) {
    this.contract = contract;
    this.address = (0, _Addresses.toAddress)(contract);
    this.txParams = txParams;
  }

  async upgradeTo(address, migrateData) {
    await this._checkAdmin();
    return migrateData ? (0, _Transactions.sendTransaction)(this.contract.upgradeToAndCall, [(0, _Addresses.toAddress)(address), migrateData], this.txParams) : (0, _Transactions.sendTransaction)(this.contract.upgradeTo, [(0, _Addresses.toAddress)(address)], this.txParams);
  }

  async changeAdmin(newAdmin) {
    await this._checkAdmin();
    return (0, _Transactions.sendTransaction)(this.contract.changeAdmin, [newAdmin], this.txParams);
  }

  async implementation() {
    const position = web3.sha3('org.zeppelinos.proxy.implementation');
    return (0, _Addresses.uint256ToAddress)((await this.getStorageAt(position)));
  }

  async admin() {
    const position = web3.sha3('org.zeppelinos.proxy.admin');
    return (0, _Addresses.uint256ToAddress)((await this.getStorageAt(position)));
  }

  async getStorageAt(position) {
    return (0, _util.promisify)(web3.eth.getStorageAt.bind(web3.eth))(this.address, position);
  }

  async _checkAdmin() {
    const currentAdmin = await this.admin();
    const from = this.txParams.from;
    // TODO: If no `from` is set, load which is the default account and use it to compare against the current admin
    if (from && currentAdmin !== from) {
      throw new Error(`Cannot modify proxy from non-admin account: current admin is ${currentAdmin} and sender is ${from}`);
    }
  }
}
exports.default = Proxy;