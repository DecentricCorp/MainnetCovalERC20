pragma solidity ^0.5.2;

import "zos-lib/contracts/Initializable.sol";

import "./ConditionalEscrow.sol";

/**
 * @title RefundEscrow
 * @dev Escrow that holds funds for a beneficiary, deposited from multiple
 * parties.
 * @dev Intended usage: See Escrow.sol. Same usage guidelines apply here.
 * @dev The primary account (that is, the contract that instantiates this
 * contract) may deposit, close the deposit period, and allow for either
 * withdrawal by the beneficiary, or refunds to the depositors. All interactions
 * with RefundEscrow will be made through the primary contract. See the
 * RefundableCrowdsale contract for an example of RefundEscrow’s use.
 */
contract RefundEscrow is Initializable, ConditionalEscrow {
    enum State { Active, Refunding, Closed }

    event RefundsClosed();
    event RefundsEnabled();

    State private _state;
    address payable private _beneficiary;

    /**
     * @dev Constructor.
     * @param beneficiary The beneficiary of the deposits.
     */
    function initialize(address payable beneficiary, address sender) public initializer {
        ConditionalEscrow.initialize(sender);

        require(beneficiary != address(0));
        _beneficiary = beneficiary;
        _state = State.Active;
    }

    /**
     * @return the current state of the escrow.
     */
    function state() public view returns (State) {
        return _state;
    }

    /**
     * @return the beneficiary of the escrow.
     */
    function beneficiary() public view returns (address) {
        return _beneficiary;
    }

    /**
     * @dev Stores funds that may later be refunded.
     * @param refundee The address funds will be sent to if a refund occurs.
     */
    function deposit(address refundee) public payable {
        require(_state == State.Active);
        super.deposit(refundee);
    }

    /**
     * @dev Allows for the beneficiary to withdraw their funds, rejecting
     * further deposits.
     */
    function close() public onlyPrimary {
        require(_state == State.Active);
        _state = State.Closed;
        emit RefundsClosed();
    }

    /**
     * @dev Allows for refunds to take place, rejecting further deposits.
     */
    function enableRefunds() public onlyPrimary {
        require(_state == State.Active);
        _state = State.Refunding;
        emit RefundsEnabled();
    }

    /**
     * @dev Withdraws the beneficiary's funds.
     */
    function beneficiaryWithdraw() public {
        require(_state == State.Closed);
        _beneficiary.transfer(address(this).balance);
    }

    /**
     * @dev Returns whether refundees can withdraw their deposits (be refunded). The overridden function receives a
     * 'payee' argument, but we ignore it here since the condition is global, not per-payee.
     */
    function withdrawalAllowed(address) public view returns (bool) {
        return _state == State.Refunding;
    }

    uint256[50] private ______gap;
}
