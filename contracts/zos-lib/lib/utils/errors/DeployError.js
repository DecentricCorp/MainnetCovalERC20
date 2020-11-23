'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
class DeployError extends Error {
  constructor(message, props) {
    super(message);
    Object.keys(props).forEach(prop => this[prop] = props[prop]);
  }
}
exports.DeployError = DeployError;