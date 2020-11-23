// contracts/CustomERC20.sol
pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-eth/contracts/drafts/ERC20Snapshot.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Mintable.sol";

contract CircuitsOfValue is Initializable, ERC20, ERC20Detailed, ERC20Burnable, ERC20Pausable, ERC20Snapshot, ERC20Mintable {

  bool private _pausableInitialized;

  function initialize( string memory name, string memory symbol, uint8 decimals, uint256 initialSupply, address initialHolder )
   public initializer {
    require(initialSupply > 0, "");
    ERC20Detailed.initialize(name, symbol, decimals);
    ERC20Mintable.initialize(msg.sender);
    _mint(initialHolder, initialSupply);
  }

  function initializePausable(address sender) public {
        require(!_pausableInitialized, "pausable has already been initialized");
        _pausableInitialized = true;
        _addPauser(sender);
    }
}