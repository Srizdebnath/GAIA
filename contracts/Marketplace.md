// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC721/IERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/token/ERC721/IERC721Receiver.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/utils/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/access/Ownable.sol";


contract Marketplace is IERC721Receiver, ReentrancyGuard, Ownable {
    struct Listing {
        uint256 listingId;
        address nftAddress;
        uint256 tokenId;
        address payable seller;
        uint256 price; 
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


0x4a321e3190831a1639a5130ed5fd66155747b0c3