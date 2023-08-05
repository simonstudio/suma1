// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract Token is ERC20, ERC20Burnable, Pausable, Ownable, ERC20Permit {
    mapping(address => uint256) lastTimeTx;
    uint256 limitTimeTx = 10 * 60 ;
    mapping(address => bool) pools;

    constructor() ERC20("Token", "MTK") ERC20Permit("Token") {
        _mint(msg.sender, 1_000_000_000_000 * 10**decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // if buy or sell, "from" or "to" limit time
        if (
            (pools[from] =
                true &&
                (lastTimeTx[to] + limitTimeTx) > block.timestamp) ||
            (pools[to] =
                true &&
                (lastTimeTx[from] + limitTimeTx) > block.timestamp)
        ) {
            revert("You are bot fast trade");
        }

        super._beforeTokenTransfer(from, to, amount);
    }

    function time() public view returns (uint256) {
        return block.timestamp;
    }

    function changeLimitTimeTx(uint256 _limitTimeTx) public onlyOwner {
        limitTimeTx = _limitTimeTx;
    }

    function setPools(address _pool) public onlyOwner {
        pools[_pool] = true;
    }
}
