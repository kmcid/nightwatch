#!/usr/bin/env node

const Browserstack = require('browserstack-local');
const Nightwatch = require('../lib/index.js');
const { Logger } = require('../lib/utils');

let bs_local;

module.exports = browserstackIdentifier => {
  try {
    process.mainModule.filename = "./node_modules/.bin/nightwatch"

    // Code to start browserstack local before start of test
    console.log("Connecting local");
    Nightwatch.bs_local = bs_local = new Browserstack.Local();
    bs_local.start({ 
      'key': process.env.BROWSERSTACK_ACCESS_KEY, 
      localIdentifier: browserstackIdentifier 
    }, function (error) {
      if (error) throw error;

      console.log('Connected. Now testing...');
      Nightwatch.cli(function(argv) {
        argv._source = argv['_'].slice(0);
    
        const runner = Nightwatch.CliRunner(argv);
        runner.setup()
          .startWebDriver()
          .catch(err => {
            throw err;
          })
          .then(() => {
            return runner.runTests(() => {
              // Code to stop browserstack local after end of single test
              bs_local.stop(() => {});
            });
          })
          .catch(err => {
            runner.processListener.setExitCode(10);
          })
          .then(() => {
            // Code to stop browserstack local after end of single test
            bs_local.stop(() => {});
            return runner.stopWebDriver();
          })
          .catch(err => {
            Logger.error(err);
          });
      });
    });
  } catch (ex) {
    err.message = 'An error occurred while trying to start the Nightwatch Runner: ' + err.message;
    Logger.error(err);
    process.exit(2);
  }
}