async function runTests() {

    const configuration             = require("./../configuration.json");

    const useReferenceCalls = configuration.zoom.useReferenceCalls;
    const TestDummyRecords  = configuration.TestDummyRecords;

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
        network: process.argv[2],
        globals: {},
    };
    
    if( typeof configuration.networks[ setup.network ] !== "undefined" ) {

        setup.globals.network_config_http = configuration.networks[ setup.network ].http;
        setup.globals.network_config_ws = configuration.networks[ setup.network ].ws;

        utils.toLog(
            ' ----------------------------------------------------------------\n'+
            '  Configuration: \n'+
            '  ----------------------------------------------------------------'
        );
        utils.toLog( ' Network:                ' + setup.network  );
        utils.toLog( ' HTTP Address:           ' + setup.globals.network_config_http  );
        utils.toLog( ' WebSocket Address:      ' + setup.globals.network_config_ws  );
        utils.toLog( '' );
        utils.toLog( ' Zoom Configuration: ' );
        utils.toLog( '   Build and use Referenced Address Calls: ' + useReferenceCalls );
        utils.toLog( '' );

    } else {
        
        utils.toLog( ' Network : ' + utils.colors.red +  setup.network + utils.colors.white + ' does not have a specified configuration. Please add it to configuration.json.'  );
        process.exit();
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
    setup.globals.configuration = configuration;


    if(setup.network === "local") {
        // instantiate deployer if needed
        try {
            const initDeployer = require('./tests/deployer.js');
            await initDeployer(setup);
        } catch(e) {
            console.log("error:", e);
        }
    } else {

        // rinkeby
        // const ListContract_address   = "0x60b1151b564b3d2321ce641914001ec97d009d47"
        // const ZoomContract_address   = "0xe07a33e2975b7012eb9bf002aa12aba98d7069dc";

        // ropsten
        const ListContract_address   = "0x1d5cb16376911d3832efb4130670c4a6a47fb82f"
        const ZoomContract_address   = "0x06015a207fb22eb6d81585e1694c8fff405ee4a4";

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
