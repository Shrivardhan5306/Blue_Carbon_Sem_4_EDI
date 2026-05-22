// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CarbonMarketplace is ReentrancyGuard {
    IERC20 public carbonToken;

    struct Listing {
        uint256 id;
        address seller;
        uint256 amount;        // Full amount scaled (18 decimals)
        uint256 pricePerToken; // Price in Wei for 1 full token (1e18)
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;

    event ListingCreated(uint256 indexed id, address indexed seller, uint256 amount, uint256 pricePerToken);
    event ListingBought(uint256 indexed id, address indexed buyer, uint256 amount);
    event ListingCanceled(uint256 indexed id, address indexed seller);

    constructor(address _carbonTokenAddress) {
        carbonToken = IERC20(_carbonTokenAddress);
    }

    // List tokens for sale
    function listTokens(uint256 amount, uint256 pricePerToken) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(pricePerToken > 0, "Price must be greater than zero");

        uint256 scaledAmount = amount * 10**18;
        
        // Transfer tokens from seller to marketplace (requires approval beforehand)
        require(carbonToken.transferFrom(msg.sender, address(this), scaledAmount), "Token transfer failed");

        listings[nextListingId] = Listing({
            id: nextListingId,
            seller: msg.sender,
            amount: amount,
            pricePerToken: pricePerToken,
            active: true
        });

        emit ListingCreated(nextListingId, msg.sender, amount, pricePerToken);
        nextListingId++;
    }

    // Buy listed tokens
    function buyTokens(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        
        uint256 totalCost = listing.amount * listing.pricePerToken;
        require(msg.value >= totalCost, "Insufficient funds");

        listing.active = false;
        uint256 scaledAmount = listing.amount * 10**18;

        // Send ETH to seller
        (bool sent, ) = payable(listing.seller).call{value: totalCost}("");
        require(sent, "Failed to send ETH to seller");

        // Refund excess ETH back to buyer
        if (msg.value > totalCost) {
            (bool refundSent, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundSent, "Failed to refund excess ETH");
        }

        // Send tokens to buyer
        require(carbonToken.transfer(msg.sender, scaledAmount), "Token transfer failed");

        emit ListingBought(listingId, msg.sender, listing.amount);
    }

    // Cancel a listing
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.seller == msg.sender, "You are not the seller");

        listing.active = false;
        uint256 scaledAmount = listing.amount * 10**18;

        // Return tokens back to seller
        require(carbonToken.transfer(msg.sender, scaledAmount), "Token return failed");

        emit ListingCanceled(listingId, msg.sender);
    }

    // Get all active listings
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < nextListingId; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }

        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < nextListingId; i++) {
            if (listings[i].active) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        return activeListings;
    }
}
