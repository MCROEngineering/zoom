pragma solidity 0.4.25;

/*

 * @package     BlockBitsIO
 * @author      Micky Socaci <micky@nowlive.ro>

    Generic ABI Batch caller that returns a ( 32 byte * input[num] ) length  byte buffer 

    Deploy Cost: 961621 gas
    Call Transaction cost: 56546 gas 
    
    single transaction call: ~22000 gas
    example call reduction: 93%
    http requests: 1 instead of 19
    

// hex[num:2][method_sha3:4][return_type:1][method_sha3:4][return_type:2]
// CallData: 
// 0013188ec3560119ee5bca02223fcbc9003072cf600030f7589000385fbe24004073002e0051fc6f590057945e3e006a
// d49245007278d62300919baade0091fa055500961ffc6800b37edb6600b8109e1a00e8be2e8e00efdee94f00fa9d235200

188ec35601 => 000000000000000000000000000000000000000000000000000000005b8bc24f
19ee5bca02 => 000000000000000000000000766d1f049ba649f9a89ae417ba555599a6546b5a
223fcbc900 => 0000000000000000000000000000000000000000000000000000000000000000  // bool false
3072cf6000 => 0000000000000000000000000000000000000000000000000000000000000001
30f7589000 => 000000000000000000000000b4e8d821b5b43fca08f5986d9b52a8dc00565cc5
385fbe2400 => 0000000000000000000000005f03b7561e62efdab8b2fb740d83630d4d2710d7
4073002e00 => 0000000000000000000000000000000000000000000000000000000000000009
51fc6f5900 => 000000000000000000000000584af734a101538cad9b9522d1b9c87f1c08f9c4
57945e3e00 => 0000000000000000000000000000000000000000000000000000000000000000  // bool false
6ad4924500 => 000000000000000000000000b4007597da3402a1e2b69c8e1c6dd753d01a8035
7278d62300 => 0000000000000000000000000000000000000000000000000000000000000096
919baade00 => 0000000000000000000000005b2db92a43aa86fff2d9a3696a7ee264d03fc907
91fa055500 => 0000000000000000000000003dfa93d0d80c9985c9c78ce3620bd0803767a95c
961ffc6800 => 0000000000000000000000003dfa93d0d80c9985c9c78ce3620bd0803767a95c
b37edb6600 => 00000000000000000000000058534c480ef96b6478940f9bbf6748da8f2ec935
b8109e1a00 => 000000000000000000000000b435c8dd6edd82918606f0b2d73970683806b004
e8be2e8e00 => 0000000000000000000000007d88463cc6d0ba403d302204236898414db3251a
efdee94f00 => 0000000000000000000000003a0d088acfbd75fcf182a3b25d470492952dc704
fa9d235200 => 0000000000000000000000000000000000000000000000000000000000000000  // bool false

contract ApplicationEntity  {
    
    uint256 public  getTimestamp = 1535885903;
    address public  BountyManagerEntity = 0x766d1F049ba649f9A89ae417BA555599a6546b5A;
    bool public     _locked = false;
    bool public     _initialized = true;
    address public  MilestonesEntity = 0xb4e8D821b5b43fca08F5986D9B52A8DC00565CC5;
    address public  ListingContractEntity = 0x5f03B7561e62eFDAb8B2fB740D83630D4D2710D7;
    uint8 public    AssetCollectionNum = 9;
    address public  TokenManagerEntity = 0x584af734A101538cAd9b9522D1B9C87f1c08F9c4;
    bool public     anyAssetHasChanges = false;
    address public  FundingManagerEntity = 0xb4007597dA3402a1E2B69c8E1c6DD753D01a8035;
    uint8 public    CurrentEntityState = 150;
    address public  ProposalsEntity = 0x5b2Db92a43Aa86FfF2D9A3696a7Ee264D03Fc907;
    address public  getParentAddress = 0x3dFA93D0d80C9985c9c78cE3620bd0803767a95C;
    address public  GatewayInterfaceAddress = 0x3dFA93D0d80C9985c9c78cE3620bd0803767a95C;
    address public  FundingEntity = 0x58534C480ef96b6478940F9bBF6748DA8F2eC935;
    address public  MeetingsEntity = 0xb435c8Dd6eDd82918606F0B2d73970683806b004;
    address public  NewsContractEntity = 0x7D88463CC6D0Ba403D302204236898414db3251A;
    address public  deployerAddress = 0x3a0d088AcfBd75fcf182A3B25D470492952dc704;
    bool public hasRequiredStateChanges = false;

}
*/

