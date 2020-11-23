'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Semver = require('../../utils/Semver');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

module.exports = function (chai, utils) {
  const Assertion = chai.Assertion;

  Assertion.addProperty('nonzeroAddress', function () {
    this.assert(this._obj && this._obj.length === 42 && this._obj.startsWith('0x') && this._obj !== ZERO_ADDRESS, 'expected #{this} to be a non-zero address', 'expected #{this} to not be a non-zero address');
  });

  Assertion.addProperty('zeroAddress', function () {
    this.assert(this._obj && this._obj.length === 42 && this._obj.startsWith('0x') && this._obj === ZERO_ADDRESS, 'expected #{this} to be a zero address', 'expected #{this} to not be a zero address');
  });

  Assertion.addMethod('semverEqual', function (expected) {
    this.assert((0, _Semver.semanticVersionEqual)(this._obj, expected), 'expected #{this} to equal #{exp} but got #{act}', 'expected #{this} to not equal #{exp} but got #{act}', (0, _Semver.toSemanticVersion)(expected).join('.'), (0, _Semver.toSemanticVersion)(this._obj).join('.'));
  });
};