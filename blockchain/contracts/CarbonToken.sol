// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonToken is ERC20, Ownable {

    struct Project {
        string name;
        string location;
        address owner;
        uint256 totalCarbonIssued;
    }

    mapping(uint256 => Project) public projects;
    uint256 public projectCount;

    constructor()
        ERC20("Carbon Credit Token", "CCT")
        Ownable(msg.sender)
    {}

    function registerProject(
        string memory name,
        string memory location
    ) public {

        projectCount++;

        projects[projectCount] = Project({
            name: name,
            location: location,
            owner: msg.sender,
            totalCarbonIssued: 0
        });
    }

    function issueCarbonCredits(
        uint256 projectId,
        uint256 amount
    ) public onlyOwner {

        require(
            projectId > 0 && projectId <= projectCount,
            "Invalid project"
        );

        Project storage project = projects[projectId];

        project.totalCarbonIssued += amount;

        uint256 scaledAmount = amount * (10 ** decimals());

        _mint(project.owner, scaledAmount);
    }

    function retireCredits(uint256 amount) public {

        uint256 scaledAmount = amount * (10 ** decimals());

        _burn(msg.sender, scaledAmount);
    }

    // --- Marketplace ---

    struct Listing {
        uint256 id;
        address seller;
        uint256 amount;        // Amount in full tokens (unscaled)
        uint256 pricePerToken; // Price per full token in wei
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;

    event TokenListed(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 pricePerToken);
    event TokenPurchased(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event ListingCanceled(uint256 indexed listingId);

    function listTokens(uint256 amount, uint256 pricePerToken) public {
        require(amount > 0, "Amount must be greater than zero");
        require(pricePerToken > 0, "Price must be greater than zero");
        
        uint256 scaledAmount = amount * (10 ** decimals());
        require(balanceOf(msg.sender) >= scaledAmount, "Insufficient balance");

        // Escrow the tokens into the contract
        _transfer(msg.sender, address(this), scaledAmount);

        listingCount++;
        listings[listingCount] = Listing({
            id: listingCount,
            seller: msg.sender,
            amount: amount,
            pricePerToken: pricePerToken,
            active: true
        });

        emit TokenListed(listingCount, msg.sender, amount, pricePerToken);
    }

    function buyTokens(uint256 listingId) public payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");

        uint256 totalPrice = listing.amount * listing.pricePerToken;
        require(msg.value >= totalPrice, "Insufficient ETH sent");

        listing.active = false;

        // Transfer ETH to seller
        payable(listing.seller).transfer(totalPrice);

        // Transfer tokens to buyer
        uint256 scaledAmount = listing.amount * (10 ** decimals());
        _transfer(address(this), msg.sender, scaledAmount);

        // Refund excess ETH
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        emit TokenPurchased(listingId, msg.sender, listing.amount, totalPrice);
    }

    function cancelListing(uint256 listingId) public {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(msg.sender == listing.seller || msg.sender == owner(), "Not authorized");

        listing.active = false;

        // Return escrowed tokens to seller
        uint256 scaledAmount = listing.amount * (10 ** decimals());
        _transfer(address(this), listing.seller, scaledAmount);

        emit ListingCanceled(listingId);
    }

    function getActiveListings() public view returns (Listing[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }

        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].active) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        return activeListings;
    }
}