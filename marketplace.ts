
/**
 * NOTE: This is a placeholder address. You must deploy the Marketplace contract
 * (source code included below) and replace this address with your deployed
 * contract address on the Celo Sepolia Testnet.
 */
export const marketplaceContractAddress: `0x${string}` = '0x1234567890123456789012345678901234567890';

/**
 * NOTE: This is a placeholder address. You should replace this with a secure
 * address that you control to receive platform fees.
 */
export const GAIA_TREASURY_ADDRESS: `0x${string}` = '0x0987654321098765432109876543210987654321';

export const cUSDContractAddress: `0x${string}` = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

export const cUSDContractAbi = [
  {"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},
  {"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},
];

export const marketplaceContractAbi = [
  {"inputs":[{"internalType":"address","name":"_cUSDAddress","type":"address"},{"internalType":"address","name":"_initialTreasury","type":"address"},{"internalType":"uint256","name":"_initialFee","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"listingId","type":"uint256"},{"indexed":true,"internalType":"address","name":"nftAddress","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"seller","type":"address"}],"name":"ItemCancelled","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"listingId","type":"uint256"},{"indexed":true,"internalType":"address","name":"nftAddress","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"seller","type":"address"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"}],"name":"ItemListed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"listingId","type":"uint256"},{"indexed":true,"internalType":"address","name":"nftAddress","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"seller","type":"address"},{"indexed":false,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"}],"name":"ItemSold","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newFee","type":"uint256"}],"name":"PlatformFeeUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newTreasury","type":"address"}],"name":"TreasuryUpdated","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"_listingId","type":"uint256"}],"name":"buyItem","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_listingId","type":"uint256"}],"name":"cancelListing","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"cUSD","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getListingCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_nftAddress","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_price","type":"uint256"}],"name":"listItem","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"listings","outputs":[{"internalType":"uint256","name":"listingId","type":"uint256"},{"internalType":"address","name":"nftAddress","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address payable","name":"seller","type":"address"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC721Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"pure","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"platformFeeBasisPoints","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"treasuryAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_newFeeBasisPoints","type":"uint256"}],"name":"updatePlatformFee","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_newTreasury","type":"address"}],"name":"updateTreasury","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

/**
 * Marketplace.sol
 *
 * This is the Solidity source code for the marketplace smart contract.
 * You can deploy this contract using tools like Remix, Hardhat, or Foundry.
 * After deployment, update the `marketplaceContractAddress` and `GAIA_TREASURY_ADDRESS`
 * constants at the top of this file.
 *
 * Constructor arguments for deployment:
 * 1. cUSD address: 0x765DE816845861e75A25fCA122bb6898B8B1282a (on Celo Sepolia)
 * 2. Initial Treasury Address: Your fee-collecting wallet address.
 * 3. Initial Fee (basis points): 250 (for 2.5%)
 */
export const marketplaceSolidityCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC721/IERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC721/IERC721Receiver.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/access/Ownable.sol";


contract Marketplace is IERC721Receiver, ReentrancyGuard, Ownable {
    struct Listing {
        uint256 listingId;
        address nftAddress;
        uint256 tokenId;
        address payable seller;
        uint256 price; // in cUSD
        bool active;
    }

    IERC20 public immutable cUSD;
    
    uint256 private _listingCounter;
    mapping(uint256 => Listing) public listings;

    uint256 public platformFeeBasisPoints; // e.g., 250 for 2.5%
    address public treasuryAddress;

    event ItemListed(
        uint256 listingId,
        address indexed nftAddress,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event ItemSold(
        uint256 listingId,
        address indexed nftAddress,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );

    event ItemCancelled(
        uint256 listingId,
        address indexed nftAddress,
        uint256 indexed tokenId,
        address seller
    );
    
    event PlatformFeeUpdated(uint256 newFee);
    event TreasuryUpdated(address newTreasury);

    constructor(address _cUSDAddress, address _initialTreasury, uint256 _initialFee) Ownable(msg.sender) {
        cUSD = IERC20(_cUSDAddress);
        treasuryAddress = _initialTreasury;
        platformFeeBasisPoints = _initialFee;
    }

    function listItem(address _nftAddress, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Marketplace: Price must be greater than zero");
        IERC721 nft = IERC721(_nftAddress);
        require(nft.ownerOf(_tokenId) == msg.sender, "Marketplace: You are not the owner of this NFT");

        // Transfer NFT to this contract for escrow
        nft.safeTransferFrom(msg.sender, address(this), _tokenId);
        
        uint256 listingId = _listingCounter;
        listings[listingId] = Listing({
            listingId: listingId,
            nftAddress: _nftAddress,
            tokenId: _tokenId,
            seller: payable(msg.sender),
            price: _price,
            active: true
        });

        _listingCounter++;
        
        emit ItemListed(listingId, _nftAddress, _tokenId, msg.sender, _price);
    }
    
    function buyItem(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Marketplace: Listing is not active");
        require(listing.seller != msg.sender, "Marketplace: You cannot buy your own item");

        uint256 price = listing.price;
        uint256 platformFee = (price * platformFeeBasisPoints) / 10000;
        uint256 sellerProceeds = price - platformFee;
        
        // Transfer cUSD from buyer to this contract
        require(cUSD.transferFrom(msg.sender, address(this), price), "Marketplace: cUSD transfer failed");
        
        // Pay platform fee
        if(platformFee > 0) {
            require(cUSD.transfer(treasuryAddress, platformFee), "Marketplace: Fee transfer failed");
        }

        // Pay seller
        require(cUSD.transfer(listing.seller, sellerProceeds), "Marketplace: Seller payment failed");
        
        listing.active = false;

        // Transfer NFT to buyer
        IERC721(listing.nftAddress).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        
        emit ItemSold(_listingId, listing.nftAddress, listing.tokenId, listing.seller, msg.sender, price);
    }

    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Marketplace: Listing is not active");
        require(listing.seller == msg.sender, "Marketplace: You are not the seller");
        
        listing.active = false;

        // Return NFT to seller
        IERC721(listing.nftAddress).safeTransferFrom(address(this), msg.sender, listing.tokenId);
        
        emit ItemCancelled(_listingId, listing.nftAddress, listing.tokenId, msg.sender);
    }

    function getListingCount() public view returns (uint256) {
        return _listingCounter;
    }
    
    function updatePlatformFee(uint256 _newFeeBasisPoints) public onlyOwner {
        require(_newFeeBasisPoints <= 500, "Marketplace: Fee cannot exceed 5%"); // Cap fee at 5%
        platformFeeBasisPoints = _newFeeBasisPoints;
        emit PlatformFeeUpdated(_newFeeBasisPoints);
    }

    function updateTreasury(address _newTreasury) public onlyOwner {
        require(_newTreasury != address(0), "Marketplace: Zero address");
        treasuryAddress = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
`;
