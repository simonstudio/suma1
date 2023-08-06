// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ClaimToken is Pausable, Ownable {
    address token;
    bool isIco;
    uint256 priceUSD;
    address USDAddress;

    constructor(address _token, address _USDAddress, uint _priceUSD) {
        token = _token;
        USDAddress = _USDAddress;
        priceUSD = _priceUSD;
        isIco = false;
    }

    function setToken(address _token) public onlyOwner {
        token = _token;
    }

    function setIco(bool state) public onlyOwner {
        isIco = state;
    }

    function setpriceUSD(uint256 _priceUSD) public onlyOwner {
        priceUSD = _priceUSD;
    }

    function widthdraw(address to, uint256 amount) public onlyOwner {
        ERC20(token).transfer(to, amount);
    }

    modifier onICO() {
        require(isIco == true, "ICO is not started");
        _;
    }

    function claim(uint256 amountIn) public {
        ERC20(USDAddress).transferFrom(msg.sender, address(this), amountIn);
    }
}
