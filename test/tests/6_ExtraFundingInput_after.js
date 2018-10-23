module.exports = function(setup) {
    let helpers = setup.helpers;
    let contracts = setup.contracts;
    let settings = setup.settings;
    let assetContractNames = setup.assetContractNames;

    let pre_ico_settings = setup.settings.funding_periods[0];
    let ico_settings = setup.settings.funding_periods[1];

    let snapshotsEnabled = true;
    let snapshots = [];

    contract('Marketing - Extra Funding Pool - after start time', accounts => {
        let tx, TestBuildHelper, FundingInputDirect, FundingInputMilestone, ProposalsAsset,
            MilestonesAsset, ApplicationEntity, beforeProposalRequiredStateChanges, FundingAsset, FundingManagerAsset,
            TokenManagerAsset, TokenEntity, ExtraFundingInputMarketing, validation = {};

        let platformWalletAddress = accounts[19];

        let wallet1 = accounts[10];
        let wallet2 = accounts[11];
        let wallet3 = accounts[12];
        let wallet4 = accounts[13];
        let wallet5 = accounts[14];


        beforeEach(async () => {

            let SnapShotKey = "ApplicationInit";
            if (typeof snapshots[SnapShotKey] !== "undefined" && snapshotsEnabled) {
                // restore snapshot
                await helpers.web3.evm.revert(snapshots[SnapShotKey]);
                // save again because whomever wrote test rpc had the impression no one would ever restore twice.. dafuq
                snapshots[SnapShotKey] = await helpers.web3.evm.snapshot();

            } else {

                TestBuildHelper = new helpers.TestBuildHelper(setup, assert, accounts, platformWalletAddress);
                await TestBuildHelper.deployAndInitializeApplication();
                await TestBuildHelper.AddAllAssetSettingsAndLock();
                let FundingContract = await TestBuildHelper.getDeployedByName("Funding");

                // funding inputs
                let FundingInputDirectAddress = await FundingContract.DirectInput.call();
                let FundingInputMilestoneAddress = await FundingContract.MilestoneInput.call();
                let FundingInputDirectContract = await helpers.getContract('FundingInputDirect');
                let FundingInputMilestoneContract = await helpers.getContract('FundingInputMilestone');
                FundingInputDirect = await FundingInputDirectContract.at(FundingInputDirectAddress);
                FundingInputMilestone = await FundingInputMilestoneContract.at(FundingInputMilestoneAddress);

                // time travel to pre ico start time
                await TestBuildHelper.timeTravelTo(pre_ico_settings.start_time + 1);
                await TestBuildHelper.doApplicationStateChanges("After PRE ICO START", false);

                await FundingInputMilestone.sendTransaction({
                    value: 1000 * helpers.solidity.ether,
                    from: wallet1
                });

                // create snapshot
                if (snapshotsEnabled) {
                    snapshots[SnapShotKey] = await helpers.web3.evm.snapshot();
                }
            }

            FundingAsset = await TestBuildHelper.getDeployedByName("Funding");
            FundingManagerAsset = await TestBuildHelper.getDeployedByName("FundingManager");
            TokenManagerAsset = await TestBuildHelper.getDeployedByName("TokenManager");
            let TokenEntityAddress = await TokenManagerAsset.TokenEntity.call();
            let TokenEntityContract = await helpers.getContract("TestToken");
            TokenEntity = await TokenEntityContract.at(TokenEntityAddress);

            ExtraFundingInputMarketing = await TestBuildHelper.getDeployedByName("ExtraFundingInputMarketing");

        });


         it("throws if trying to set settings again after they were already set once", async() => {

            let settings_added = await ExtraFundingInputMarketing.settings_added.call();
            assert.equal(settings_added.toString(), "true", 'settings_added should be true');

            return helpers.assertInvalidOpcode(async () => {
                await ExtraFundingInputMarketing.addSettings(
                    ExtraFundingInputMarketing.address,         // address
                    ExtraFundingInputMarketing.address,         // address
                    1,                                          // 1 wei
                    20000,                                      // 20 000 BBX per ETH
                    1517356800,                                 // 31.01.2018
                    1520640000                                  // 10.03.2018
                );
            });
        });

        it("has correct settings", async() => {

            let setting_start_time = await ExtraFundingInputMarketing.start_time.call();
            let setting_TokenManagerEntity = await ExtraFundingInputMarketing.TokenManagerEntity.call();
            let setting_outputWalletAddress = await ExtraFundingInputMarketing.outputWalletAddress.call();
            let setting_hardCap = await ExtraFundingInputMarketing.hardCap.call();
            let setting_tokensPerEth = await ExtraFundingInputMarketing.tokensPerEth.call();
            let setting_end_time = await ExtraFundingInputMarketing.end_time.call();
            let settings_added = await ExtraFundingInputMarketing.settings_added.call();

            assert.equal(setting_TokenManagerEntity.toString(), TokenManagerAsset.address.toString(), 'TokenManagerAsset address should match');
            assert.equal(setting_outputWalletAddress.toString(), platformWalletAddress.toString(), 'platformWalletAddress address should match');
            assert.equal(setting_hardCap.toString(), settings.extra_marketing.hard_cap.toString(), 'hard_cap should match');
            assert.equal(setting_tokensPerEth.toString(), settings.extra_marketing.tokens_per_eth.toString(), 'tokens_per_eth should match');
            assert.equal(setting_start_time.toString(), settings.extra_marketing.start_date.toString(), 'start_date should match');
            assert.equal(setting_end_time.toString(), settings.extra_marketing.end_date.toString(), 'end_date should match');
            assert.equal(settings_added.toString(), "true", 'settings_added should be true');
        });




        context("1 wallet buying 10 eth worth of tokens", async () => {

            let initial_walletEthBalance, initial_walletBBXBalance, initial_tokenSupply,
                initial_platformWalletEthBalance, initial_platformWalletBBXBalance, initial_amount, initial_cap, gasCost;
            let buy_value = 10 * helpers.solidity.ether;

            beforeEach(async () => {

                // save initial balances, so we can validate them
                initial_walletEthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, wallet2));
                initial_walletBBXBalance = await TokenEntity.balanceOf.call(wallet2);

                initial_tokenSupply = await TokenEntity.totalSupply.call();
                initial_platformWalletEthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, platformWalletAddress));
                initial_platformWalletBBXBalance = await TokenEntity.balanceOf.call(platformWalletAddress);

                initial_amount = await ExtraFundingInputMarketing.AmountRaised.call();
                initial_cap = await ExtraFundingInputMarketing.hardCap.call();

                tx = await ExtraFundingInputMarketing.sendTransaction({
                    value: buy_value,
                    from: wallet2
                });

                let gasUsed = new helpers.BigNumber( tx.receipt.cumulativeGasUsed );
                let gasPrice = await helpers.utils.getGasPrice(helpers);
                gasCost = gasUsed.mul(gasPrice);

            });

            it("sender wallet has (contributed value + gas cost) subtracted", async () => {
                let after_walletEthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, wallet2));
                let validation = new helpers.BigNumber(initial_walletEthBalance).sub(buy_value) ;
                validation = validation.sub(gasCost);

                assert.equal(validation.toString(), after_walletEthBalance.toString(), 'walletEthBalance should match');
            });

            it("sender wallet received correct amount of tokens (200 000)", async () => {
                let after_walletBBXBalance = new helpers.BigNumber(await TokenEntity.balanceOf.call(wallet2));
                let validation = new helpers.BigNumber( buy_value ).mul(settings.extra_marketing.tokens_per_eth);

                assert.equal(validation.toString(), after_walletBBXBalance, 'walletBBXBalance should match');
            });

            it("initial token supply increases by correct amount of tokens purchased (200 000)", async () => {
                let after_tokenSupply = await TokenEntity.totalSupply.call();
                let validation = new helpers.BigNumber( buy_value ).mul(settings.extra_marketing.tokens_per_eth);
                validation = validation.add(initial_tokenSupply);

                assert.equal(validation.toString(), after_tokenSupply.toString(), 'after_tokenSupply should match');
            });

            it("output wallet new ETH balance increases by contribution amount", async () => {
                let after_platformWalletEthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, platformWalletAddress));
                let validation = initial_platformWalletEthBalance.add(buy_value);

                assert.equal(validation.toString(), after_platformWalletEthBalance.toString(), 'platformWalletEthBalance should match');
            });

            it("amount raised increases by contribution amount", async () => {
                let after_amount = await ExtraFundingInputMarketing.AmountRaised.call();
                let validation = initial_amount.add(buy_value);

                assert.equal(validation.toString(), after_amount.toString(), 'after_amount should match');
            });

            it("hard cap is unchanged", async () => {
                let after_cap = await ExtraFundingInputMarketing.hardCap.call();
                assert.equal(after_cap.toString(), initial_cap.toString(), 'hard_cap should not change');
            });

            it("still accepts payments", async () => {
                let canAcceptPayment = await ExtraFundingInputMarketing.canAcceptPayment.call();
                assert.equal(canAcceptPayment.toString(), 'true', 'canAcceptPayment should be true');
            });
        });


        context("1 wallet buying 300 eth worth of tokens ( hard cap )", async () => {

            let initial_walletEthBalance, initial_walletBBXBalance, initial_tokenSupply,
                initial_platformWalletEthBalance, initial_platformWalletBBXBalance, initial_amount, initial_cap, gasCost;
            let buy_value = 300 * helpers.solidity.ether;

            beforeEach(async () => {

                // save initial balances, so we can validate them
                initial_walletEthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, wallet2));
                initial_walletBBXBalance = await TokenEntity.balanceOf.call(wallet2);

                initial_tokenSupply = await TokenEntity.totalSupply.call();
                initial_platformWalletEthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, platformWalletAddress));
                initial_platformWalletBBXBalance = await TokenEntity.balanceOf.call(platformWalletAddress);

                initial_amount = await ExtraFundingInputMarketing.AmountRaised.call();
                initial_cap = await ExtraFundingInputMarketing.hardCap.call();

                tx = await ExtraFundingInputMarketing.sendTransaction({
                    value: buy_value,
                    from: wallet2
                });

                let gasUsed = new helpers.BigNumber( tx.receipt.cumulativeGasUsed );
                let gasPrice = await helpers.utils.getGasPrice(helpers);
                gasCost = gasUsed.mul(gasPrice);

            });

            it("throws if trying to buy once cap is reached", async() => {
                return helpers.assertInvalidOpcode(async () => {
                    await ExtraFundingInputMarketing.sendTransaction({
                        value: 1,
                        from: wallet2
                    });
                });
            });

            it("sender wallet has (contributed value + gas cost) subtracted", async () => {
                let after_walletEthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, wallet2));
                let validation = new helpers.BigNumber(initial_walletEthBalance).sub(buy_value) ;
                validation = validation.sub(gasCost);

                assert.equal(validation.toString(), after_walletEthBalance.toString(), 'walletEthBalance should match');
            });

            it("sender wallet received correct amount of tokens (6 000 000)", async () => {
                let after_walletBBXBalance = new helpers.BigNumber(await TokenEntity.balanceOf.call(wallet2));
                let validation = new helpers.BigNumber( buy_value ).mul(settings.extra_marketing.tokens_per_eth);

                assert.equal(validation.toString(), after_walletBBXBalance, 'walletBBXBalance should match');
            });

            it("initial token supply increases by correct amount of tokens purchased (6 000 000)", async () => {
                let after_tokenSupply = await TokenEntity.totalSupply.call();
                let validation = new helpers.BigNumber( buy_value ).mul(settings.extra_marketing.tokens_per_eth);
                validation = validation.add(initial_tokenSupply);

                assert.equal(validation.toString(), after_tokenSupply.toString(), 'after_tokenSupply should match');
            });

            it("output wallet new ETH balance increases by contribution amount", async () => {
                let after_platformWalletEthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, platformWalletAddress));
                let validation = initial_platformWalletEthBalance.add(buy_value);

                assert.equal(validation.toString(), after_platformWalletEthBalance.toString(), 'platformWalletEthBalance should match');
            });

            it("amount raised increases by contribution amount", async () => {
                let after_amount = await ExtraFundingInputMarketing.AmountRaised.call();
                let validation = initial_amount.add(buy_value);

                assert.equal(validation.toString(), after_amount.toString(), 'after_amount should match');
            });

            it("hard cap is unchanged", async () => {
                let after_cap = await ExtraFundingInputMarketing.hardCap.call();
                assert.equal(after_cap.toString(), initial_cap.toString(), 'hard_cap should not change');
            });

            it("no longer accepts payments", async () => {
                let canAcceptPayment = await ExtraFundingInputMarketing.canAcceptPayment.call();
                assert.equal(canAcceptPayment.toString(), 'false', 'canAcceptPayment should be false');
            });



        });

        context("1 wallet sending 500 eth to buy tokens, 200 eth over hard cap", async () => {

            let initial_walletEthBalance, initial_walletBBXBalance, initial_tokenSupply,
                initial_platformWalletEthBalance, initial_platformWalletBBXBalance, initial_amount, initial_cap, gasCost;
            let accepted_value;
            let buy_value = 500 * helpers.solidity.ether;

            beforeEach(async () => {

                let value_over = new helpers.BigNumber( await ExtraFundingInputMarketing.getValueOverCurrentCap.call(buy_value) );
                accepted_value = new helpers.BigNumber(buy_value).sub(value_over);

                // save initial balances, so we can validate them
                initial_walletEthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, wallet2));
                initial_walletBBXBalance = await TokenEntity.balanceOf.call(wallet2);

                initial_tokenSupply = await TokenEntity.totalSupply.call();
                initial_platformWalletEthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, platformWalletAddress));
                initial_platformWalletBBXBalance = await TokenEntity.balanceOf.call(platformWalletAddress);

                initial_amount = await ExtraFundingInputMarketing.AmountRaised.call();
                initial_cap = await ExtraFundingInputMarketing.hardCap.call();

                tx = await ExtraFundingInputMarketing.sendTransaction({
                    value: buy_value,
                    from: wallet2
                });

                let gasUsed = new helpers.BigNumber( tx.receipt.cumulativeGasUsed );
                let gasPrice = await helpers.utils.getGasPrice(helpers);
                gasCost = gasUsed.mul(gasPrice);

            });

            it("throws if trying to buy once cap is reached", async() => {
                return helpers.assertInvalidOpcode(async () => {
                    tx = await ExtraFundingInputMarketing.sendTransaction({
                        value: 1,
                        from: wallet2
                    });
                });
            });

            it("sender wallet has (contributed value + gas cost) subtracted", async () => {
                let after_walletEthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, wallet2));
                let validation = new helpers.BigNumber(initial_walletEthBalance).sub(accepted_value) ;
                validation = validation.sub(gasCost);

                assert.equal(validation.toString(), after_walletEthBalance.toString(), 'walletEthBalance should match');
            });

            it("sender wallet received correct amount of tokens (6 000 000)", async () => {
                let after_walletBBXBalance = new helpers.BigNumber(await TokenEntity.balanceOf.call(wallet2));
                let validation = new helpers.BigNumber( accepted_value ).mul(settings.extra_marketing.tokens_per_eth);

                assert.equal(validation.toString(), after_walletBBXBalance, 'walletBBXBalance should match');
            });

            it("initial token supply increases by correct amount of tokens purchased (6 000 000)", async () => {
                let after_tokenSupply = await TokenEntity.totalSupply.call();
                let validation = new helpers.BigNumber( accepted_value ).mul(settings.extra_marketing.tokens_per_eth);
                validation = validation.add(initial_tokenSupply);

                assert.equal(validation.toString(), after_tokenSupply.toString(), 'after_tokenSupply should match');
            });

            it("output wallet new ETH balance increases by contribution amount", async () => {
                let after_platformWalletEthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, platformWalletAddress));
                let validation = initial_platformWalletEthBalance.add(accepted_value);

                assert.equal(validation.toString(), after_platformWalletEthBalance.toString(), 'platformWalletEthBalance should match');
            });

            it("amount raised increases by contribution amount", async () => {
                let after_amount = await ExtraFundingInputMarketing.AmountRaised.call();
                let validation = initial_amount.add(accepted_value);

                assert.equal(validation.toString(), after_amount.toString(), 'after_amount should match');
            });

            it("hard cap is unchanged", async () => {
                let after_cap = await ExtraFundingInputMarketing.hardCap.call();
                assert.equal(after_cap.toString(), initial_cap.toString(), 'hard_cap should not change');
            });

            it("no longer accepts payments", async () => {
                let canAcceptPayment = await ExtraFundingInputMarketing.canAcceptPayment.call();
                assert.equal(canAcceptPayment.toString(), 'false', 'canAcceptPayment should be false');
            });



        });

        context("2 wallets sending 10 eth then 500 eth to buy tokens, 210 eth over hard cap", async () => {

            let initial_wallet3EthBalance, initial_wallet3BBXBalance, initial_wallet2EthBalance, initial_wallet2BBXBalance,
                initial_tokenSupply, initial_platformWalletEthBalance, initial_platformWalletBBXBalance, initial_amount,
                initial_cap, gasCost1, gasCost2;

            let accepted_value;
            let buy_value = 500 * helpers.solidity.ether;
            let first_value = new helpers.BigNumber(10 * helpers.solidity.ether);

            beforeEach(async () => {

                let value_over = new helpers.BigNumber( await ExtraFundingInputMarketing.getValueOverCurrentCap.call(buy_value) );
                accepted_value = new helpers.BigNumber(buy_value).sub(value_over);
                accepted_value = accepted_value.sub(first_value);

                // save initial balances, so we can validate them
                initial_wallet3EthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, wallet3));
                initial_wallet3BBXBalance = await TokenEntity.balanceOf.call(wallet3);

                // save initial balances, so we can validate them
                initial_wallet2EthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, wallet2));
                initial_wallet2BBXBalance = await TokenEntity.balanceOf.call(wallet2);

                initial_tokenSupply = await TokenEntity.totalSupply.call();
                initial_platformWalletEthBalance = await new helpers.BigNumber( await helpers.utils.getContractBalance(helpers, platformWalletAddress));
                initial_platformWalletBBXBalance = await TokenEntity.balanceOf.call(platformWalletAddress);

                initial_amount = await ExtraFundingInputMarketing.AmountRaised.call();
                initial_cap = await ExtraFundingInputMarketing.hardCap.call();


                tx = await ExtraFundingInputMarketing.sendTransaction({
                    value: first_value,
                    from: wallet3
                });

                let gasUsed = new helpers.BigNumber( tx.receipt.cumulativeGasUsed );
                let gasPrice = await helpers.utils.getGasPrice(helpers);
                gasCost1 = gasUsed.mul(gasPrice);

                let tx2 = await ExtraFundingInputMarketing.sendTransaction({
                    value: buy_value,
                    from: wallet2
                });

                gasUsed = new helpers.BigNumber( tx2.receipt.cumulativeGasUsed );
                gasPrice = await helpers.utils.getGasPrice(helpers);
                gasCost2 = gasUsed.mul(gasPrice);

            });

            it("throws if trying to buy once cap is reached", async() => {
                return helpers.assertInvalidOpcode(async () => {
                    tx = await ExtraFundingInputMarketing.sendTransaction({
                        value: 1,
                        from: wallet2
                    });
                });
            });

            it("sender1 wallet has (contributed value + gas cost) subtracted", async () => {
                let after_walletEthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, wallet3));
                let validation = new helpers.BigNumber(initial_wallet3EthBalance).sub(first_value) ;
                validation = validation.sub(gasCost1);

                assert.equal(validation.toString(), after_walletEthBalance.toString(), 'walletEthBalance should match');
            });

            it("sender1 wallet received correct amount of tokens (200 000)", async () => {
                let after_wallet3BBXBalance = new helpers.BigNumber(await TokenEntity.balanceOf.call(wallet3));
                let validation = new helpers.BigNumber( first_value ).mul(settings.extra_marketing.tokens_per_eth);

                assert.equal(validation.toString(), after_wallet3BBXBalance, 'wallet3BBXBalance should match');
            });

            it("sender2 wallet has (contributed value + gas cost) subtracted", async () => {
                let after_wallet2EthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, wallet2));
                let validation = new helpers.BigNumber(initial_wallet2EthBalance).sub(accepted_value) ;
                validation = validation.sub(gasCost2);

                assert.equal(validation.toString(), after_wallet2EthBalance.toString(), 'wallet2EthBalance should match');
            });

            it("sender2 wallet received correct amount of tokens (5800 000)", async () => {
                let after_wallet2BBXBalance = new helpers.BigNumber(await TokenEntity.balanceOf.call(wallet2));
                let validation = new helpers.BigNumber( accepted_value ).mul(settings.extra_marketing.tokens_per_eth);

                assert.equal(validation.toString(), after_wallet2BBXBalance, 'wallet2BBXBalance should match');
            });


            it("initial token supply increases by correct amount of tokens purchased (6 000 000)", async () => {
                let after_tokenSupply = await TokenEntity.totalSupply.call();
                let contributions = await ExtraFundingInputMarketing.AmountRaised.call();
                let validation = new helpers.BigNumber( contributions ).mul(settings.extra_marketing.tokens_per_eth);
                validation = validation.add(initial_tokenSupply);

                assert.equal(validation.toString(), after_tokenSupply.toString(), 'after_tokenSupply should match');
            });

            it("output wallet new ETH balance increases by both contributions amount", async () => {
                let after_platformWalletEthBalance = await new helpers.BigNumber(await helpers.utils.getContractBalance(helpers, platformWalletAddress));
                let validation = initial_platformWalletEthBalance.add(accepted_value);
                validation = validation.add(first_value);

                assert.equal(validation.toString(), after_platformWalletEthBalance.toString(), 'platformWalletEthBalance should match');
            });

            it("amount raised increases by both contributions amount", async () => {
                let after_amount = await ExtraFundingInputMarketing.AmountRaised.call();
                let validation = initial_amount.add(accepted_value);
                validation = validation.add(first_value);

                assert.equal(validation.toString(), after_amount.toString(), 'after_amount should match');
            });

            it("hard cap is unchanged", async () => {
                let after_cap = await ExtraFundingInputMarketing.hardCap.call();
                assert.equal(after_cap.toString(), initial_cap.toString(), 'hard_cap should not change');
            });

            it("no longer accepts payments", async () => {
                let canAcceptPayment = await ExtraFundingInputMarketing.canAcceptPayment.call();
                assert.equal(canAcceptPayment.toString(), 'false', 'canAcceptPayment should be false');
            });



        });

    });

};