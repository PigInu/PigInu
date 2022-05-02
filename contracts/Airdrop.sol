// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract Airdrop is Ownable, ReentrancyGuard {
  uint public totalClaimed;
  uint public amountToClaim;
  uint public claimCount;
  uint public timeOutBlock;
  uint public startBlock;
  address burnAddress;
  uint public minBaseCoinBalance;
  mapping(address => bool) public addressReceived;
  IERC20 public token;
  event eventClaimed(address sender, uint amount);
  event eventBurnRemainingTokens(uint amount);
  event eventSetAmountToClaim(uint amount);
  event eventSetTokenAddress(address amount);

  constructor(address _tokenAddress, address _burnAddress, uint _amountToClaim, uint _minBaseCoinBalance) {
    token = IERC20(_tokenAddress);
    burnAddress = _burnAddress;
    amountToClaim = _amountToClaim;
    minBaseCoinBalance = _minBaseCoinBalance;
  }

  function claim() public nonReentrant {
    require(startBlock >= block.number, 'claim: Airdrop has not started yet');
    require(timeOutBlock > block.number, 'claim: Airdrop has ended already');
    require(!addressReceived[msg.sender], 'claim: Your address have already claimed your tokens');
    require(msg.sender.balance >= minBaseCoinBalance, 'claim: Your wallet address does not have enough base coin');
    require(token.transfer(msg.sender, amountToClaim));
    addressReceived[msg.sender] = true;
    claimCount++;
    totalClaimed += amountToClaim;
    emit eventClaimed(msg.sender, amountToClaim);
  }

  function start(uint _delayBlocks, uint _timeBlocks) public nonReentrant onlyOwner {
    require(startBlock == 0, 'start: Airdrop has already started');
    timeOutBlock = block.number + _delayBlocks + _timeBlocks;
  }

  function burnRemainingTokens() public {
    // to be fair anyone can burn remaining tokens when airdrop is over
    require(startBlock != 0, 'burnRemainingTokens: Airdrop has not started yet');
    require(timeOutBlock < block.number, 'burnRemainingTokens: Airdrop has not ended yet');
    uint remaining = getRemainingTokens();
    require(token.transfer(burnAddress, remaining));
    emit eventBurnRemainingTokens(remaining);
  }

  function getRemainingTokens() public view returns (uint) {
    return token.balanceOf(address(this));
  }

  function setTokenAddress(address _tokenAddress) public onlyOwner {
    token = IERC20(_tokenAddress);
    emit eventSetTokenAddress(_tokenAddress);
  }

  function setAmountToClaim(uint _amount) public onlyOwner {
    amountToClaim = _amount;
    emit eventSetAmountToClaim(_amount);
  }
}
