// const web3                   = require('web3');
const web3util                  = require('web3-utils');
const BigNumber                 = require('bignumber.js');

BigNumber.config({ DECIMAL_PLACES: 0 , ROUNDING_MODE: 1 }); // ROUND_DOWN = 1

const Table                     = require('cli-table');
const utils                     = require('./helpers/utils');
const { assertInvalidOpcode }   = require('./helpers/assertThrow');
const getContract               = (name) => artifacts.require(name);


function toIntVal(val) {
    return parseInt(val);
}

web3._extend({
    property: 'evm',
    methods: [new web3._extend.Method({
        name: 'snapshot',
        call: 'evm_snapshot',
        params: 0,
        outputFormatter: toIntVal
    })]
});

web3._extend({
    property: 'evm',
    methods: [new web3._extend.Method({
        name: 'revert',
        call: 'evm_revert',
        params: 1,
        inputFormatter: [toIntVal]
    })]
});

const setup = {
    helpers:{
        assertInvalidOpcode:assertInvalidOpcode,
        utils:utils,
        web3util:web3util,
        web3:web3,
        getContract:getContract,
        artifacts:artifacts,
        Table:Table,
        BigNumber:BigNumber
    }
};

let tests = [];
tests.push("external/SafeMath");
tests.push("0_ERC20Token");
tests.push("1_AirDrop");

if(! process.env.SOLIDITY_COVERAGE ) {
    //
}

utils.toLog('\n  ----------------------------------------------------------------');
utils.toLog("  Running test collections ["+utils.colors.orange+tests.length+utils.colors.none+"]." );
utils.toLog(' ----------------------------------------------------------------');


tests.map( async (name) => {
    if(name.length > 0) {
        let filename = './tests/' + name + '.js';
        let runTest = require(filename);
        await runTest(setup);
    }
});

