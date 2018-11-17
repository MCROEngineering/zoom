const rpcHost = "http://127.0.0.1:8545/";
const testnetHost = "https://rinkeby.infura.io/";

const tests = [
    'test',
    'web3.solo',
    'web3.multi',
    // 'zoom'
];

const assert                    = require("chai").assert;
const OfficialWeb3              = require('web3');
const HttpProvider              = require("./web3/HttpProviderCache");
const web3util                  = require('web3-utils');
const utils                     = require('./helpers/utils');
const { assertInvalidOpcode }   = require('./helpers/assertThrow');
const BigNumber                 = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1 }); // ROUND_DOWN = 1


const runTests = async() => {

    const setup = {
        network: process.argv[3],
        globals: {},
    };
    
    let Provider;

    if(setup.network === "local") {
        Provider = new HttpProvider["default"]( rpcHost );
    } else {
        Provider = new HttpProvider["default"]( testnetHost );
    }

    Provider.useCache(false);
    
    const web3 = await new OfficialWeb3(Provider);

    setup.helpers = {
        utils,
        web3,
        web3util,
        BigNumber
    };

    if(setup.network === "local") {
        // instantiate deployer if needed
        try {
            const initDeployer = require('./tests/deployer.js');
            await initDeployer(setup);
        } catch(e) {
            console.log("error:", e);
        }
    } else {
        // else load testnet addresses

    }

    setup.globals.runningTests = [];
    
    // setup in test globals.. ugly hack but it works.
    global.setup = setup;
    global.assert = assert;
    

    utils.toLog(
        ' ----------------------------------------------------------------\n'+
        '  Step 3 - Run tests \n'+
        '  ----------------------------------------------------------------'
    );

    if(tests.length > 0) {
        const Mocha = require('mocha');

        // Instantiate a Mocha instance.
        const mocha = new Mocha();

        for( let i = 0; i < tests.length; i++) {
            mocha.addFile(
                "test/tests/" + tests[i] + ".js"
            );
        }

        // Run the tests.
        const runner = mocha.run(function(failures){
            process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
        });

        runner.on("end", (e) => {

            // display stats
            try {
                const initStats = require('./tests/stats.js');
                initStats(setup);
            } catch(e) {
                console.log("error:", e);
            }

            process.exit( process.exitCode );
        });

    }

};

runTests();
