'use strict';

const Command = require('egg-bin').Command;
const path = require('path');
const fs = require('fs');
const rimraf = require('mz-modules/rimraf');
const fse = require('fs-extra');

class BuildCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.usage = 'Usage: midway-bin build [options]';

    this.options = {
      clean: {
        description: 'clean build target dir',
        type: 'boolean',
        alias: 'c',
      },
    };
  }

  get description() {
    return 'build application automatically';
  }

  * run(context) {
    const { cwd, argv } = context;

    const tscCli = require.resolve('typescript/bin/tsc');
    if (!fs.existsSync(path.join(cwd, 'tsconfig.json'))) {
      console.log(`[midway-bin] tsconfig.json not found in ${cwd}\n`);
      return;
    }

    if (argv.clean) {
      yield this.cleanDir(cwd);
    }

    this.copyFiles(cwd);

    yield this.helper.forkNode(tscCli, [ ], { cwd });
  }

  * cleanDir(cwd) {
    const tsConfig = require(path.join(cwd, 'tsconfig.json'));
    if (tsConfig && tsConfig.compilerOptions) {
      const outDir = tsConfig.compilerOptions.outDir;
      if (outDir) {
        yield rimraf(outDir);
      }
    }
  }

  copyFiles(cwd) {
    const tsConfig = require(path.join(cwd, 'tsconfig.json'));
    if (tsConfig && tsConfig.compilerOptions) {
      const outDir = tsConfig.compilerOptions.outDir;
      if (outDir && fs.existsSync(path.join(cwd, 'package.json'))) {
        const pkg = require(path.join(cwd, 'package.json'));
        if (pkg['midway-bin-build'] && pkg['midway-bin-build'].include) {
          for (const file of pkg['midway-bin-build'].include) {
            const srcDir = path.join('src', file);
            const targetDir = path.join(outDir, file);
            fse.copySync(path.join(cwd, srcDir), path.join(cwd, targetDir));
            console.log(`[midway-bin] copy ${srcDir} to ${targetDir} success!`);
          }
        }
      }
    }

  }
}

module.exports = BuildCommand;
