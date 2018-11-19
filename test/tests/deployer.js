module.exports = async function thisStep(setup) {

    const helpers                       = setup.helpers;
    const globals                       = setup.globals;
    const utils                         = helpers.utils;
    const TestDummyRecords              = globals.TestDummyRecords;

    const ListContract                  = await utils.getAbiFile('ListContract');
    const ItemEntity                    = await utils.getAbiFile('ItemEntity');
    const Zoom                          = await utils.getAbiFile('Zoom');

    let ItemEntity_address;
    let ItemEntityContractInstance;

    let ListContract_address;
    let ListContractInstance;

    let ZoomContract_address;
    let ZoomContractInstance;

    const ItemAddresses = [];
    const fromAccount = "0x4b70518d879a4e2da4ad9cf0189b32d8dc6b7a9b";

    // Deploy Zoom contract
    await new helpers.web3.eth.Contract(Zoom.abi, "0x0000000000000000000000000000000000000000").deploy({
        data: Zoom.bytecode
    }).send({
        from: fromAccount,
        gas: 6700000,
    }, function(error, transactionHash){
        if( error ) {
            console.log("error", error);
        }
    }).on('receipt', function(receipt){
        ZoomContract_address = receipt.contractAddress;
    });

    // Deploy List contract
    await new helpers.web3.eth.Contract(ListContract.abi, "0x0000000000000000000000000000000000000000").deploy({
        data: ListContract.bytecode
    }).send({
        from: fromAccount,
        gas: 6700000,
    }, function(error, transactionHash){
        if( error ) {
            console.log("error", error);
        }
    }).on('receipt', function(receipt){
        ListContract_address = receipt.contractAddress;
    });

    // Deploy ItemEntity contract
    const ItemEntity_name = "test item entity";
    const ItemEntity_assetAddress = "0x0000000000000000000000000000000000009999";

    await new helpers.web3.eth.Contract(ItemEntity.abi, "0x0000000000000000000000000000000000000000").deploy({
        data: ItemEntity.bytecode,
        arguments: [ItemEntity_name, ItemEntity_assetAddress],
    }).send({
        from: fromAccount,
        gas: 1500000,
    }, function(error, transactionHash){
        if( error ) {
            console.log("error", error);
        } else {
            // console.log("transactionHash", transactionHash );
        }
    }).on('receipt', function(receipt){
        ItemEntity_address = receipt.contractAddress;
    });

    // consume addresses
    ItemEntityContractInstance = await new helpers.web3.eth.Contract(ItemEntity.abi, ItemEntity_address);
    ListContractInstance =       await new helpers.web3.eth.Contract(ListContract.abi, ListContract_address);
    ZoomContractInstance =       await new helpers.web3.eth.Contract(Zoom.abi, ZoomContract_address);

    globals.ItemEntityContractInstance = ItemEntityContractInstance;
    globals.ListContractInstance = ListContractInstance;
    globals.ZoomContractInstance = ZoomContractInstance;

    globals.abis = {};
    globals.abis.ItemEntity = ItemEntity.abi;
    globals.abis.ListContract = ListContract.abi;
    globals.abis.Zoom = Zoom.abi;

    utils.toLog(
        ' ----------------------------------------------------------------\n'+
        '  Step 1 - Instantiate Zoom and create TestData Contracts \n'+
        '  ----------------------------------------------------------------'
    );
    utils.toLog( ' ListContract at: ' + ListContract_address + '\n' );
    const itemNumStart = await ListContractInstance.methods.itemNum().call();
    utils.toLog( ' ListContract item count: ' + utils.colors.orange + itemNumStart + utils.colors.none + '.' );

    utils.toLog( ' Create dummy records: ' );
    
    // @TODO: convert to asynchronous calls
    for(let i = 1; i <= TestDummyRecords; i++) {
        await ListContractInstance.methods.addDummyRecord().send({
            from: fromAccount,
            gas: 6700000,
        });
        const item = await ListContractInstance.methods.items(i).call();
        ItemAddresses.push( item.itemAddress );
        utils.toLog( '   - ' + i + ' at: ' + item.itemAddress );
    }

    // add linked records ( for type 1 )
    const itemNum = await ListContractInstance.methods.itemNum().call();
    utils.toLog( ' ListContract item count: ' + utils.colors.orange + itemNum + utils.colors.none + '.' );
    utils.toLog( '' );
    
}
