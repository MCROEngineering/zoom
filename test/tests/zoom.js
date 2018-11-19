const OfficialWeb3                  = require('web3');
const HttpProvider                  = require("../web3/HttpProviderCache");
const WsProvider                    = require("../web3/WsProviderCache");
const ZoomLibrary                   = require("../../dist/lib/index.js");

const helpers                       = setup.helpers;
const globals                       = setup.globals;
const utils                         = helpers.utils;
const web3util                      = helpers.web3util;
const web3                          = helpers.web3;

const ListContractInstance          = globals.ListContractInstance;
const ZoomContractInstance          = globals.ZoomContractInstance;

describe('Zoom Tests', accounts => {

    // web3 library instance that uses Zoom Http Provider
    let ZoomProvider; 

    before(async () => {

        // custom zoom provider
        ZoomProvider = new ZoomLibrary.HttpProvider( setup.globals.network_config_http );

        // ZoomProvider = new WsProvider["default"]( setup.globals.network_config_ws );
        // no result caching at this stage
        ZoomProvider.enableCache(false);

        // instantiate library
        const ZoomLibraryInstance = new ZoomLibrary.Zoom( {use_reference_calls: globals.use_reference_calls } );

        // prepare binary call
        const combinedBinaryCall = ZoomLibraryInstance.getZoomCall(
            // saved requests from profiling run ( web3.multi )
            globals.multiWeb3Provider.cache
        );

        // eth_estimateGas fails if call is bigger than block gasLimit..
        // so we have to guesstimate it based on previous calls
        // 200 item call results in 3075.17 per item
        // count number of binary calls, and only do a real estimation if count is lower than 1k
        let trueGasEstimate = true;
        if( ZoomLibraryInstance.binary.length > 1000 ) {
            trueGasEstimate = false;
        }

        const combinedResult = await utils.measureCallExecution( 
            ZoomContractInstance.methods.combine( combinedBinaryCall ), trueGasEstimate, { gas: 50000000 }
        );

        globals.ZoomCallTime = combinedResult.time;
        globals.ZoomTotalGasUsage = combinedResult.gas;

        if( trueGasEstimate === false ) {
            globals.ZoomTotalGasUsage = ( ZoomLibraryInstance.binary.length * 3075.17 );
        }

        const ZoomTest = new ZoomLibrary.Zoom( {use_reference_calls: true } );
        const newCache = ZoomTest.resultsToCache( combinedResult.data, combinedBinaryCall );

        // enable result caching
        ZoomProvider.enableCache(true);
        ZoomProvider.setCache( newCache );

    });

    describe("Zoom: Web3 Solo: New Web3 instance using Zoom HTTP Provider", async () => {

        let TestWeb3;
        let TestListContract;
        let totalProcessTime = 0;
        let totalGasUsage = 0;
        let totalCalls = 0;

        before(async () => {
            // inject ZoomProvider that contains our cached data
            TestWeb3 = await new OfficialWeb3( ZoomProvider );
            TestListContract = await new TestWeb3.eth.Contract(globals.abis.ListContract, ListContractInstance._address);
        })

        after(async () => {
            /*
            utils.toLog('\n       Results: ');
            utils.toLog('      Total Call count :     ' + totalCalls + ' ');
            utils.toLog('      Total Data Load time : ' + totalProcessTime + ' seconds ');
            utils.toLog('');
            */
        })

        describe("Load first item from list, then get all it's properties in tests ( validate return )", async() => {

            let TestItemContract;
            let item;

            before( async() => {

                // load first item in contract
                item = await utils.measureCallExecution( TestListContract.methods.items(1), false );
                totalProcessTime += item.time;
                totalCalls++;

                // based on loaded address, instantiate child contract
                TestItemContract = await new TestWeb3.eth.Contract(globals.abis.ItemEntity, item.data.itemAddress);
            });

            it("call should return an item with an address", async() => {
                assert.isTrue( item.data.itemAddress.length === 42 , "Result is not a proper address");
            });

            it("test item.getName() should return a string", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getName(), false
                );
                totalProcessTime += result.time;
                totalCalls++;
                assert.isTrue( typeof result.data === "string", "Result is not a string");
            });

            it("test item.getAsset() should return an address", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getAsset(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;
                assert.isTrue( result.data.length === 42 , "Result is not a proper address");
            });

            it("test item.getUint8() should return a string containing a uint8", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getUint8(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;
                assert.isTrue( parseInt( result.data ) === 2**8-1 , "Result is not 2**8-1");
            });

            it("test item.getUint16() should return a string containing a uint16", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getUint16(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;
                assert.isTrue( parseInt( result.data ) === 2**16-1 , "Result is not 2**16-1");
            });

            it("test item.getUint32() should return a string containing a uint32", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getUint32(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;
                assert.isTrue( parseInt( result.data ) === 2**32-1 , "Result is not 2**32-1");
            });

            it("test item.getUint64() should return a string containing a uint64", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getUint64(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                let resultingNumber = new helpers.BigNumber( result.data );
                let valdidation = new helpers.BigNumber(2).exponentiatedBy(64).minus(1);
                assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**64-1");
            });

            it("test item.getUint128() should return a string containing a uint128", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getUint128(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                let resultingNumber = new helpers.BigNumber( result.data );
                let valdidation = new helpers.BigNumber(2).exponentiatedBy(128).minus(1);
                assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**128-1");
            });

            it("test item.getUint256() should return a string containing a uint256", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getUint256(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                let resultingNumber = new helpers.BigNumber( result.data );
                let valdidation = new helpers.BigNumber(2).exponentiatedBy(256).minus(1);
                assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**256-1");
            });

            it("test item.getString8() should return a string with length 8", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getString8(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                assert.isTrue( result.data.length === 8 , "Result length is not 8");
            });
            
            it("test item.getString16() should return a string with length 16", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getString16(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                assert.isTrue( result.data.length === 16 , "Result length is not 16");
            });

            it("test item.getString32() should return a string with length 32", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getString32(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                assert.isTrue( result.data.length === 32 , "Result length is not 32");
            });
            
            it("test item.getString64() should return a string with length 64", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getString64(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                assert.isTrue( result.data.length === 64 , "Result length is not 64");
            });

            it("test item.getAddress() should return an address", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getAddress(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;
                assert.isTrue( result.data.length === 42 , "Result is not a proper address");
            });

            it("test item.getBoolTrue() should return a bool = true", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getBoolTrue(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;
                assert.isTrue( result.data === true , "Result is not a proper boolean true value");
            });

            it("test item.getBoolFalse() should return a bool = false", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getBoolFalse(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;
                assert.isTrue( result.data === false , "Result is not a proper boolean false value");
            });

            it("test item.getBytes8() should return a hex string with length 18", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getBytes8(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                assert.isTrue( result.data.length === 18 , "Result is not a string with length 18");
            });

            it("test item.getBytes16() should return a hex string with length 34", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getBytes16(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                assert.isTrue( result.data.length === 34 , "Result is not a string with length 34");
            });

            it("test item.getBytes32() should return a hex string with length 66", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getBytes32(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                assert.isTrue( result.data.length === 66 , "Result is not a string with length 66");
            });

            it("test item.getBytes() should return a hex string with length 130", async() => {
                const result = await utils.measureCallExecution(
                    TestItemContract.methods.getBytes(), false
                );
                totalProcessTime += result.time;
                totalGasUsage += result.gas;
                totalCalls++;

                assert.isTrue( result.data.length === 130 , "Result is not a string with length 130");
            });
        });
    });
    
    describe('Zoom: Web3 Multi', async() => {

        describe("New Web3 instance using Zoom HTTP Provider", async() => {
    
            let TestWeb3;
            let TestListContract;
            let Provider;
            let totalProcessTime = 0;
            let totalGasUsage = 0;
            let totalCalls = 0;
    
            before( async() => {
                // inject ZoomProvider that contains our cached data
                TestWeb3 = await new OfficialWeb3( ZoomProvider );
                TestListContract = await new TestWeb3.eth.Contract(globals.abis.ListContract, ListContractInstance._address);
            })
    
            after( async() => {
                /*
                utils.toLog( '\n       Results:' );
                utils.toLog( '      Provider:              ZOOM ' );
                utils.toLog( '      Total Item count :     ' + globals.TestDummyRecords + ' ' );
                utils.toLog( '      Total Call count :     ' + totalCalls + ' ' );
                utils.toLog( '      Total Data Load time : ' + totalProcessTime + ' seconds ' );
                utils.toLog( '' );
                utils.toLog( '      Zoom call time :       ' + globals.ZoomCallTime + ' seconds ' );
                utils.toLog( '      Zoom Gas Used :        ' + globals.ZoomTotalGasUsage + ' ' );
                utils.toLog( '      Gas Per call :         ' + (globals.ZoomTotalGasUsage / totalCalls) + ' ' );
                utils.toLog( '' );
                */
                globals.callCount = totalCalls;

                globals.results.zoom = {};
                globals.results.zoom.count = 1;
                globals.results.zoom.time = globals.ZoomCallTime;
                globals.results.zoom.gas = globals.ZoomTotalGasUsage;

            })
    
            describe("Load all items from list, then get all their properties ( async / at the same time in promises )", async() => {
    
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
});

