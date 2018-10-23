module.exports = function(setup) {

    const utils                         = require('../test/helpers/utils');
    const web3util                      = require('web3-utils');
    const Token                         = artifacts.require('Token');
    const GatewayInterface              = artifacts.require('GatewayInterface');
    const ApplicationEntity             = artifacts.require('ApplicationEntity');
    const ExtraFundingInputMarketing    = artifacts.require('ExtraFundingInputMarketing');

    const ProjectSettings               = require('../project-settings.js');
    const getContract = (obj)           => artifacts.require(obj.name);

    let settings = ProjectSettings.application_settings;
    settings.sourceCodeUrl = "http://www.blockbits.io/";

    let token_settings = settings.token;

    const assets = [
        {'name' : 'ListingContract'},
        {'name' : 'NewsContract'},
        {'name' : 'TokenManager'},
        {'name' : 'Proposals'},
        {'name' : 'FundingManager'},
        {'name' : 'Funding'},
        {'name' : 'Milestones'},
        {'name' : 'Meetings'},
        {'name' : 'BountyManager'},
    ];


    const entities = assets.map(getContract);

    let deployedAssets = [];

    const mapDeployedAssets = (asset) => {
        let obj = {};
        contract = getContract(asset);
        obj.name = asset.name;
        obj.method = "addAsset"+asset.name;
        obj.address = contract.address;
        obj.contract_name = contract.contract_name;
        obj.contract = contract;
        return obj;
    };


    contract('test deploy', accounts => {


        beforeEach(async () => {

        });


        it("deploy test", async() => {


            utils.toLog(
                ' ----------------------------------------------------------------\n'+
                '  Stage 1 - Initial Gateway and Application Deployment\n'+
                '  ----------------------------------------------------------------\n'
            );

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

                /*
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

                 */

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



        });

    });

};