// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract Token is ERC20, ERC20Burnable, Pausable, Ownable, ERC20Permit {
    mapping(address => uint256) lastTimeTx;
    uint256 limitTimeTx = 10 * 60;
    mapping(address => bool) pools;
    bool isIDO = true;

    mapping(address => bool) private _isExcludedFromFees;
    event ExcludeFromFees(address indexed account, bool isExcluded);

    constructor() ERC20("Token", "MTK") ERC20Permit("Token") {
        _mint(msg.sender, 1_000_000_000_000 * 10 ** decimals());
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

    function excludeFromsFees(
        address[] memory accounts,
        bool excluded
    ) external onlyOwner {
        for (uint i = 0; i < accounts.length; i++) {
            _isExcludedFromFees[accounts[i]] = excluded;
            emit ExcludeFromFees(accounts[i], excluded);
        }
    }

    function isExcludedFromFees(address account) public view returns (bool) {
        return _isExcludedFromFees[account];
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

        if (isIDO == true) {
            require(
                (_isExcludedFromFees[from] == true && _isExcludedFromFees[to] == true),
                "You are bot fast trade"
            );
        }
        super._beforeTokenTransfer(from, to, amount);
    }

    function changeLimitTimeTx(uint256 _limitTimeTx) public onlyOwner {
        limitTimeTx = _limitTimeTx;
    }

    function setPools(address _pool) public onlyOwner {
        pools[_pool] = true;
        _isExcludedFromFees[_pool] = true;
    }

    function ido(bool state) public onlyOwner {
        isIDO = state;
    }
}
