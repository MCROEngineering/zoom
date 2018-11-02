// const web3                      = require('web3');
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

web3.extend({
    property: 'evm',
    methods: [{
        name: 'snapshot',
        call: 'evm_snapshot',
        params: 0,
        outputFormatter: toIntVal
    }]
});

web3.extend({
    property: 'evm',
    methods: [{
        name: 'revert',
        call: 'evm_revert',
        params: 1,
        inputFormatter: [toIntVal]
    }]
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
        BigNumber:BigNumber,
    },
    network: process.argv[4]
};

const tests = [];
tests.push("zoom");

tests.map( async (name) => {
    if(name.length > 0) {
        const filename = './tests/' + name + '.js';
        try {
            const runTest = require(filename);
            const tests = await runTest(setup);
        } catch(e) {
            console.log("error:", e);
        }

    }
});


/*
Promise.all(tests).then(function(values) {
    console.log("promises all:", values);
});

*/