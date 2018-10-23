module.exports = function(setup) {

    let helpers = setup.helpers;

    contract('AirDrop -', accounts => {
        const TokenContract = artifacts.require('TestToken');
        const TokenAirDropContract = artifacts.require('TokenAirDrop');
        let Token;
        let AirDrop;

        const whole = ( 10 ** 18 );
        // 1 mil tokens
        const AirDropAmount = 1000000 * whole;
        const AirDropAmountBN = new helpers.BigNumber( AirDropAmount );

        let AirDropReceiversAndBalances = [
            {address: accounts[10], value: 100 * whole},
            {address: accounts[11], value: 200 * whole},
            {address: accounts[12], value: 300 * whole},
            {address: accounts[13], value: 400 * whole},
            {address: accounts[14], value: 500 * whole},
            {address: accounts[15], value: 600 * whole},
            {address: accounts[16], value: 700 * whole},
            {address: accounts[17], value: 800 * whole},
            {address: accounts[18], value: 900 * whole},
            {address: accounts[19], value: 1000 * whole},
        ];

        beforeEach(async () => {
            Token = await TokenContract.new();
            AirDrop = await TokenAirDropContract.new();
        });

        it('creation: Owner address is set properly', async() => {
            const AirDropOwner = await AirDrop.owner.call();
            assert.isAddress(AirDropOwner, 'owner address is invalid');
            assert.equal(AirDropOwner,  accounts[0], 'owner address mismatch');
        });

        it('init: Token Tracker address is set properly', async() => {
            await AirDrop.init(Token.address);
            const tokenContract = await AirDrop.tokenContract.call();
            assert.equal(tokenContract,  Token.address, 'token tracker address mismatch');
        });

        it("throws if init() is accessed by non deployer", async() => {
            return helpers.assertInvalidOpcode(async () => {
                let tx = await AirDrop.init(accounts[2], {
                    from: accounts[2]
                });
            });
        });

        it('init: Deployer can transfer tokens to AirDrop contract and balances are correct', async() => {
            // await AirDrop.init(Token.address);
            // const tokenContract = await AirDrop.tokenContract.call();
            // assert.equal(tokenContract,  Token.address, 'token tracker address mismatch');


            const DeployerBalanceBefore = await Token.balanceOf.call(accounts[0]);
            const AirDropBalanceBefore = await Token.balanceOf.call(AirDrop.address);

            await Token.transfer(AirDrop.address, AirDropAmount );

            const DeployerBalanceAfter = await Token.balanceOf.call(accounts[0]);
            const AirDropBalanceAfter = await Token.balanceOf.call(AirDrop.address);

            const DeployerBalanceBeforeBN = new helpers.BigNumber( DeployerBalanceBefore );
            const AirDropBalanceBeforeBN = new helpers.BigNumber( AirDropBalanceBefore );
            const DeployerBalanceAfterBN = new helpers.BigNumber( DeployerBalanceAfter );
            const AirDropBalanceAfterBN = new helpers.BigNumber( AirDropBalanceAfter );

            const AirDropBalanceAfterCheck = AirDropAmountBN;
            const DeployerBalanceAfterCheck = DeployerBalanceBeforeBN.sub(AirDropAmountBN);

            assert.equal(AirDropBalanceBeforeBN, 0,                                               'AirDrop Balance Before should be 0');
            assert.equal(AirDropBalanceAfterBN.toString(),  AirDropBalanceAfterCheck.toString(),  'AirDrop Balance After should be AirDropAmount');
            assert.equal(DeployerBalanceAfterBN.toString(), DeployerBalanceAfterCheck.toString(), 'Deployer Balance After should be Before - AirDropAmount');

        });

        context("AirDrop", async () => {

            beforeEach(async () => {
                // set tracker address into AirDrop Contract
                await AirDrop.init(Token.address);
                // transfer allocated tokens from deployer to AirDrop Contract
                await Token.transfer(AirDrop.address, AirDropAmount );
            });

            it('init: Token Tracker address is set properly', async() => {
                await AirDrop.init(Token.address);
                const tokenContract = await AirDrop.tokenContract.call();
                assert.equal(tokenContract,  Token.address, 'token tracker address mismatch');
            });

             it('init: AirDrop has expected balance', async() => {
                const AirDropBalanceAfter = await Token.balanceOf.call(AirDrop.address);
                assert.equal(AirDropBalanceAfter.toString(),  AirDropAmountBN.toString(),  'AirDrop Balance should be AirDropAmount');
            });

            it("throws if drop() is accessed by non deployer", async() => {
                return helpers.assertInvalidOpcode(async () => {
                    let tx = await AirDrop.drop([AirDropReceiversAndBalances[0].address],[AirDropReceiversAndBalances[0].value], {
                        from: accounts[2]
                    });
                });
            });

            it('distribution: can transfer tokens to 1 receiver and balances are correct', async() => {

                const AirDropBalanceBefore = new helpers.BigNumber(  await Token.balanceOf.call( AirDrop.address ) );
                let tx = await AirDrop.drop([AirDropReceiversAndBalances[0].address],[AirDropReceiversAndBalances[0].value]);

                const AirDropBalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDrop.address ) );
                const AirDropBalanceAfterCheck = AirDropBalanceBefore.sub( AirDropReceiversAndBalances[0].value );

                const ReceiverBalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDropReceiversAndBalances[0].address ) );
                const ReceiverBalanceAfterCheck = new helpers.BigNumber(  AirDropReceiversAndBalances[0].value );

                assert.equal(AirDropBalanceAfter.toString(),  AirDropBalanceAfterCheck.toString(),  'AirDrop Balance should be AirDropBalanceBefore - AirDropReceiversAndBalances[0].value ');
                assert.equal(ReceiverBalanceAfter.toString(),  ReceiverBalanceAfterCheck.toString(),  'Receiver Balance should be AirDropReceiversAndBalances[0].value ');

                await helpers.utils.showGasUsage(helpers, tx, "One");

            });

            it('distribution: can transfer tokens to 2 receivers and balances are correct', async() => {

                const AirDropBalanceBefore = new helpers.BigNumber(  await Token.balanceOf.call( AirDrop.address ) );

                let tx = await AirDrop.drop(
                    [
                        AirDropReceiversAndBalances[0].address,
                        AirDropReceiversAndBalances[1].address
                    ],
                    [
                        AirDropReceiversAndBalances[0].value,
                        AirDropReceiversAndBalances[1].value
                    ]
                );

                const AirDropBalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDrop.address ) );
                let AirDropBalanceAfterCheck = AirDropBalanceBefore.sub( AirDropReceiversAndBalances[0].value );
                AirDropBalanceAfterCheck = AirDropBalanceAfterCheck.sub( AirDropReceiversAndBalances[1].value );

                const Receiver0BalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDropReceiversAndBalances[0].address ) );
                const Receiver0BalanceAfterCheck = new helpers.BigNumber(  AirDropReceiversAndBalances[0].value );

                const Receiver1BalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDropReceiversAndBalances[1].address ) );
                const Receiver1BalanceAfterCheck = new helpers.BigNumber(  AirDropReceiversAndBalances[1].value );

                assert.equal(AirDropBalanceAfter.toString(),  AirDropBalanceAfterCheck.toString(),  'AirDrop Balance should be AirDropBalanceBefore - AirDropReceiversAndBalances[0 & 1].value ');
                assert.equal(Receiver0BalanceAfter.toString(),  Receiver0BalanceAfterCheck.toString(),  'Receiver Balance should be AirDropReceiversAndBalances[0].value ');
                assert.equal(Receiver1BalanceAfter.toString(),  Receiver1BalanceAfterCheck.toString(),  'Receiver Balance should be AirDropReceiversAndBalances[1].value ');

                await helpers.utils.showGasUsage(helpers, tx, "Two");

            });

            it('distribution: can transfer tokens to 3 receivers and balances are correct', async() => {

                const AirDropBalanceBefore = new helpers.BigNumber(  await Token.balanceOf.call( AirDrop.address ) );
                let tx = await AirDrop.drop(
                    [
                        AirDropReceiversAndBalances[0].address,
                        AirDropReceiversAndBalances[1].address,
                        AirDropReceiversAndBalances[9].address
                    ],
                    [
                        AirDropReceiversAndBalances[0].value,
                        AirDropReceiversAndBalances[1].value,
                        AirDropReceiversAndBalances[9].value
                    ]
                );

                const AirDropBalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDrop.address ) );
                let AirDropBalanceAfterCheck = AirDropBalanceBefore.sub( AirDropReceiversAndBalances[0].value );
                AirDropBalanceAfterCheck = AirDropBalanceAfterCheck.sub( AirDropReceiversAndBalances[1].value );
                AirDropBalanceAfterCheck = AirDropBalanceAfterCheck.sub( AirDropReceiversAndBalances[9].value );

                const Receiver0BalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDropReceiversAndBalances[0].address ) );
                const Receiver0BalanceAfterCheck = new helpers.BigNumber(  AirDropReceiversAndBalances[0].value );

                const Receiver1BalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDropReceiversAndBalances[1].address ) );
                const Receiver1BalanceAfterCheck = new helpers.BigNumber(  AirDropReceiversAndBalances[1].value );

                const Receiver9BalanceAfter = new helpers.BigNumber(  await Token.balanceOf.call( AirDropReceiversAndBalances[9].address ) );
                const Receiver9BalanceAfterCheck = new helpers.BigNumber(  AirDropReceiversAndBalances[9].value );

                assert.equal(AirDropBalanceAfter.toString(),  AirDropBalanceAfterCheck.toString(),  'AirDrop Balance should be AirDropBalanceBefore - AirDropReceiversAndBalances[0 & 1].value ');
                assert.equal(Receiver0BalanceAfter.toString(),  Receiver0BalanceAfterCheck.toString(),  'Receiver Balance should be AirDropReceiversAndBalances[0].value ');
                assert.equal(Receiver1BalanceAfter.toString(),  Receiver1BalanceAfterCheck.toString(),  'Receiver Balance should be AirDropReceiversAndBalances[1].value ');
                assert.equal(Receiver9BalanceAfter.toString(),  Receiver9BalanceAfterCheck.toString(),  'Receiver Balance should be AirDropReceiversAndBalances[9].value ');

                await helpers.utils.showGasUsage(helpers, tx, "Three");

            });

            it('gas: ERC20 Token transfer gas cost', async() => {
                let tx = await Token.transfer(accounts[1], AirDropReceiversAndBalances[0].value );
                await helpers.utils.showGasUsage(helpers, tx, "ERC20 Transfer");
            });

            it('gas: AirDrop to 300 receivers', async() => {

                let receivers = [];
                let values = [];

                let times = 30;
                for(let t = 0; t < times; t++)
                {
                    for (let i = 0; i < AirDropReceiversAndBalances.length; i++) {
                        receivers.push(AirDropReceiversAndBalances[i].address);
                        values.push(AirDropReceiversAndBalances[i].value);
                    }
                }

                let tx = await AirDrop.drop(receivers,values);
                await helpers.utils.showGasUsage(helpers, tx, "Airdrop 300");
            });

        });
    })
};
