let HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic = 'lunch release trick fluid omit about fatigue suffer dentist minute cube want';
// const addr = '0x4b70518d879a4e2da4ad9cf0189b32d8dc6b7a9b';
const developmentProvider = new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/");

module.exports = {
    synchronization_timeout: 3600000,
    networks: {
        rpc: {
            network_id: '*',
            host: 'localhost',
            port: 8545,
            gas: 6.1e6,
            gasPrice: 1000000000, // 1 gwei 
        },
        ropsten: {
            provider: function () {
                return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/");
            },
            network_id: '3',
            gasPrice: 1000000000, // 1 gwei 
        },
        rinkeby: {
            provider: function () {
                return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/");
            },
            network_id: '4',
            gasPrice: 1000000000, // 1 gwei 
        },
        test: {
            provider: function () {
                return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/");
            },
            network_id: '*',
        },
    },
    build: {},
};
