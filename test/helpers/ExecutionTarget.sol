pragma solidity ^0.4.17;

contract ExecutionTarget {
    uint public counter;

    function execute() public {
        counter += 1;
        Executed(counter);
    }

    function setCounter(uint x) public {
        counter = x;
    }

    event Executed(uint x);
}
