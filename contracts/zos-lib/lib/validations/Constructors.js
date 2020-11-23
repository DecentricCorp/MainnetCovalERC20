"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasConstructor = hasConstructor;
function hasConstructor(contractClass) {
  return !!contractClass.abi.find(fn => fn.type === "constructor");
}