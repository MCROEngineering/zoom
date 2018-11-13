async function thisStep(setup) {

    // how many records are we testing with
    const TestDummyRecords = 10;

    const OfficialWeb3                  = require('web3');
    const HttpProvider                  = require("../web3/HttpProviderCache");
    const WsProvider                    = require("../web3/WsProviderCache");

    const helpers                       = setup.helpers;
    const globals                       = setup.globals;

    const utils                         = require('../helpers/utils');
    const web3util                      = require('web3-utils');

    utils.toLog(
        ' ----------------------------------------------------------------\n'+
        '  Step 4 - Results \n'+
        '  ----------------------------------------------------------------\n'
    );

    const totalCalls = 0;
    const totalProcessTime = 0;

    utils.toLog( ' Total Call count :     ' + totalCalls + ' ' );
    utils.toLog( ' Total Data Load time : ' + totalProcessTime + ' seconds ' );
    utils.toLog( '' );
      
    utils.toLog( globals.testWeb3Provider.cache );
    
};

module.exports = thisStep;
