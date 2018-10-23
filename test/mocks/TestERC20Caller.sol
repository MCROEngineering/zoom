/*

 * @name        Test ERC20 Caller Contract
 * @package     BlockBitsIO
 * @author      Micky Socaci <micky@nowlive.ro>

*/
pragma solidity ^0.4.17;

import "../../contracts/Token.sol";

contract TestERC20Caller {

    function callTestTransfer(address _tokenContract) public returns (bool) {
        return Token(_tokenContract).transferFrom(0, 0, 10);
    }

}
