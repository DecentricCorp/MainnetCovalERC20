"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBuildArtifacts = getBuildArtifacts;

var _Contracts = require("../utils/Contracts");

var _Contracts2 = _interopRequireDefault(_Contracts);

var _FileSystem = require("../utils/FileSystem");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getBuildArtifacts() {
  return new BuildArtifacts(_Contracts2.default.listBuildArtifacts());
}

class BuildArtifacts {
  constructor(artifactsPaths) {
    this.sourcesToArtifacts = {};
    artifactsPaths.forEach(path => {
      const artifact = (0, _FileSystem.parseJson)(path);
      const sourcePath = this.getSourcePathFromArtifact(artifact);
      this.registerArtifactForSourcePath(sourcePath, artifact);
    });
  }

  listSourcePaths() {
    return _lodash2.default.keys(this.sourcesToArtifacts);
  }

  listArtifacts() {
    return _lodash2.default.flatten(_lodash2.default.values(this.sourcesToArtifacts));
  }

  getArtifactsFromSourcePath(sourcePath) {
    return this.sourcesToArtifacts[sourcePath];
  }

  getSourcePathFromArtifact(artifact) {
    return artifact.ast.absolutePath;
  }

  registerArtifactForSourcePath(sourcePath, artifact) {
    if (!this.sourcesToArtifacts[sourcePath]) {
      this.sourcesToArtifacts[sourcePath] = [];
    }
    this.sourcesToArtifacts[sourcePath].push(artifact);
  }
}