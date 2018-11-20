async function runTests() {

    const useReferenceCalls = false;
    const TestDummyRecords  = 100;
    const rpcHttpHost           = "http://127.0.0.1:8545/";
    const rpcWsHost             = "ws://127.0.0.1:8545/";

    // const testnetHttpHost       = "https://rinkeby.infura.io/";
    // const testnetWsHost         = "wss://rinkeby.infura.io/ws";

    // nginx proxy for test rinkeby server so we have 1 connection to geth
    const testnetHttpHost       = "http://nowlive.ro/rinkeby";
    const testnetWsHost         = "ws://nowlive.ro/rinkebyws";



    const tests = [
        'web3.solo',
        'web3.multi',
        'zoom'
    ];

    const assert                    = require("chai").assert;
    const OfficialWeb3              = require('web3');
    const HttpProvider              = require("./web3/HttpProviderCache");
    const WsProvider                = require("./web3/WsProviderCache");
    const web3util                  = require('web3-utils');
    const utils                     = require('./helpers/utils');
    const BigNumber                 = require('bignumber.js');
    BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: 1 }); // ROUND_DOWN = 1

    const setup = {
        network: process.argv[3],
        globals: {},
    };
    
    if(setup.network === "local") {
        setup.globals.network_config_http = rpcHttpHost;
        setup.globals.network_config_ws = rpcWsHost;
    } else {
        setup.globals.network_config_http = testnetHttpHost;
        setup.globals.network_config_ws = testnetWsHost;
    }

    const TestWsProvider = new WsProvider["default"]( setup.globals.network_config_ws );
    TestWsProvider.useCache(false);

    const TestHttpProvider = new HttpProvider["default"]( setup.globals.network_config_http );
    TestHttpProvider.useCache(false);
    
    const web3 = await new OfficialWeb3(TestWsProvider);
    const web3http = await new OfficialWeb3(TestHttpProvider);

    setup.helpers = {
        utils,
        web3,
        web3http,
        web3util,
        BigNumber
    };

    setup.globals.TestDummyRecords = TestDummyRecords; 
    setup.globals.use_reference_calls = useReferenceCalls;
    setup.globals.results = {};


    if(setup.network === "local") {
        // instantiate deployer if needed
        try {
            const initDeployer = require('./tests/deployer.js');
            await initDeployer(setup);
        } catch(e) {
            console.log("error:", e);
        }
    } else {

        const ListContract_address   = "0x60b1151b564b3d2321ce641914001ec97d009d47"
        const ZoomContract_address   = "0xe07a33e2975b7012eb9bf002aa12aba98d7069dc";

        utils.toLog(
            ' ----------------------------------------------------------------\n'+
            '  Step 1 - Instantiate Zoom and link to TestData Contracts \n'+
            '  ----------------------------------------------------------------'
        );
        utils.toLog( ' Zoom at:                ' + ZoomContract_address  );
        utils.toLog( ' Listing at:             ' + ListContract_address  );

        const ListContract           = await utils.getAbiFile('ListContract');
        const ItemEntity             = await utils.getAbiFile('ItemEntity');
        const Zoom                   = await utils.getAbiFile('Zoom');

        // consume addresses
        const ListContractInstance   = await new web3.eth.Contract(ListContract.abi, ListContract_address);
        const ZoomContractInstance   = await new web3http.eth.Contract(Zoom.abi, ZoomContract_address);

        setup.globals.ListContractInstance = ListContractInstance;
        setup.globals.ZoomContractInstance = ZoomContractInstance;

        setup.globals.abis = {};
        setup.globals.abis.ItemEntity = ItemEntity.abi;
        setup.globals.abis.ListContract = ListContract.abi;
        setup.globals.abis.Zoom = Zoom.abi;

         const itemNum = await ListContractInstance.methods.itemNum().call()

        utils.toLog( ' ListContract max count: ' + utils.colors.orange + itemNum + utils.colors.none + '.' );
        utils.toLog( '' );
    }

    utils.toLog( '' );
    utils.toLog( ' Expected call size:     ' + utils.colors.orange + ( TestDummyRecords * 20 ) + '.' );

    // setup in test globals.. ugly hack but it works.
    global.setup = setup;
    global.assert = assert;
    
    utils.toLog(
        ' ----------------------------------------------------------------\n'+
        '  Step 2 - Run tests \n'+
        '  ----------------------------------------------------------------'
    );

    if(tests.length > 0) {
        const Mocha = require('mocha');

        // Instantiate a Mocha instance.
        const mocha = new Mocha();

        mocha.slow(10);
        mocha.timeout(600000);


        for( let i = 0; i < tests.length; i++) {
            mocha.addFile(
                "test/tests/" + tests[i] + ".js"
            );
        }

        // Run the tests.
        const runner = mocha.run(
            function(failures){
                process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
            }, 
            true // delay execution of root suite until ready. 
        );

        runner.on("end", (e) => {

            // display stats
            try {
                const initStats = require('./tests/stats.js');
                initStats(setup);
            } catch(e) {
                console.log("error:", e);
            }

            // terminate process
            process.exit( process.exitCode );
        });

    }
};

runTests();
