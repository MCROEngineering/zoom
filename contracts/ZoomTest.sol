pragma solidity ^0.4.25;

/*

 * @package     ZoomDev
 * @author      Micky Socaci <micky@nowlive.ro>

Generic ABI Batch caller 

*/

// import "./ListContract.sol";

contract Test {
    function test() public pure returns ( bytes32 ) {
        return 0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20;
    }
    
    function test2() public pure returns ( bytes32 ) {
        return 0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f30;
    }
    
    function test3() public pure returns ( bytes memory ) {
        bytes memory bs = hex'0013188ec3560119ee5bca02223fcbc9003072cf600030f7589000385fbe24004073002e0051fc6f590057945e3e006ad49245007278d62300919baade0091fa055500961ffc6800b37edb6600b8109e1a00e8be2e8e00efdee94f00fa9d235233';
        return bs; 
    }
}

contract AZoomTest {
    
    event processHeader( uint16 version, uint16 call_num, uint32 result_length );
    
    constructor () public {

    }

    function combine(bytes memory inputData) public view returns (bytes memory, bytes memory, address) {

        bytes memory scratch = new bytes(64);
        bytes memory internalAddresses; 
        
        bytes memory resultAddresses; 
        bytes memory OutputBuffer;
        address adr;

        assembly {
            
            // [0-1] version
            // [2-3] number of calls
            // [4-5] expected result length

            // add 32 since input is treated as variable and has 2 32 byte words.
            let ptr := add( inputData, 32 )

            // get number of calls -> mul first byte by 256 and add the rest from byte 2
            let callnum := add(
                mul( byte( 0, mload( add( ptr, 2 ) ) ), 256),
                byte( 0, mload( add( ptr, 3 ) ) )
            )
            
            // get number of 32 byte words expected for result
            let result_length := add(
                mul( byte( 0, mload( add( ptr, 4 ) ) ), 256),
                byte( 0, mload( add( ptr, 5 ) ) )
            )
            
            // move free memory pointer
            mstore(0x40, msize()) 
            
            // resize resultAddresses
            resultAddresses := mload(0x40)

            // store array length
            mstore(
                resultAddresses,
                // 32 bytes for each result.. as we want to be able to just mstore / mload
                mul( callnum, 32 )
            ) 
    
            // allocate free space for resultAddresses starting in data address space
            for { let n := 0 } lt(n, callnum) { n := add(n, 1) } {
                mstore( 
                    add ( 
                        add (resultAddresses, 32), // offset by 32 ( len )
                        mul( n, 32) 
                    ),
                    0
                )
            }

            // move free memory pointer
            mstore(0x40, msize()) 
            
            
            // move OutputBuffer to new space
            OutputBuffer := mload(0x40)
            
            // set result length to OutputBuffer
            mstore(OutputBuffer, mul(result_length, 32) ) 

            // allocate free space for OutputBuffer starting in data address space
            for { let n := 0 } lt(n, result_length) { n := add(n, 1) } {
                mstore( add ( add (OutputBuffer, 32), mul( n, 32) ) , 0 )
            }

            // move free memory pointer
            mstore(0x40, msize()) 
            
            // adr := OutputBuffer

            // Output Buffer remaining bytes
            // let remaining := mload(OutputBuffer)
            // let used := 0

            // move free memory pointer
            mstore(0x40, msize()) 
            
            // pointing to output data space
            let currentOutputPointer := add(OutputBuffer, 32)
            
            // shift pointer to call start
            ptr := add( ptr, 6 )
            
            // process calls 
            for { let callNumber := 0 } lt(callNumber, callnum) { callNumber := add(callNumber, 1) } {

                // get data length in bytes [1-2]
                let dataLength := add(
                    mul( byte( 0, mload( add( ptr, 1 ) ) ), 256),
                    byte( 0, mload( add( ptr, 2 ) ) )
                )

                // move free memory pointer
                mstore(0x40, add(msize(), 32)) 

                // clean up scratch area so we can store a new address
                mstore( add(scratch, 32) , 0x0000000000000000000000000000000000000000000000000000000000000000 )
                
                // call type cases
                switch byte( 0, mload( ptr ) )
                case 2 {
                    
                    /*
                    // read result_id where the "to address" is expected ( bytes[3-4] )
                    let result_id := add(
                        mul( byte( 0, mload( add( ptr, 3 ) ) ), 256),
                        byte( 0, mload( add( ptr, 4 ) ) )
                    )
                    
                    // read offset for the result ( bytes[5-6] )
                    let offset := add(
                        mul( byte( 0, mload( add( ptr, 5 ) ) ), 256),
                        byte( 0, mload( add( ptr, 6 ) ) )
                    )
                    
                    // type 2 contains address in OutputBuffer at 32 + offset
                    
                    // read 20 bytes from OutputBuffer + 32 + n *  + 
                    
                    // need array to store result address so we can read by offset
                    let ResultMemoryAddressInOutputBuffer := mload( 
                        add ( 
                            // bypass 32 bytes
                            add( resultAddresses, 32 ),
                            // multiply result position by 32
                            mul(result_id, 32 )
                        )
                    )
                    
                    
                    //for { let n := 0 } lt(n, result_length) { n := add(n, 1) } {
                    //    mstore( add ( add (OutputBuffer, 32), mul( n, 32) ) , 0 )
                    //}
                    */
                    

                    // shift pointer by 8 bytes, to call data space
                    ptr := add( ptr, 20 )
                }
                default {
                    // type 1 contains address in the next 20 bytes bytes [8-28]

                    // shift pointer by 8 bytes, to address space
                    ptr := add( ptr, 8 )
                    
                    // load 32 bytes from inputData even thou we only need 20, so we only load them once

                    // write data
                    for { let an := 0 } lt(an, 20) { an := add(an, 1) } {
                        
                        // store 8 bits
                        mstore8( 
                            // point to "toAddress" variable space + an
                            add(
                                add(scratch, 32), // value area so we can debug better 
                                // shift value by 12 bytes
                                add(an, 12) 
                                //an
                            ), 
                            byte( an, mload( ptr ) )
                        )

                    }
                    
                    // shift pointer by 20 bytes, to call data space
                    ptr := add( ptr, 20 )

                }
                
                let toAddress := mload( add(scratch, 32) )

                // move free memory pointer
                mstore(0x40, msize()) 
                
                // do the call!
                {
                    adr := ptr
                    
                    let success := staticcall(      
                                        500000,     
                                        toAddress ,     // To addr
                                        ptr,            // Inputs are stored at current ptr location
                                        dataLength,     // input length
                                        0,          
                                        0)          
        
                    // copy result byte size from return value ( ignore first 32 bytes ) ( next 32 bytes )
                    returndatacopy( 
                        currentOutputPointer,
                        0, 
                        returndatasize()    // return size
                    )
                    
                    // used := add(used, returndatasize())
                    // used := add(used, 16)
                    
                    // save result address so we can use it in type 2
                    mstore( 
                        add(
                            add( resultAddresses, 32),
                            mul( callNumber, 32)
                        ),
                        sub(currentOutputPointer, OutputBuffer)
                    )
                    
                    // move output pointer by return size
                    currentOutputPointer := add( currentOutputPointer, returndatasize())

                    // substract returned size from remaining
                    // remaining := sub(remaining, returndatasize())
                    
                    // shift pointer by data length.. so we're at next call
                    ptr := add( ptr, dataLength )

                    
                    // mstore( OutputBuffer, 96 )
                    adr := returndatasize()
                }
                
            }
        }
        
        return ( OutputBuffer, resultAddresses, adr );
    }
}

