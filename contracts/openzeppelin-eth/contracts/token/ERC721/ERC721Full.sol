pragma solidity ^0.5.2;

import "zos-lib/contracts/Initializable.sol";
import "./ERC721.sol";
import "./ERC721Enumerable.sol";
import "./ERC721Metadata.sol";

/**
 * @title Full ERC721 Token
 * This implementation includes all the required and some optional functionality of the ERC721 standard
 * Moreover, it includes approve all functionality using operator terminology
 * @dev see https://eips.ethereum.org/EIPS/eip-721
 */
contract ERC721Full is Initializable, ERC721, ERC721Enumerable, ERC721Metadata {
    uint256[50] private ______gap;
}
