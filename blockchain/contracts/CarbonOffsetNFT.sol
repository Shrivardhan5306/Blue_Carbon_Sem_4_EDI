// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CarbonOffsetNFT is ERC721URIStorage, ReentrancyGuard {
    using Strings for uint256;

    IERC20 public carbonToken;
    uint256 public nextTokenId;

    // Mapping from token ID to amount of carbon retired
    mapping(uint256 => uint256) public retiredAmounts;

    event CarbonRetired(uint256 indexed tokenId, address indexed retiree, uint256 amount);

    constructor(address _carbonTokenAddress) ERC721("Carbon Offset Certificate", "CCT-NFT") {
        carbonToken = IERC20(_carbonTokenAddress);
    }

    function retireTokens(uint256 amount) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");

        uint256 scaledAmount = amount * 10**18;

        // Transfer tokens to THIS contract acting as a black hole
        require(carbonToken.transferFrom(msg.sender, address(this), scaledAmount), "Token transfer failed");

        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);

        retiredAmounts[tokenId] = amount;

        // Example metadata URI
        string memory baseURI = "https://bluecarbon-mrv.com/api/nft/metadata/";
        _setTokenURI(tokenId, string(abi.encodePacked(baseURI, tokenId.toString())));

        emit CarbonRetired(tokenId, msg.sender, amount);
        
        nextTokenId++;
        return tokenId;
    }

    function getRetiredAmount(uint256 tokenId) external view returns (uint256) {
        return retiredAmounts[tokenId];
    }
}
