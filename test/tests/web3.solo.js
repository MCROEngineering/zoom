const thisStep = async() => {

    
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

    describe('Web3 Solo', async() => {

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

                utils.toLog( '\n       Results: ' );
                
                utils.toLog( '      Total Call count :     ' + totalCalls + ' ' );
                utils.toLog( '      Total HTTP wait time : ' + totalProcessTime + ' seconds ' );
                utils.toLog( '      Total Gas Used :       ' + totalGasUsage + ' ' );
                utils.toLog( '' );

                globals.OneItemTotalGasUsage = totalGasUsage;
            })

            describe("Load first item from list, then get all it's properties in tests ( determine gas )", async() => {

                let TestItemContract;
                let item;

                before( async() => {

                    // load first item in contract
                    item = await utils.measureCallExecution( TestListContract.methods.items(1) );
                    totalProcessTime += item.time;
                    totalGasUsage += item.gas;
                    totalCalls++;

                    // based on loaded address, instantiate child contract
                    TestItemContract = await new TestWeb3.eth.Contract(globals.abis.ItemEntity, item.data.itemAddress);
                });

                it("call should return an item with an address", async() => {
                    assert.isTrue( item.data.itemAddress.length === 42 , "Result is not a proper address");
                });

                it("test item.getName() should return a string", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getName()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;
                    assert.isTrue( typeof result.data === "string", "Result is not a string");
                });

                it("test item.getAsset() should return an address", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getAsset()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;
                    assert.isTrue( result.data.length === 42 , "Result is not a proper address");
                });

                it("test item.getUint8() should return a string containing a uint8", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getUint8()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;
                    assert.isTrue( parseInt( result.data ) === 2**8-1 , "Result is not 2**8-1");
                });

                it("test item.getUint16() should return a string containing a uint16", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getUint16()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;
                    assert.isTrue( parseInt( result.data ) === 2**16-1 , "Result is not 2**16-1");
                });

                it("test item.getUint32() should return a string containing a uint32", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getUint32()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;
                    assert.isTrue( parseInt( result.data ) === 2**32-1 , "Result is not 2**32-1");
                });

                it("test item.getUint64() should return a string containing a uint64", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getUint64()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    let resultingNumber = new helpers.BigNumber( result.data );
                    let valdidation = new helpers.BigNumber(2).pow(64).sub(1);
                    assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**64-1");
                });

                it("test item.getUint128() should return a string containing a uint128", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getUint128()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    let resultingNumber = new helpers.BigNumber( result.data );
                    let valdidation = new helpers.BigNumber(2).pow(128).sub(1);
                    assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**128-1");
                });

                it("test item.getUint256() should return a string containing a uint256", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getUint256()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    let resultingNumber = new helpers.BigNumber( result.data );
                    let valdidation = new helpers.BigNumber(2).pow(256).sub(1);
                    assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**256-1");
                });

                it("test item.getString8() should return a string with length 8", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getString8()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    assert.isTrue( result.data.length === 8 , "Result length is not 8");
                });
                
                it("test item.getString16() should return a string with length 16", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getString16()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    assert.isTrue( result.data.length === 16 , "Result length is not 16");
                });

                it("test item.getString32() should return a string with length 32", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getString32()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    assert.isTrue( result.data.length === 32 , "Result length is not 32");
                });
                
                it("test item.getString64() should return a string with length 64", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getString64()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    assert.isTrue( result.data.length === 64 , "Result length is not 64");
                });

                it("test item.getAddress() should return an address", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getAddress()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;
                    assert.isTrue( result.data.length === 42 , "Result is not a proper address");
                });

                it("test item.getBoolTrue() should return a bool = true", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getBoolTrue()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;
                    assert.isTrue( result.data === true , "Result is not a proper boolean true value");
                });

                it("test item.getBoolFalse() should return a bool = false", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getBoolFalse()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;
                    assert.isTrue( result.data === false , "Result is not a proper boolean false value");
                });

                it("test item.getBytes8() should return a hex string with length 18", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getBytes8()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    assert.isTrue( result.data.length === 18 , "Result is not a string with length 18");
                });

                it("test item.getBytes16() should return a hex string with length 34", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getBytes16()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    assert.isTrue( result.data.length === 34 , "Result is not a string with length 34");
                });

                it("test item.getBytes32() should return a hex string with length 66", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getBytes32()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    assert.isTrue( result.data.length === 66 , "Result is not a string with length 66");
                });

                it("test item.getBytes() should return a hex string with length 130", async() => {
                    const result = await utils.measureCallExecution( 
                        TestItemContract.methods.getBytes()
                    );
                    totalProcessTime += result.time;
                    totalGasUsage += result.gas;
                    totalCalls++;

                    assert.isTrue( result.data.length === 130 , "Result is not a string with length 130");
                });
            });
        });

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
                
                utils.toLog( '      Total Call count :     ' + totalCalls + ' ' );
                utils.toLog( '      Total Data Load time : ' + totalProcessTime + ' seconds ' );
                utils.toLog( '' );

            })

            describe("Load first item from list, then get all it's properties ( async / at the same time in promises )", async() => {

                let TestItemContract;
                let item;

                before( async() => {
                    // load first item in contract
                    item = await utils.measureCallExecution( TestListContract.methods.items(1) );
                    totalProcessTime += item.time;
                    totalCalls++;

                    // based on loaded address, instantiate child contract
                    TestItemContract = await new TestWeb3.eth.Contract(globals.abis.ItemEntity, item.data.itemAddress);
                });
                
                it("should load and validate all properties", (done) => {

                    const startTime = process.hrtime();
                    const callsToValidate = [];
                    const callsToValidateWith = [];

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
                        let valdidation = new helpers.BigNumber(2).pow(64).sub(1);
                        assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**64-1");
                    });

                    callsToValidate.push( TestItemContract.methods.getUint128().call() );
                    callsToValidateWith.push( function(result) {
                        let resultingNumber = new helpers.BigNumber( result );
                        let valdidation = new helpers.BigNumber(2).pow(128).sub(1);
                        assert.isTrue( resultingNumber.toString() === valdidation.toString() , "Result is not 2**128-1");
                    });

                    callsToValidate.push( TestItemContract.methods.getUint256().call() );
                    callsToValidateWith.push( function(result) {
                        let resultingNumber = new helpers.BigNumber( result );
                        let valdidation = new helpers.BigNumber(2).pow(256).sub(1);
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
};

setup.globals.runningTests.push( thisStep() );
