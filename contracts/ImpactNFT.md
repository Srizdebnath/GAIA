// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/access/Ownable.sol";

/**
 * @title ImpactNFT
 * @dev Final correct version. Inherits from ERC721URIStorage (which includes ERC721)
 * and Ownable. This simplified inheritance removes all compiler errors related to overrides.
 */
contract ImpactNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner)
        ERC721("GAIA Impact Token", "GAIA")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mints a new token and assigns it to `to`, setting its URI.
     * Can only be called by the contract owner.
     */
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}



0xaf927c19863a595fc8ffb439c0624af224bb2e59


