pragma solidity ^0.4.17;

contract SolidityAccountUtils {
    function transferTo(address _to) public payable {
        _to.transfer(msg.value);
    }

    function getBalance(address _address) public view returns (uint256) {
        return _address.balance;
    }
}