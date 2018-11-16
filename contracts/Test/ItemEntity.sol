/*

 * source       https://github.com/MCROEngineering/zoom/
 * @name        Item Contract
 * @package     ZoomDev
 * @author      Micky Socaci <micky@mcro.tech>
 * @license     MIT
 
*/

pragma solidity 0.4.25;


contract ItemEntity {

    string private name;
    address private asset;

    constructor(string _name, address _addr) public {
        name = _name;
        asset = _addr;
    }

    function getName() public view returns (string) {
        return name;
    }

    function getAsset() public view returns (address) {
        return asset;
    }

    function getUint8() public pure returns (uint8) {
        return 2**8-1;
    }

    function getUint16() public pure returns (uint16) {
        return 2**16-1;
    }

    function getUint32() public pure returns (uint32) {
        return 2**32-1;
    }
    
    function getUint64() public pure returns (uint64) {
        return 2**64-1;
    }
    
    function getUint128() public pure returns (uint128) {
        return 2**128-1;
    }

    function getUint256() public pure returns (uint256) {
        return 2**256-1;
    }

    function getString8() public pure returns (string) {
        return "12345678";
    }

    function getString16() public pure returns (string) {
        return "1234567812345678";
    }

    function getString32() public pure returns (string) {
        return "12345678123456781234567812345678";
    }

    function getString64() public pure returns (string) {
        return "1234567812345678123456781234567812345678123456781234567812345678";
    }

    function getAddress() public pure returns (address) {
        return 0x0000000000000000000000000000000000000001;
    }

    function getBoolTrue() public pure returns (bool) {
        return true;
    }

    function getBoolFalse() public pure returns (bool) {
        return false;
    }

    function getBytes8() public pure returns (bytes8) {
        return 0x0102030405060708;
    }

    function getBytes16() public pure returns (bytes16) {
        return 0x01020304050607080102030405060708;
    }

    function getBytes32() public pure returns (bytes32) {
        return 0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20;
    }

    function getBytes() public pure returns (bytes memory) {
        bytes memory outputBuffer = new bytes(1);
        assembly {

            let size := 64
            mstore( outputBuffer, size )
            
            for { let n := 0 } lt(n, div(size, 32) ) { n := add(n, 1) } {
                mstore( add ( add (outputBuffer, 32), mul( n, 32) ), 11 )
            }

            // move free memory pointer 
            mstore(0x40, msize()) 

        }
        return outputBuffer;
    }

    function multipleOne( uint8 numVar, bool boolVar, string memory stringVar, bytes8 bytesVar ) public pure returns ( string memory ) {
        numVar = 0;
        boolVar = false;
        bytesVar = "";
        return stringVar;
    }

    function multipleTwo( string memory one, string memory two, string memory three ) public pure returns ( string memory ) {
        two = "";
        three = "";
        return one;
    }
}