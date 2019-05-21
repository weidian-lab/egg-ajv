'use strict';

const assert = require('assert');
const { join } = require('path');
const Ajv = require('ajv');

class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  didLoad() {
    const app = this.app;
    const config = app.config.ajv;

    const ajv = new Ajv(Object.assign({
      allErrors: true, // required for custom error message
      jsonPointers: true, // required for custom error message
    }, config));
    require('ajv-merge-patch')(ajv);
    require('ajv-errors')(ajv, {
      keepErrors: config.keepErrors || false,
      singleError: config.singleError || false,
    });
    app.ajv = ajv;

    const { keyword = 'schema', ignoreCaseStyle = false } = app.config.ajv || {};
    const opts = {
      match: '**/*.@(js|json)',
      initializer(exp, { path, pathName }) {
        assert(app.ajv.validateSchema(exp), `${path} should be a valid schema`);
        app.ajv.addSchema(Object.assign({ $id: pathName }, exp), pathName);
        return exp;
      },
    };

    if (ignoreCaseStyle) {
      opts.caseStyle = filepath => filepath.substring(0, filepath.lastIndexOf('.')).split('/');
    }

    app.loader.loadToApp(join(app.baseDir, `app/${keyword}`), keyword, opts);
  }
}

module.exports = AppBootHook;
