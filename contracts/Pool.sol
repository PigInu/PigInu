// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Pool is Ownable, ReentrancyGuard {
	using SafeMath for uint256;
	using SafeERC20 for IERC20;

	mapping(uint256 => mapping(address => UserInfo)) public users; // Info of each user that stakes tokens.
	PoolInfo[] public pools; // Info of each user that stakes tokens.
	IERC20 public tokenEarn;
	uint256 public tokenPerBlock;
	address public devFeeAddress;
	address public burnAddress;
	bool started = false;
	bool finished = false;
	uint256 public rewardTokensLeft;
	uint256 public poolRewardAmount;
	uint256 public endRewardBlockNumber;
	uint256 public startBlock;
	uint256 public totalAllocPoint = 0;

	event eventDeposit(address indexed user, uint256 indexed poolID, uint256 amount);
	event eventWithdraw(address indexed user, uint256 indexed poolID, uint256 amount);
	event eventEmergencyWithdraw(address indexed user, uint256 indexed poolID, uint256 amount);
	event eventSetDevFeeAddress(address indexed user, address indexed devFeeAddress);

	struct UserInfo {
		uint256 amount;
		uint256 rewardDebt;
	}

	struct PoolInfo {
		IERC20 tokenDeposit;
		uint256 allocPoint;
		uint256 lastRewardBlock;
		uint256 accTokenPerShare;
		uint256 feeDeposit;
	}

	constructor(
		IERC20 _tokenEarn,
		address _burnAddress,
		address _devFeeAddress,
		uint256 _tokenPerBlock,
		uint256 _startBlock,
		uint256 _poolRewardAmount
	) {
		tokenEarn = _tokenEarn;
		burnAddress = _burnAddress;
		setDevFeeAddress(_devFeeAddress);
		poolRewardAmount = _poolRewardAmount;
		rewardTokensLeft = poolRewardAmount;

		tokenPerBlock = _tokenPerBlock;
		startBlock = _startBlock;
		uint256 blocks = poolRewardAmount.div(_tokenPerBlock);
		endRewardBlockNumber = _startBlock.add(blocks);
	}

	function getMultiplier(uint256 _from, uint256 _to) public pure returns (uint256) {
		return _to.sub(_from);
	}

	function getRewardBlockNumber() public view returns (uint256) {
		if (block.number > endRewardBlockNumber) {
			return endRewardBlockNumber;
		}
		return block.number;
	}

	function getPoolSupply(uint256 _poolID) public view returns (uint256) {
		PoolInfo storage pool = pools[_poolID];
		if (address(tokenEarn) == address(pool.tokenDeposit)) {
			return pool.tokenDeposit.balanceOf(address(this)).sub(rewardTokensLeft);
		}
		return pool.tokenDeposit.balanceOf(address(this));
	}

	function pendingTokens(uint256 _poolID, address _user) external view returns (uint256) {
		PoolInfo storage pool = pools[_poolID];
		UserInfo storage user = users[_poolID][_user];
		uint256 accTokenPerShare = pool.accTokenPerShare;
		uint256 blockNumber = getRewardBlockNumber();
		uint256 lpSupply = getPoolSupply(_poolID);

		if (block.number > pool.lastRewardBlock && lpSupply != 0) {
			uint256 multiplier = getMultiplier(pool.lastRewardBlock, blockNumber);
			uint256 tokenReward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
			accTokenPerShare = accTokenPerShare.add(tokenReward.mul(1e12).div(lpSupply));
		}
		return user.amount.mul(accTokenPerShare).div(1e12).sub(user.rewardDebt);
	}

	function updateAllPools() public {
		if (finished) {
			return;
		}
		for (uint256 poolID = 0; poolID < pools.length; poolID++) {
			updatePool(poolID);
		}
		uint256 blockNumber = getRewardBlockNumber();
		if (block.number > blockNumber) {
			finished = true;
		}
	}

	function updatePool(uint256 _poolID) internal {
		PoolInfo storage pool = pools[_poolID];
		if (block.number <= pool.lastRewardBlock || finished) {
			return;
		}
		uint256 blockNumber = getRewardBlockNumber();
		uint256 lpSupply = getPoolSupply(_poolID);
		if (lpSupply == 0 || pool.allocPoint == 0) {
			pool.lastRewardBlock = blockNumber;
			return;
		}
		uint256 multiplier = getMultiplier(pool.lastRewardBlock, blockNumber);
		uint256 tokenReward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
		rewardTokensLeft = rewardTokensLeft.sub(tokenReward);
		pool.accTokenPerShare = pool.accTokenPerShare.add(tokenReward.mul(1e12).div(lpSupply));
		pool.lastRewardBlock = blockNumber;
	}

	function deposit(uint256 _poolID, uint256 _amount) public nonReentrant {
		PoolInfo storage pool = pools[_poolID];
		UserInfo storage user = users[_poolID][msg.sender];
		updateAllPools();
		if (user.amount > 0) {
			uint256 pending = user.amount.mul(pool.accTokenPerShare).div(1e12).sub(user.rewardDebt);
			if (pending > 0) safeTokenTransfer(address(tokenEarn), msg.sender, pending);
		}
		if (_amount > 0) {
			pool.tokenDeposit.safeTransferFrom(msg.sender, address(this), _amount);
			if (pool.feeDeposit > 0) {
				uint256 depositFee = _amount.mul(pool.feeDeposit).div(10000);
				pool.tokenDeposit.safeTransfer(devFeeAddress, depositFee);
				user.amount = user.amount.add(_amount).sub(depositFee);
			} else {
				user.amount = user.amount.add(_amount);
			}
		}
		user.rewardDebt = user.amount.mul(pool.accTokenPerShare).div(1e12);
		emit eventDeposit(msg.sender, _poolID, _amount);
	}

	function withdraw(uint256 _poolID, uint256 _amount) public nonReentrant {
		PoolInfo storage pool = pools[_poolID];
		UserInfo storage user = users[_poolID][msg.sender];
		require(user.amount >= _amount, "withdraw: Amount is too big");
		updateAllPools();
		uint256 pending = user.amount.mul(pool.accTokenPerShare).div(1e12).sub(user.rewardDebt);
		if (pending > 0) safeTokenTransfer(address(tokenEarn), msg.sender, pending);
		if (_amount > 0) {
			user.amount = user.amount.sub(_amount);
			pool.tokenDeposit.safeTransfer(address(msg.sender), _amount);
		}
		user.rewardDebt = user.amount.mul(pool.accTokenPerShare).div(1e12);
		emit eventWithdraw(msg.sender, _poolID, _amount);
	}

	function emergencyWithdraw(uint256 _poolID) public nonReentrant {
		PoolInfo storage pool = pools[_poolID];
		UserInfo storage user = users[_poolID][msg.sender];
		uint256 amount = user.amount;
		user.amount = 0;
		user.rewardDebt = 0;
		pool.tokenDeposit.safeTransfer(address(msg.sender), amount);
		emit eventEmergencyWithdraw(msg.sender, _poolID, amount);
	}

	function safeTokenTransfer(
		address _tokenAddress,
		address _toAddress,
		uint256 _amount
	) internal {
		IERC20 token = IERC20(_tokenAddress);
		uint256 tokenBal = token.balanceOf(address(this));
		bool transferSuccess = false;
		if (_amount > tokenBal) transferSuccess = token.transfer(_toAddress, tokenBal);
		else transferSuccess = token.transfer(_toAddress, _amount);
		require(transferSuccess, "safeTokenTransfer: transfer failed");
	}

	function createPool(
		uint256 _allocPoint,
		IERC20 _lpToken,
		uint16 _depositFeeBP
	) public onlyOwner {
		uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
		totalAllocPoint = totalAllocPoint.add(_allocPoint);
		pools.push(PoolInfo({ tokenDeposit: _lpToken, allocPoint: _allocPoint, lastRewardBlock: lastRewardBlock, accTokenPerShare: 0, feeDeposit: _depositFeeBP }));
	}

	function start() public onlyOwner {
		updateAllPools();
		started = true;
	}

	function burnRemainingTokens() external onlyOwner {
		require(finished, "burnRemainingTokens: not yet finished");
		require(rewardTokensLeft > 0, "burnRemainingTokens: no tokens to burn");
		tokenEarn.safeTransfer(burnAddress, rewardTokensLeft);
	}

	function setDevFeeAddress(address _devFeeAddress) public onlyOwner {
		devFeeAddress = _devFeeAddress;
		emit eventSetDevFeeAddress(msg.sender, _devFeeAddress);
	}
}
