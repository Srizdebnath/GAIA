// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/access/Ownable.sol";

contract GAIAToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("GAIA Governance Token", "GAIA") Ownable(initialOwner) {
        _mint(initialOwner, 100000000 * 10**decimals()); // 100 Million tokens
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}


0xa7576f8544069ff7fcdf4179a97678f06e5c9f59