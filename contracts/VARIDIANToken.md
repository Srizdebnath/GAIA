// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/access/Ownable.sol";

contract varidianToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("varidian Governance Token", "varidian") Ownable(initialOwner) {
        _mint(initialOwner, 100000000 * 10**decimals()); // 100 Million tokens
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}


0x646e5c61ec28f03b800447db10a1d0bbfe655b30