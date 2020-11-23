'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toSemanticVersion = toSemanticVersion;
exports.semanticVersionToString = semanticVersionToString;
exports.semanticVersionEqual = semanticVersionEqual;

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toSemanticVersion(version) {
  if (_lodash2.default.isString(version)) {
    const semanticVersion = _semver2.default.parse(version);
    if (!semanticVersion) throw Error(`Cannot parse version identifier ${version}`);
    return [semanticVersion.major, semanticVersion.minor, semanticVersion.patch];
  } else if (_lodash2.default.isArray(version) && version.length === 3) {
    return version.map(x => x.toNumber ? x.toNumber() : x);
  } else {
    throw Error(`Cannot parse version identifier ${version}`);
  }
}

function semanticVersionToString(version) {
  if (_lodash2.default.isString(version)) {
    return version;
  } else if (_lodash2.default.isArray(version)) {
    return version.join('.');
  } else {
    throw Error(`Cannot handle version identifier ${_util2.default.inspect(version)}`);
  }
}

function semanticVersionEqual(v1, v2) {
  const semver1 = toSemanticVersion(v1),
        semver2 = toSemanticVersion(v2);
  return semver1[0] === semver2[0] && semver1[1] === semver2[1] && semver1[2] === semver2[2];
}

exports.default = {
  toSemanticVersion,
  semanticVersionToString,
  semanticVersionEqual
};