contract ZoomTest {
    
    // ApplicationEntity public AE;
    
    constructor () public {
        // AE = new ApplicationEntity();
    }
    
    enum Types {
        NONE,
        UINT,
        ADDRESS,
        BYTES,
        BOOL
    }
    
    /*
    function testCombine() public view returns (bytes memory) {

        // hex[num:2][method_sha3:4][return_type:1][method_sha3:4][return_type:2]
        // bytes memory callData = hex'000b188ec3560119ee5bca02223fcbc9003072cf600030f7589000385fbe24004073002e0051fc6f590057945e3e006ad49245007278d62300919baade0091fa055500961ffc6800b37edb6600b8109e1a00e8be2e8e00efdee94f00fa9d235200';
        bytes memory callData = hex'0013188ec3560119ee5bca02223fcbc9003072cf600030f7589000385fbe24004073002e0051fc6f590057945e3e006ad49245007278d62300919baade0091fa055500961ffc6800b37edb6600b8109e1a00e8be2e8e00efdee94f00fa9d235200';
        return combineCalls( address(AE), callData );
    }
    */

    // function combine(address toAddr, bytes calldata inputData) external view returns (bytes memory, bytes memory, address) {
    function combineCalls(address toAddr, bytes memory inputData) public view returns (bytes memory) {

        uint16 size = 0;
        bytes memory OutputBuffer = new bytes(1);

        assembly {
            // store size from input into local var
            mstore8( add( size, 30 ), byte( 0, mload( add( inputData, 32) ) ) )
            mstore8( add( size, 31 ), byte( 1, mload( add( inputData, 32) ) ) )

            // compute expected data length
            size := mul( mload(size), 32)

             // store methods length into OutputBuffer
            mstore( OutputBuffer, size )
            
            // allocate free space for OutputBuffer starting in data address space
            for { let n := 0 } lt(n, div(size, 32) ) { n := add(n, 1) } {
                mstore( add ( add (OutputBuffer, 32), mul( n, 32) ) , 0 )
            }

            // move free memory pointer 
            mstore(0x40, msize()) 
            
            {
                // Find empty storage location using "free memory pointer"
                let callMem := mload(0x40)      
                mstore(callMem, 0x00)
                // move free mem pointer by 32
                mstore(0x40, add(callMem, 32) )
                
                // external calls loop
                for { let n := 0 } lt(n, div(size, 32) ) { n := add(n, 1) } {
                    
                    {
    
                        // prepare methodSig
                        let sigDataPointer := add( inputData, add( 33, add( mul( n, 5 ), 1 ) ) )
    
                        // 4 bytes right zero padded 
                        mstore8( add(callMem, 0), byte( 0, mload( add( sigDataPointer, 0) ) ) )
                        mstore8( add(callMem, 1), byte( 0, mload( add( sigDataPointer, 1) ) ) )
                        mstore8( add(callMem, 2), byte( 0, mload( add( sigDataPointer, 2) ) ) )
                        mstore8( add(callMem, 3), byte( 0, mload( add( sigDataPointer, 3) ) ) )
                        
                        let success := staticcall(      
                                            500000,     
                                            toAddr,     // To addr
                                            callMem,    // Inputs are stored at location callMem
                                            4,          // Inputs are 4 bytes long
                                            0,          
                                            0)          
            
                        let thisStorage := add( add(OutputBuffer, 32), mul( n, 32 ) ) 
    
                        // copy result byte size from return value ( ignore first 32 bytes ) ( next 32 bytes )
                        returndatacopy( thisStorage, 0, 32)

                    }
                }
            }
        }

        return OutputBuffer;
    }
}