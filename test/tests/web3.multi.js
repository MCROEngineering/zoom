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
        
        describe("Web3 batched requests", async() => {

        })

        describe("Web3 + ZOOM Provider", async() => {

        })
        

        // it("deploy test", async() => {

            // console.log( accounts );
            // console.log( "ListContractABI:", globals.abis.ItemEntity );
            // console.log("ItemEntityContractInstance", ItemEntityContractInstance);

            // await helpers.web3.evm.revert(snapshots[SnapShotKey]);

            // uint8 numVar, bool boolVar, string stringVar, bytes8 bytesVar
            // const ItemEntityContract = await ItemEntity.new("test item", "0x0000000000000000000000000000000000000099");

            /*
            */

            /*
            const call = ItemEntityContractInstance.methods.multipleOne(1, true, "test", "0x6279746573000000");
            const callBinary = call.encodeABI();
            const callGas = await call.estimateGas();
            
            const callGas2 = await getGasUsageEstimate( call );

            // console.log( "address:", ItemEntityContract.address );

            console.log( "data:", callBinary );
            console.log( "estimatedGas: ", callGas );
            console.log( "estimatedGas2:", callGas2 );
            */

            // console.log( "req", await ItemEntityContract.multipleOne.request(1, true, "test", "0x6279746573000000" ) );

            // const data = await ItemEntityContract.multipleOne.call(1, true, "test", "0x6279746573000000" ) //.encodeABI();

            /*

            */
            /*
            0x434a98d8
            0000000000000000000000000000000000000000000000000000000000000001
            0000000000000000000000000000000000000000000000000000000000000001
            0000000000000000000000000000000000000000000000000000000000000080
            0100000000000000000000000000000000000000000000000000000000000000
            0000000000000000000000000000000000000000000000000000000000000004
            7465737400000000000000000000000000000000000000000000000000000000

            // this is a string value that goes over 32 bytes and we are using it to test this thing

            0x434a98d8
            0000000000000000000000000000000000000000000000000000000000000001
            0000000000000000000000000000000000000000000000000000000000000001
            0000000000000000000000000000000000000000000000000000000000000080
            0102030405000000000000000000000000000000000000000000000000000000
            00000000000000000000000000000000000000000000000000000000000000ac
            74686973206973206120737472696e672076616c7565207468617420676f6573
            206f76657220333220627974657320616e6420776520617265207573696e6720
            697420746f20746573742074686973207468696e672c20746869732069732061
            20737472696e672076616c7565207468617420676f6573206f76657220333220
            627974657320616e6420776520617265207573696e6720697420746f20746573
            742074686973207468696e670000000000000000000000000000000000000000


            0x27285d5d
            0000000000000000000000000000000000000000000000000000000000000060
            00000000000000000000000000000000000000000000000000000000000000a0
            00000000000000000000000000000000000000000000000000000000000000e0
            0000000000000000000000000000000000000000000000000000000000000003
            6f6e650000000000000000000000000000000000000000000000000000000000
            0000000000000000000000000000000000000000000000000000000000000003
            74776f0000000000000000000000000000000000000000000000000000000000
            0000000000000000000000000000000000000000000000000000000000000005
            7468726565000000000000000000000000000000000000000000000000000000


            0x27285d5d
            0000000000000000000000000000000000000000000000000000000000000060
            00000000000000000000000000000000000000000000000000000000000000a0
            00000000000000000000000000000000000000000000000000000000000000e0
            0000000000000000000000000000000000000000000000000000000000000001
            3100000000000000000000000000000000000000000000000000000000000000
            0000000000000000000000000000000000000000000000000000000000000001
            3200000000000000000000000000000000000000000000000000000000000000
            0000000000000000000000000000000000000000000000000000000000000001
            3300000000000000000000000000000000000000000000000000000000000000

            0x29e99f07
            0000000000000000000000000000000000000000000000000000000000000064
            0000000000000000000000000000000000000000000000000000000029e99f07

            - 1 byte uint8 call type ( 1 normal / 2 - to address is result of a previous call )
            00
            - 2 bytes uint16 call_data length
            0001
            - 2 bytes uint16 result_id that holds our call's address
            0001
            - 2 bytes uint16 offset in bytes where the address starts in said result
            0000
            - empty - 1
            00
            - 20 bytes address / or 20 bytes of 0's if type 2
            0000000000000000000000000000000000000099
            - 4 bytes method sha
            27285d5d
            | call data
            0000000000000000000000000000000000000000000000000000000000000060
            00000000000000000000000000000000000000000000000000000000000000a0
            00000000000000000000000000000000000000000000000000000000000000e0
            0000000000000000000000000000000000000000000000000000000000000001
            3100000000000000000000000000000000000000000000000000000000000000
            0000000000000000000000000000000000000000000000000000000000000001
            3200000000000000000000000000000000000000000000000000000000000000
            0000000000000000000000000000000000000000000000000000000000000001
            3300000000000000000000000000000000000000000000000000000000000000

            */
            /*
            utils.toLog("  Deploy GatewayInterface");
            await deployer.deploy(GatewayInterface);

            utils.toLog("  Deploy ApplicationEntity");
            await deployer.deploy(ApplicationEntity);
            let app = await ApplicationEntity.at( ApplicationEntity.address );

            utils.toLog("  Add ApplicationEntity Bylaws");

            await addBylawsIntoApp(app, settings);
            utils.toLog("  Added Bylaws");

            utils.toLog("  Deploy Assets");
            for(let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                utils.toLog("    Asset: " + entity.contract_name);
                let name = entity.contract_name;

                await deployer.deploy(entity);
                let arts = artifacts.require(name);
                let contract = arts.at(arts.address);
                await contract.setInitialApplicationAddress(app.address);
            }

            deployedAssets = assets.map(mapDeployedAssets);

            utils.toLog("  Link assets to ApplicationEntity");

            for(let d = 0; d < deployedAssets.length; d++) {
                let entity = deployedAssets[d];
                let receipt = await app[entity.method]( entity.address );
                let eventFilter = await utils.hasEvent(receipt, 'EventAppEntityInitAsset(bytes32,address)');
                utils.toLog("    Successfully linked: " +utils.colors.green+ web3util.toAscii(eventFilter[0].topics[1]) );
            }

            utils.toLog("  Link ApplicationEntity to GatewayInterface");

            let receipt = await app.linkToGateway(GatewayInterface.address, "https://blockbits.io");
            let eventFilter = utils.hasEvent(receipt, 'EventAppEntityReady(address)');
            utils.toLog("    "+utils.colors.green+"EventAppEntityReady => " + eventFilter.length+utils.colors.none);

            utils.toLog("  Apply initial Settings into Entities:");

            let TokenManagerAsset = utils.getAssetContractByName(deployedAssets, "TokenManager");
            let MilestonesAsset = utils.getAssetContractByName(deployedAssets, "Milestones");
            let FundingAsset = utils.getAssetContractByName(deployedAssets, "Funding");

            // Setup token manager
            let TokenManagerAssetContract = await artifacts.require(TokenManagerAsset.name);
            TokenManagerAssetContract = await TokenManagerAssetContract.at(TokenManagerAsset.address);

            await TokenManagerAssetContract.addTokenSettingsAndInit(
                token_settings.supply,
                token_settings.decimals,
                token_settings.name,
                token_settings.symbol,
                token_settings.version
            );

            utils.toLog("  Added TokenManager Settings");

            // deploy the "ExtraFundingInputMarketing" contract and set it's address in the Token Manager

            await deployer.deploy(ExtraFundingInputMarketing);
            let extraFunding = await ExtraFundingInputMarketing.at( ExtraFundingInputMarketing.address );

            await extraFunding.addSettings(
                TokenManagerAsset.address,                          // TokenManager Entity address
                settings.platformWalletAddress,                     // Output Address
                settings.extra_marketing.hard_cap,                  // 300 ether hard cap
                settings.extra_marketing.tokens_per_eth,            // 20 000 BBX per ETH
                settings.extra_marketing.start_date,                // 31.01.2018
                settings.extra_marketing.end_date                   // 10.03.2018
            );

            await TokenManagerAssetContract.setMarketingMethodAddress( extraFunding.address );

            utils.toLog("  Added ExtraFundingInput Settings");

            // Setup Funding
            let FundingAssetContract = await artifacts.require(FundingAsset.name);
            FundingAssetContract = await FundingAssetContract.at(FundingAsset.address);

            for (let i = 0; i < settings.funding_periods.length; i++) {
                utils.toLog("  addFundingStage["+i+"]");
                let stage = settings.funding_periods[i];

                console.log(stage);


                await FundingAssetContract.addFundingStage(
                    stage.name,
                    stage.start_time,
                    stage.end_time,
                    stage.amount_cap_soft,
                    stage.amount_cap_hard,
                    stage.methods,
                    stage.minimum_entry,
                    stage.fixed_tokens,
                    stage.price_addition_percentage,
                    stage.token_share_percentage
                );

            }

            // add global funding settings like hard cap and such
            await FundingAssetContract.addSettings(
                settings.platformWalletAddress,
                settings.bylaws["funding_global_soft_cap"],
                settings.bylaws["funding_global_hard_cap"],
                settings.bylaws["token_sale_percentage"]
            );

            utils.toLog("  Added Funding Settings");

            */

            // assert.equal(1,1, "Error");
        // });

    });

}

setup.globals.runningTests.push( thisStep(setup) );

