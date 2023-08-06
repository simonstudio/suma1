// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ClaimToken is Pausable, Ownable {
    address token;
    bool isIco;
    uint256 priceUSD;

    uint256 percentCommissionRef ;
    address USDAddress;

    constructor(address _token, address _USDAddress, uint _amountToken) {
        token = _token;
        USDAddress = _USDAddress;
        priceUSD = _amountToken;
        isIco = false;
        percentCommissionRef = 10;
    }

    function setToken(address _token) public onlyOwner {
        token = _token;
    }

    function setIco(bool state) public onlyOwner {
        isIco = state;
    }

    function setpriceUSD(uint256 _amountToken) public onlyOwner {
        priceUSD = _amountToken;
    }

    function widthdraw(address to, uint256 amount) public onlyOwner {
        ERC20(token).transfer(to, amount);
    }

    modifier onICO() {
        require(isIco == true, "ICO is not started");
        _;
    }

    function claim(uint256 amountUSD, address ref) public onICO {
        ERC20 usd = ERC20(USDAddress);
        usd.transferFrom(msg.sender, address(this), amountUSD);
        uint amountClaim = amountUSD * priceUSD;
if (ref ) {
    
}

        ERC20 _token = ERC20(token);
        _token.transfer(msg.sender, amountClaim);
    }
}
