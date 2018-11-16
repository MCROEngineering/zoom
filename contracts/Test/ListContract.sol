/*

 * source       https://github.com/MCROEngineering/zoom/
 * @name        List Contract
 * @package     ZoomDev
 * @author      Micky Socaci <micky@mcro.tech>
 * @license     MIT
 
*/

pragma solidity 0.4.25;


import "./ItemEntity.sol";

contract ListContract {

    address public managerAddress;

    struct Item {
        string name;
        address itemAddress;
        bool    status;
        uint256 index;
    }

    mapping ( uint256 => Item ) public items;
    uint256 public itemNum = 0;

    event EventNewChildItem(string _name, address _address, uint256 _index);

    constructor() public {
        managerAddress = msg.sender;
    }

    function addDummyRecord() external {
        uint256 addItems = 1;
        uint256 start = itemNum + 1;
        uint256 max = start + addItems;

        for (uint256 i = start; i < max; i++) {
            ItemEntity newItem = new ItemEntity(appendUintToString("Item Name ", i), addAddress(uint8(i)));
            addItem(newItem.getName(), address(newItem));
        }
    }

    function addItem(string _name, address _address) public {
        require(msg.sender == managerAddress, "Sender must be manager address");

        Item storage child = items[++itemNum];
        child.name = _name;
        child.itemAddress = _address;
        child.status = true;
        child.index = itemNum;

        emit EventNewChildItem(_name, _address, itemNum);
    }

    function getChildStatus( uint256 _childId ) public view returns (bool) {
        Item memory child = items[_childId];
        return child.status;
    }

    // update so that this checks the child status, and only delists IF funding has not started yet.
    function delistChild( uint256 _childId ) public {
        require(items[_childId].status == true && msg.sender == managerAddress, "Item needs to have status true");

        Item storage child = items[_childId];
        child.status = false;
    }

    function uintToString(uint v) internal pure returns (string) {
        uint maxlength = 100;
        bytes memory reversed = new bytes(maxlength);
        uint i = 0;
        uint w = v;
        while (w != 0) {
            uint remainder = w % 10;
            w = w / 10;
            reversed[i++] = byte(48 + remainder);
        }
        bytes memory s = new bytes(i);
        for (uint j = 0; j < i; j++) {
            s[j] = reversed[i - 1 - j];
        }
        return string(s);
    }

    function appendUintToString(string inStr, uint v) internal pure returns (string) {
        uint maxlength = 100;
        bytes memory reversed = new bytes(maxlength);
        uint i = 0;
        uint w = v;
        while (w != 0) {
            uint remainder = w % 10;
            w = w / 10;
            reversed[i++] = byte(48 + remainder);
        }
        bytes memory inStrb = bytes(inStr);
        bytes memory s = new bytes(inStrb.length + i);
        uint j;
        for (j = 0; j < inStrb.length; j++) {
            s[j] = inStrb[j];
        }
        for (j = 0; j < i; j++) {
            s[j + inStrb.length] = reversed[i - 1 - j];
        }
        return string(s);
    }

    function addAddress(uint8 i) internal pure returns (address) {

        bytes memory addrBytes = new bytes(20);
        assembly {
            for { let n := 0 } lt(n, 19 ) { n := add(n, 1) } {
                mstore8( add( add( addrBytes, 32), n), 0x00 )
            }
            mstore8( add( add( addrBytes, 32), 19), i )
        } 
        
        return bytesToAddr(addrBytes);
    }
    
    function bytesToAddr (bytes b) internal pure returns (address) {
        uint result = 0;
        for (uint i = b.length-1; i+1 > 0; i--) {
            uint256 c = uint256(b[i]);
            uint256 toInc = c * (16 ** ((b.length - i-1) * 2));
            result += toInc;
        }
        return address(result);
    }

}