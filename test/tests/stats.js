module.exports = async function thisStep(setup) {

    const helpers                       = setup.helpers;
    const globals                       = setup.globals;
    const utils                         = helpers.utils;
    const web3util                      = helpers.web3util;

    utils.toLog(
        ' ----------------------------------------------------------------\n'+
        '  Step 3 - Results \n'+
        '  ----------------------------------------------------------------\n'
    );

    const totalCalls = 0;
    const totalProcessTime = 0;

    let hasSoloResults = false;
    let hasMultiResults = false;
    let hasZoomResults = false;

    if(typeof globals.results.solo !== "undefined") {
        hasSoloResults = true;

        utils.toLog( '\n  Web3 Solo Synchronous request results: ' );
            
        utils.toLog( '    Total Call count :        ' + globals.results.solo.count + ' ' );
        utils.toLog( '    Total Process wait time : ' + globals.results.solo.time + ' seconds ' );
        utils.toLog( '    Total Gas Used :          ' + globals.results.solo.gas + ' ' );
        utils.toLog( '' );
    }

    if(typeof globals.results.multi !== "undefined") {
        hasMultiResults = true;

        utils.toLog( '\n  Web3 Multi Asynchronous request results: ' );
            
        utils.toLog( '    Total Call count :        ' + globals.results.multi.count + ' ' );
        utils.toLog( '    Total Process wait time : ' + globals.results.multi.time + ' seconds ' );
        utils.toLog( '    Total Gas Used :          ' + globals.results.multi.gas + ' ' );
        utils.toLog( '' );
    }

    if(typeof globals.results.multiws !== "undefined") {
        hasMultiResults = true;

        utils.toLog( '\n  Web3 Multi WebSocket Asynchronous request results: ' );
            
        utils.toLog( '    Total Call count :        ' + globals.results.multiws.count + ' ' );
        utils.toLog( '    Total Process wait time : ' + globals.results.multiws.time + ' seconds ' );
        utils.toLog( '    Total Gas Used :          ' + globals.results.multiws.gas + ' ' );
        utils.toLog( '' );
    }

    if(typeof globals.results.zoom !== "undefined") {
        hasZoomResults = true;

        utils.toLog( '\n  Web3 Zoom request results: ' );
            
        utils.toLog( '    Total Call count :        ' + globals.results.zoom.count + ' ' );
        utils.toLog( '    Total Process wait time : ' + globals.results.zoom.time + ' seconds ' );
        utils.toLog( '    Total Gas Used :          ' + globals.results.zoom.gas + ' ' );
        utils.toLog( '' );
    }


    utils.toLog( ' Statistics: Sync WebSocket vs Async WebSocket vs Async HTTP vs Zoom ' );

    const soloOneTime = ( globals.results.solo.time / globals.results.solo.count );
    const multiOneTime = ( globals.results.multi.time / globals.results.multi.count );
    const multiWsOneTime = ( globals.results.multiws.time / globals.results.multiws.count );
    const ZoomOneTime = ( globals.results.zoom.time / globals.results.multi.count );

    utils.toLog( '    1 Call Time - Sync WebSocket:    ' + soloOneTime + ' seconds' );
    utils.toLog( '    1 Call Time - Async WebSocket:   ' + multiWsOneTime + ' seconds' );
    utils.toLog( '    1 Call Time - Async HTTP:        ' + multiOneTime + ' seconds' );
    utils.toLog( '    1 Call Time - Zoom:              ' + ZoomOneTime + ' seconds' );
    
    utils.toLog( '' );

    const soloGas = ( globals.results.solo.gas / globals.results.solo.count );
    const multiGas = ( globals.results.multi.gas / globals.results.multi.count );
    const multiWsGas = ( globals.results.multiws.gas / globals.results.multiws.count );
    const zoomGas = ( globals.results.zoom.gas / globals.results.multi.count );
    
    utils.toLog( '    1 Call Gas - Sync WebSocket:     ' + soloGas + ' ' );
    utils.toLog( '    1 Call Gas - Async WebSocket:    ' + multiWsGas + ' ' );
    utils.toLog( '    1 Call Gas - Async HTTP:         ' + multiGas + ' ' );
    utils.toLog( '    1 Call Gas - Zoom:               ' + zoomGas + ' ' );

    utils.toLog( '' );
    utils.toLog( '    Zoom vs Async - Network reduction times (x):                 ' + ( globals.results.multi.count / globals.results.zoom.count ) + ' ' );
    utils.toLog( '    Zoom vs Async - Gas / Resource usage reduction times (x):    ' + ( multiGas / zoomGas ) + ' ' );
    utils.toLog( '    Zoom vs Async - Time usage reduction times (x):              ' + ( globals.results.multi.time / globals.results.zoom.time ) + ' ' );
    utils.toLog( '' );
    utils.toLog( '    Zoom vs Async WS - Network reduction times (x):              ' + ( globals.results.multi.count / globals.results.zoom.count ) + ' ' );
    utils.toLog( '    Zoom vs Async WS - Gas / Resource usage reduction times (x): ' + ( multiWsGas / zoomGas ) + ' ' );
    utils.toLog( '    Zoom vs Async WS - Time usage reduction times (x):           ' + ( globals.results.multiws.time / globals.results.zoom.time ) + ' ' );

    const ProviderHost = setup.globals.network_config_ws;

    utils.toLog( '' );
    utils.toLog( '  Tests performed on ' + utils.colors.green + ProviderHost + utils.colors.none + ' ');
    utils.toLog( '' );

    
    const TestResults = {
        host: setup.network,
        // run id
    }

}
