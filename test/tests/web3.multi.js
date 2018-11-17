async function thisStep(setup) {

    
    const OfficialWeb3                  = require('web3');
    const HttpProvider                  = require("../web3/HttpProviderCache");
    const WsProvider                    = require("../web3/WsProviderCache");

    const helpers                       = setup.helpers;
    const utils                         = require('../helpers/utils');
    const web3util                      = require('web3-utils');
    const web3                          = helpers.web3;

    const globals                       = setup.globals;

    // consume addresses
    ItemEntityContractInstance          = globals.ItemEntityContractInstance;
    ListContractInstance                = globals.ListContractInstance;
    ZoomContractInstance                = globals.ZoomContractInstance;

    describe('Web3 Multi', async() => {

        describe("New Web3 instance using normal HTTP Provider", async() => {

            let TestWeb3;
            let TestListContract;
            let Provider;
            let totalProcessTime = 0;
            let totalGasUsage = 0;
            let totalCalls = 0;

            before( async() => {
                Provider = new HttpProvider["default"]( web3.currentProvider.host );
                Provider.useCache(false);
                TestWeb3 = await new OfficialWeb3(Provider);
                TestListContract = await new TestWeb3.eth.Contract(globals.abis.ListContract, ListContractInstance._address);
                // utils.toLog( ' Provider initialised' );
            })

            after( async() => {
                utils.toLog( '\n       Results:' );

                utils.toLog( '      Provider URL :         ' + web3.currentProvider.host + ' ' );
                utils.toLog( '      Total Item count :     ' + globals.TestDummyRecords + ' ' );
                utils.toLog( '      Total Call count :     ' + totalCalls + ' ' );
                utils.toLog( '      Total Data Load time : ' + totalProcessTime + ' seconds ' );
                utils.toLog( '      Estimated Gas Used :   ' + (globals.OneItemTotalGasUsage * globals.TestDummyRecords) + ' ' );
                
                utils.toLog( '' );

                globals.testWeb3Provider = Provider;
            })

            describe("Load all items from list, then get all their properties ( async / at the same time in promises )", async() => {

                let item;
                const itemAddressValues = [];
                const testItemContracts = [];
                
                before( (done) => {

                    const startTime = process.hrtime();

                    // async address values
                    for(let i = 1; i <= globals.TestDummyRecords; i++) {
                        itemAddressValues.push( TestListContract.methods.items(i).call() );
                    }

                    Promise.all(itemAddressValues).then(function(values) {

                        // async instantiate contracts
                        for( let i = 0; i < values.length; i++) {

                            // based on loaded address, instantiate child contract
                            testItemContracts.push( new TestWeb3.eth.Contract(globals.abis.ItemEntity, values[i].itemAddress) );
                            totalCalls++;
                        }

                        Promise.all(testItemContracts).then(function(contracts) {

                            // calculate end time
                            const endTime = process.hrtime(startTime);
                            const actualTime = endTime[0] + endTime[1] / 1000000000;
                            totalProcessTime += actualTime;

                            done();
                        });
                    });

                });
                
                it("should load and validate all items and properties", (done) => {

                    const startTime = process.hrtime();
                    const callsToValidate = [];
                    const callsToValidateWith = [];

                    for(let i = 0; i < testItemContracts.length; i++) {
                        const TestItemContract = testItemContracts[i];

                        callsToValidate.push( TestItemContract.methods.getName().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( typeof result === "string", "Result is not a string");
                        });

                        callsToValidate.push( TestItemContract.methods.getAsset().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 42 , "Result is not a proper address");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint8().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( parseInt( result ) === 2**8-1 , "Result is not 2**8-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint16().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( parseInt( result ) === 2**16-1 , "Result is not 2**16-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint32().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( parseInt( result ) === 2**32-1 , "Result is not 2**32-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint64().call() );
                        callsToValidateWith.push( function(result) {
                            let resultingNumber = new helpers.BigNumber( result );
                            let valdidation = new helpers.BigNumber(2).exponentiatedBy(64).minus(1);
                            assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**64-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint128().call() );
                        callsToValidateWith.push( function(result) {
                            let resultingNumber = new helpers.BigNumber( result );
                            let valdidation = new helpers.BigNumber(2).exponentiatedBy(128).minus(1);
                            assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**128-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint256().call() );
                        callsToValidateWith.push( function(result) {
                            let resultingNumber = new helpers.BigNumber( result );
                            let valdidation = new helpers.BigNumber(2).exponentiatedBy(256).minus(1);
                            assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**256-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getString8().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 8 , "Result length is not 8");
                        });

                        callsToValidate.push( TestItemContract.methods.getString16().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 16 , "Result length is not 16");
                        });

                        callsToValidate.push( TestItemContract.methods.getString32().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 32 , "Result length is not 32");
                        });

                        callsToValidate.push( TestItemContract.methods.getString64().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 64 , "Result length is not 64");
                        });

                        callsToValidate.push( TestItemContract.methods.getAddress().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 42 , "Result is not a proper address");
                        });

                        callsToValidate.push( TestItemContract.methods.getBoolTrue().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result , "false: Result is not a proper boolean true value");
                        });

                        callsToValidate.push( TestItemContract.methods.getBoolFalse().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isFalse( result , "false: Result is not a proper boolean false value");
                        });

                        callsToValidate.push( TestItemContract.methods.getBytes8().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 18 , "bytes8: Result is not a string with length 18");
                        });

                        callsToValidate.push( TestItemContract.methods.getBytes16().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 34 , "bytes16: Result is not a string with length 34");
                        });

                        callsToValidate.push( TestItemContract.methods.getBytes32().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 66 , "bytes32: Result is not a string with length 66");
                        });

                        callsToValidate.push( TestItemContract.methods.getBytes().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 130 , "bytes64: Result is not a string with length 130");
                        });

                    }

                    Promise.all(callsToValidate).then(function(values) {

                        // calculate end time before asserting results.. so we get lower times
                        const endTime = process.hrtime(startTime);
                        const actualTime = endTime[0] + endTime[1] / 1000000000;
                        totalProcessTime += actualTime;

                        // validate results
                        for( let i = 0; i < values.length; i++) {
                            totalCalls++;
                            callsToValidateWith[i](values[i]);
                        }

                        done();
                    });
                });
            });

        });

        describe("New Web3 instance using normal WS Provider", async() => {

            let TestWeb3;
            let TestListContract;
            let Provider;
            let totalProcessTime = 0;
            let totalGasUsage = 0;
            let totalCalls = 0;
            let ProviderUrl;

            before( async() => {
                ProviderUrl = web3.currentProvider.host.replace("http", "ws")
                Provider = new WsProvider["default"]( ProviderUrl );
                TestWeb3 = await new OfficialWeb3(Provider);
                TestListContract = await new TestWeb3.eth.Contract(globals.abis.ListContract, ListContractInstance._address);
            })

            after( async() => {
                utils.toLog( '\n       Results:' );

                utils.toLog( '      Provider URL :         ' + ProviderUrl + ' ' );
                utils.toLog( '      Total Item count :     ' + globals.TestDummyRecords + ' ' );
                utils.toLog( '      Total Call count :     ' + totalCalls + ' ' );
                utils.toLog( '      Total Data Load time : ' + totalProcessTime + ' seconds ' );
                utils.toLog( '      Estimated Gas Used :   ' + (globals.OneItemTotalGasUsage * globals.TestDummyRecords) + ' ' );

                utils.toLog( '' );
            })

            describe("Load all items from list, then get all their properties ( async / at the same time in promises )", async() => {

                let item;
                const itemAddressValues = [];
                const testItemContracts = [];
                
                before( (done) => {

                    const startTime = process.hrtime();

                    // async address values
                    for(let i = 1; i <= globals.TestDummyRecords; i++) {
                        itemAddressValues.push( TestListContract.methods.items(i).call() );
                    }

                    Promise.all(itemAddressValues).then(function(values) {

                        // async instantiate contracts
                        for( let i = 0; i < values.length; i++) {

                            // based on loaded address, instantiate child contract
                            testItemContracts.push( new TestWeb3.eth.Contract(globals.abis.ItemEntity, values[i].itemAddress) );
                            totalCalls++;
                        }

                        Promise.all(testItemContracts).then(function(contracts) {

                            // calculate end time
                            const endTime = process.hrtime(startTime);
                            const actualTime = endTime[0] + endTime[1] / 1000000000;
                            totalProcessTime += actualTime;

                            done();
                        });
                    });

                });
                
                it("should load and validate all items and properties", (done) => {

                    const startTime = process.hrtime();
                    const callsToValidate = [];
                    const callsToValidateWith = [];

                    for(let i = 0; i < testItemContracts.length; i++) {
                        const TestItemContract = testItemContracts[i];

                        callsToValidate.push( TestItemContract.methods.getName().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( typeof result === "string", "Result is not a string");
                        });

                        callsToValidate.push( TestItemContract.methods.getAsset().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 42 , "Result is not a proper address");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint8().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( parseInt( result ) === 2**8-1 , "Result is not 2**8-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint16().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( parseInt( result ) === 2**16-1 , "Result is not 2**16-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint32().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( parseInt( result ) === 2**32-1 , "Result is not 2**32-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint64().call() );
                        callsToValidateWith.push( function(result) {
                            let resultingNumber = new helpers.BigNumber( result );
                            let valdidation = new helpers.BigNumber(2).exponentiatedBy(64).minus(1);
                            assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**64-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint128().call() );
                        callsToValidateWith.push( function(result) {
                            let resultingNumber = new helpers.BigNumber( result );
                            let valdidation = new helpers.BigNumber(2).exponentiatedBy(128).minus(1);
                            assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**128-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getUint256().call() );
                        callsToValidateWith.push( function(result) {
                            let resultingNumber = new helpers.BigNumber( result );
                            let valdidation = new helpers.BigNumber(2).exponentiatedBy(256).minus(1);
                            assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**256-1");
                        });

                        callsToValidate.push( TestItemContract.methods.getString8().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 8 , "Result length is not 8");
                        });

                        callsToValidate.push( TestItemContract.methods.getString16().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 16 , "Result length is not 16");
                        });

                        callsToValidate.push( TestItemContract.methods.getString32().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 32 , "Result length is not 32");
                        });

                        callsToValidate.push( TestItemContract.methods.getString64().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 64 , "Result length is not 64");
                        });

                        callsToValidate.push( TestItemContract.methods.getAddress().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 42 , "Result is not a proper address");
                        });

                        callsToValidate.push( TestItemContract.methods.getBoolTrue().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result , "false: Result is not a proper boolean true value");
                        });

                        callsToValidate.push( TestItemContract.methods.getBoolFalse().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isFalse( result , "false: Result is not a proper boolean false value");
                        });

                        callsToValidate.push( TestItemContract.methods.getBytes8().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 18 , "bytes8: Result is not a string with length 18");
                        });

                        callsToValidate.push( TestItemContract.methods.getBytes16().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 34 , "bytes16: Result is not a string with length 34");
                        });

                        callsToValidate.push( TestItemContract.methods.getBytes32().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 66 , "bytes32: Result is not a string with length 66");
                        });

                        callsToValidate.push( TestItemContract.methods.getBytes().call() );
                        callsToValidateWith.push( function(result) {
                            assert.isTrue( result.length === 130 , "bytes64: Result is not a string with length 130");
                        });

                    }

                    Promise.all(callsToValidate).then(function(values) {

                        // calculate end time before asserting results.. so we get lower times
                        const endTime = process.hrtime(startTime);
                        const actualTime = endTime[0] + endTime[1] / 1000000000;
                        totalProcessTime += actualTime;

                        // validate results
                        for( let i = 0; i < values.length; i++) {
                            totalCalls++;
                            callsToValidateWith[i](values[i]);
                        }

                        done();
                    });
                });
            });
        });
    });
}

setup.globals.runningTests.push( thisStep(setup) );
