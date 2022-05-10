// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract Pool is Ownable, ReentrancyGuard {
	using SafeMath for uint;
	using SafeERC20 for IERC20;
	mapping(uint => mapping(address => UserInfo)) public users; // Info of each user that stakes tokens.
	PoolInfo[] public pools; // Info of each user that stakes tokens.
	DevWallet[] public devWallets;
 IERC20 public tokenEarn;
	address public burnAddress;
	bool public started = false;
	bool public finished = false;
	uint public tokenPerBlock;
 uint public rewardTokensLeft;
	uint public poolRewardAmount;
 uint public tokensToBurn = 0;
	uint public endRewardBlockNumber = 1;
	uint public startBlock = 1;
	uint public totalAllocPoint = 0;
	event eventDeposit(address indexed user, uint indexed poolID, uint amount);
	event eventWithdraw(address indexed user, uint indexed poolID, uint amount);
	event eventEmergencyWithdraw(address indexed user, uint indexed poolID, uint amount);
 event eventAddDevAddress(address indexed devAddress, uint indexed sharePercent);

	struct UserInfo {
		uint amount;
		uint rewardDebt;
	}

	struct PoolInfo {
		IERC20 tokenDeposit;
		uint allocPoint;
		uint lastRewardBlock;
		uint accTokenPerShare;
		uint feeDeposit;
	}

 struct DevWallet {
  address devAddress;
  uint sharePercent;
 }

	constructor(IERC20 _tokenEarn, address _burnAddress,	uint _tokenPerBlock,	uint _poolRewardAmount) {
		tokenEarn = _tokenEarn;
		burnAddress = _burnAddress;
		poolRewardAmount = _poolRewardAmount;
		rewardTokensLeft = poolRewardAmount;
		tokenPerBlock = _tokenPerBlock;
	}

	function getMultiplier(uint _from, uint _to) public pure returns (uint) {
  return _to.sub(_from);
	}

	function getRewardBlockNumber() public view returns (uint) {
		if (block.number > endRewardBlockNumber) return endRewardBlockNumber;
		return block.number;
	}

 function getTokensToBeBurned() public view returns (uint) {
  if (!started || startBlock > block.number) return 0;
  uint rewardBlockNumber = getRewardBlockNumber();
  if (block.number > rewardBlockNumber) return tokensToBurn;
  uint tokensToBurnTemp = tokensToBurn;
  for (uint poolID = 0; poolID < pools.length; poolID++) {
   PoolInfo memory pool = pools[poolID];
	 	if (getPoolSupply(poolID) == 0) {
    uint multiplier = getMultiplier(pool.lastRewardBlock, rewardBlockNumber);
    uint tokenReward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
    tokensToBurnTemp = tokensToBurnTemp.add(tokenReward);
   }
		}
  return tokensToBurnTemp;
 }

 function getDistributedTokens() public view returns (uint) {
  if (!started || startBlock > block.number) return 0;
  uint rewardBlockNumber = getRewardBlockNumber();
  if (block.number > rewardBlockNumber) return poolRewardAmount;
  uint multiplier = getMultiplier(startBlock, rewardBlockNumber);
  return tokenPerBlock.mul(multiplier);
 }

 function getTokensToBeDistributed() public view returns (uint) {
  uint distributedTokens = getDistributedTokens();
  return poolRewardAmount.sub(distributedTokens);
 }

	function getPoolSupply(uint _poolID) public view returns (uint) {
		PoolInfo memory pool = pools[_poolID];
		if (address(tokenEarn) == address(pool.tokenDeposit)) return pool.tokenDeposit.balanceOf(address(this)).sub(rewardTokensLeft);
		return pool.tokenDeposit.balanceOf(address(this));
	}

	function pendingTokens(uint _poolID, address _user) external view returns (uint) {
		if(!started || startBlock > block.number) {
			return 0;
		}
		PoolInfo storage pool = pools[_poolID];
		UserInfo storage user = users[_poolID][_user];
		uint accTokenPerShare = pool.accTokenPerShare;
		uint blockNumber = getRewardBlockNumber();
		uint lpSupply = getPoolSupply(_poolID);
 	if (block.number > pool.lastRewardBlock && lpSupply != 0) {
			uint multiplier = getMultiplier(pool.lastRewardBlock, blockNumber);
			uint tokenReward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
			accTokenPerShare = accTokenPerShare.add(tokenReward.mul(1e12).div(lpSupply));
		}
		return user.amount.mul(accTokenPerShare).div(1e12).sub(user.rewardDebt);
	}

	function updateAllPools() public {
		if (!started || startBlock > block.number || finished) return;
		for (uint poolID = 0; poolID < pools.length; poolID++) updatePool(poolID);
		uint blockNumber = getRewardBlockNumber();
		if (block.number > blockNumber) finished = true;
	}

	function updatePool(uint _poolID) internal {
		if(!started || startBlock > block.number || finished) return;
		PoolInfo storage pool = pools[_poolID];
		if (block.number <= pool.lastRewardBlock)	return;
		uint blockNumber = getRewardBlockNumber();
  if (pool.allocPoint == 0) {
			pool.lastRewardBlock = blockNumber;
			return;
		}
		uint lpSupply = getPoolSupply(_poolID);
  uint multiplier = getMultiplier(pool.lastRewardBlock, blockNumber);
		uint tokenReward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
  if (lpSupply == 0) {
   tokensToBurn = tokensToBurn.add(tokenReward);
   pool.lastRewardBlock = blockNumber;
   return;
  }
  rewardTokensLeft = rewardTokensLeft.sub(tokenReward);
		pool.accTokenPerShare = pool.accTokenPerShare.add(tokenReward.mul(1e12).div(lpSupply));
		pool.lastRewardBlock = blockNumber;
	}

	function deposit(uint _poolID, uint _amount) public nonReentrant {
		PoolInfo storage pool = pools[_poolID];
		UserInfo storage user = users[_poolID][msg.sender];
		updateAllPools();
		if (user.amount > 0) {
			uint pending = user.amount.mul(pool.accTokenPerShare).div(1e12).sub(user.rewardDebt);
			if (pending > 0) safeTokenTransfer(msg.sender, pending);
		}
		if (_amount > 0) {
			pool.tokenDeposit.safeTransferFrom(msg.sender, address(this), _amount);
			if (pool.feeDeposit > 0) {
				uint depositFee = _amount.mul(pool.feeDeposit).div(10000);
    for (uint i = 0; i < devWallets.length; i++) pool.tokenDeposit.safeTransfer(devWallets[i].devAddress, depositFee * devWallets[i].sharePercent / 10000);
    user.amount = user.amount.add(_amount).sub(depositFee);
			} else user.amount = user.amount.add(_amount);
		}
		user.rewardDebt = user.amount.mul(pool.accTokenPerShare).div(1e12);
		emit eventDeposit(msg.sender, _poolID, _amount);
	}

	function withdraw(uint _poolID, uint _amount) public nonReentrant {
		PoolInfo storage pool = pools[_poolID];
		UserInfo storage user = users[_poolID][msg.sender];
		require(user.amount >= _amount, 'withdraw: Amount is too big');
		updateAllPools();
		uint pending = user.amount.mul(pool.accTokenPerShare).div(1e12).sub(user.rewardDebt);
		if (pending > 0) safeTokenTransfer(msg.sender, pending);
		if (_amount > 0) {
			user.amount = user.amount.sub(_amount);
			pool.tokenDeposit.safeTransfer(address(msg.sender), _amount);
		}
		user.rewardDebt = user.amount.mul(pool.accTokenPerShare).div(1e12);
		emit eventWithdraw(msg.sender, _poolID, _amount);
	}

	function emergencyWithdraw(uint _poolID) public nonReentrant {
	 	PoolInfo storage pool = pools[_poolID];
		UserInfo storage user = users[_poolID][msg.sender];
		uint amount = user.amount;
		user.amount = 0;
		user.rewardDebt = 0;
		pool.tokenDeposit.safeTransfer(address(msg.sender), amount);
		emit eventEmergencyWithdraw(msg.sender, _poolID, amount);
	}

	function safeTokenTransfer(address _to, uint _amount) internal {
  uint tokenBal = tokenEarn.balanceOf(address(this));
  bool transferSuccess = false;
  if (_amount > tokenBal) transferSuccess = tokenEarn.transfer(_to, tokenBal);
  else transferSuccess = tokenEarn.transfer(_to, _amount);
  require(transferSuccess, 'safeTokenTransfer: transfer failed');
 }

	function createPool(uint _allocPoint, IERC20 _lpToken, uint16 _depositFeeBP) public onlyOwner {
		uint lastRewardBlock = block.number > startBlock ? block.number : startBlock;
		totalAllocPoint = totalAllocPoint.add(_allocPoint);
		pools.push(PoolInfo({ tokenDeposit: _lpToken, allocPoint: _allocPoint, lastRewardBlock: lastRewardBlock, accTokenPerShare: 0, feeDeposit: _depositFeeBP }));
	}

	function start(uint _offsetInBlockNumber) public onlyOwner {
		require(!started, 'start: already started');
		startBlock = block.number.add(_offsetInBlockNumber);
		uint blocks = poolRewardAmount.div(tokenPerBlock);
		endRewardBlockNumber = startBlock.add(blocks);
		for (uint poolID = 0; poolID < pools.length; poolID++) pools[poolID].lastRewardBlock = startBlock;
		updateAllPools();
		started = true;
	}

	function burnRemainingTokens() external onlyOwner {
		require(finished, 'burnRemainingTokens: not yet finished');
		require(rewardTokensLeft > 0, 'burnRemainingTokens: no tokens to burn');
		tokenEarn.safeTransfer(burnAddress, tokensToBurn);
	}

 function addDevAddress(address _devAddress, uint _sharePercent) public onlyOwner {
  uint totalShare;
  for (uint i = 0; i < devWallets.length; i++) totalShare += devWallets[i].sharePercent;
  require(totalShare + _sharePercent <= 10000, 'addDevAddress: Share exceeds 100 percent');
  devWallets.push(DevWallet(_devAddress, _sharePercent));
  emit eventAddDevAddress(_devAddress, _sharePercent);
 }
}
