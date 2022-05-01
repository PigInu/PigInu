// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

abstract contract MultiWallet is Ownable {
    using SafeERC20 for IERC20;
    Wallet[] public wallets;
        
    struct Wallet {
        address addressWallet;
        uint sharePercent;
    }
    
    function send(address _addressToken, uint _amount) internal {
        IERC20 token = IERC20(_addressToken);
        require(token.balanceOf(msg.sender) >= _amount, 'send: Not enough tokens in sender wallet');
        for (uint i = 0; i < wallets.length; i++) token.safeTransfer(wallets[i].addressWallet, _amount * wallets[i].sharePercent / 10000);
    }

    function addWallet(address _addressWallet, uint _sharePercent) public onlyOwner {
        uint totalShare;
        for (uint i = 0; i < wallets.length; i++) totalShare += wallets[i].sharePercent;
        require(totalShare + _sharePercent <= 10000, 'addWallet: Share exceeds 100 percent');
        wallets.push(Wallet(_addressWallet, _sharePercent));
    }
}
