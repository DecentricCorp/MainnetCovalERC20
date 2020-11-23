pragma solidity ^0.5.2;

import "zos-lib/contracts/Initializable.sol";
import "./ERC20.sol";
import "../../lifecycle/PausableV2.sol";

/**
 * @title Pausable token
 * @dev ERC20 modified with pausable transfers.
 */
contract ERC20PausableV2 is Initializable, ERC20, PausableV2 {
    function initialize() public initializer {
        PausableV2.initialize(msg.sender);
    }

    function isPauserV2(address sender) public view returns (bool) {
        return PausableV2.isPauserV2(sender);
    }

    function transfer(address to, uint256 value) public whenNotPaused returns (bool) {
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint256 value) public whenNotPaused returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function approve(address spender, uint256 value) public whenNotPaused returns (bool) {
        return super.approve(spender, value);
    }

    function increaseAllowance(address spender, uint addedValue) public whenNotPaused returns (bool success) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint subtractedValue) public whenNotPaused returns (bool success) {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    uint256[50] private ______gap;
}
