module.exports = async function thisStep(setup) {

    const helpers                       = setup.helpers;
    const globals                       = setup.globals;
    const utils                         = helpers.utils;
    const web3util                      = helpers.web3util;

    utils.toLog(
        ' ----------------------------------------------------------------\n'+
        '  Step 4 - Results \n'+
        '  ----------------------------------------------------------------\n'
    );

    const totalCalls = 0;
    const totalProcessTime = 0;

    // globals.callCount
    // globals.ZoomCallTime = result.time;
    // globals.ZoomTotalGasUsage = result.gas;



    utils.toLog( ' Total Call count :     ' + totalCalls + ' ' );
    utils.toLog( ' Total Data Load time : ' + totalProcessTime + ' seconds ' );
    utils.toLog( '' );
    
    // utils.toLog( globals.multiWeb3Provider.cache );
    
}
