// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import './LiquidityManager.sol';
import './libs/IUniswapV2Router.sol';
import './libs/IUniswapV2Factory.sol';

contract Presale is Ownable, ReentrancyGuard {
 using SafeERC20 for ERC20;
 ERC20 public tokenOur;
 ERC20 public tokenTheir;
 LiquidityManager public liquidityManager;
 uint public devsFeePercent = 50;
 uint public ownBalance;
 uint public startBlock;
 uint public depositTimeOutBlock;
 uint public claimTimeOutBlock;
 uint public depositedCount;
 uint public claimedCount;
 uint public tokenPricePresale;
 uint public tokenPriceLiquidity;
 uint public totalDeposited;
 uint public totalClaimed;
 uint public totalClaimable;
 uint public totalClaimableNotDeducted;
 DevWallet[] public devWallets;
 address public routerAddress;
 address burnAddress;
 mapping(address => uint) public deposited;
 mapping(address => uint) public claimed;
 mapping(address => uint) public claimable;
 event eventDeposited(address indexed sender, uint indexed amount);
 event eventClaimed(address indexed sender, uint indexed amount);
 event eventSetTokenOurAddress(address indexed tokenAddress);
 event eventSetTokenTheirAddress(address indexed tokenAddress);
 event eventSetTokenPricePresale(uint indexed price);
 event eventSetTokenPriceLiquidity(uint indexed price);
 event eventAddDevAddress(address indexed devAddress, uint indexed sharePercent);
 event eventBurnRemainingTokens(uint indexed amount);
 uint MAX_INT = 2**256 - 1;
 bool liquidityCreated = false;

 struct DevWallet {
  address devAddress;
  uint sharePercent;
 }

 constructor(address _tokenOurAddress, address _tokenTheirAddress, address _routerAddress, address _burnAddress, uint _tokenPricePresale, uint _tokenPriceLiquidity, LiquidityManager _liquidityManager) {
  tokenOur = ERC20(_tokenOurAddress);
  tokenTheir = ERC20(_tokenTheirAddress);
  routerAddress = _routerAddress;
  tokenPricePresale = _tokenPricePresale;
  tokenPriceLiquidity = _tokenPriceLiquidity;
  burnAddress = _burnAddress;
  liquidityManager = _liquidityManager;
 }

 function start(uint _delayBlocks, uint _depositBlocks, uint _claimBlocks) public nonReentrant onlyOwner {
  require(startBlock == 0, 'start: Presale has already started');
  startBlock = block.number + _delayBlocks;
  depositTimeOutBlock = startBlock + _depositBlocks;
  claimTimeOutBlock = depositTimeOutBlock + _claimBlocks;
 }

 function deposit(uint _amount) public nonReentrant {
  uint allowance = tokenTheir.allowance(msg.sender, address(this));
  require(allowance >= _amount, 'deposit: Allowance is too low');
  require(block.number >= startBlock && startBlock > 0, 'deposit: Deposit period did not started yet');
  require(block.number <= depositTimeOutBlock, 'deposit: Deposit period already timed out');
  require(totalDeposited + _amount <= getPresaleTokenTheirMax(), 'deposit: Maximum deposit amount exceeded.');
  uint toClaim = (_amount * 10**tokenTheir.decimals()) / tokenPricePresale;
  require(totalClaimable + toClaim <= getBalanceTokenOur(), 'deposit: Not enough tokens in this contract');
  tokenTheir.safeTransferFrom(msg.sender, address(this), _amount);
  for (uint i = 0; i < devWallets.length; i++) tokenTheir.safeTransfer(devWallets[i].devAddress, ((_amount * devsFeePercent) / 100) * devWallets[i].sharePercent / 10000); // devsFeePercent% of tokenTheir deposited here goes to devWallets, the rest stays in this contract
  deposited[msg.sender] += _amount;
  claimable[msg.sender] += toClaim;
  totalDeposited += _amount;
  totalClaimable += toClaim;
  totalClaimableNotDeducted += toClaim;
  depositedCount++;
  emit eventDeposited(msg.sender, _amount);
 }

 function depositOwn(uint _amount) public onlyOwner {
  uint allowance = tokenOur.allowance(msg.sender, address(this));
  require(allowance >= _amount, 'depositOwn: Allowance is too low');
  tokenOur.safeTransferFrom(msg.sender, address(this), _amount);
  ownBalance += _amount;
 }

 function claim() public nonReentrant {
  require(block.number > depositTimeOutBlock && depositTimeOutBlock > 0, 'claim: Deposit period did not timed out yet');
  require(block.number <= claimTimeOutBlock, 'claim: Claim period already timed out');
  if (!liquidityCreated) createLiquidity(); // the first person who runs claim() after depositTimeOut also creates liquidity
  uint amount = claimable[msg.sender];
  require(amount > 0, 'claim: Nothing to claim');
  tokenOur.safeTransfer(msg.sender, amount);
  claimed[msg.sender] += amount;
  claimable[msg.sender] -= amount;
  totalClaimed += amount;
  totalClaimable -= amount;
  claimedCount++;
  emit eventClaimed(msg.sender, amount);
 }

 function createLiquidity() private {
  // the first person who runs claim() after depositTimeOut also creates liquidity
  require(block.number > depositTimeOutBlock && depositTimeOutBlock > 0, 'createLiquidity: Deposit period did not timed out yet');
  require(!liquidityCreated, 'createLiquidity: Liquidity was created already before');
  address pair = liquidityManager.getPairAddress(routerAddress, address(tokenOur), address(tokenTheir));
  if (pair == address(0)) pair = liquidityManager.createPair(routerAddress, address(tokenOur), address(tokenTheir));
  require(pair != address(0), 'createLiquidity: Cannot create token pair');
  uint allowanceOur = tokenOur.allowance(routerAddress, address(this));
  if (allowanceOur < MAX_INT) tokenOur.approve(routerAddress, MAX_INT);
  uint allowanceTheir = tokenTheir.allowance(routerAddress, address(this));
  if (allowanceTheir < MAX_INT) tokenTheir.approve(routerAddress, MAX_INT);
  require(getLiquidityTokenOur() > 0, 'createLiquidity: amountOur must be more than 0');
  require(getLiquidityTokenOur() <= getBalanceTokenOur(), 'createLiquidity: Not enough balance of tokenOur to create a Liquidity');
  IUniswapV2Router(routerAddress).addLiquidity(address(tokenOur), address(tokenTheir), getLiquidityTokenOur(), getLiquidityTokenTheir(), getLiquidityTokenOur(), getLiquidityTokenTheir(), burnAddress, block.timestamp + 1200);
  liquidityCreated = true;
 }

 function burnRemainingTokens() public {
  // to be fair anyone can start it after claimTimeout
  require(block.number > claimTimeOutBlock && claimTimeOutBlock > 0, 'burnRemainingTokens: Claim period did not timed out yet');
  uint remaining = getBalanceTokenOur();
  tokenOur.safeTransfer(burnAddress, remaining);
  emit eventBurnRemainingTokens(remaining);
 }

 function getPresaleTokenTheirMax() public view returns (uint) {
  // TODO: this works only for both tokens have the same number of decimals (18), should work also with tokens with different number of decimals
  uint totalOur = ownBalance;
  uint totalToPresaleOur = (totalOur * tokenPriceLiquidity) / (tokenPriceLiquidity + (tokenPricePresale * devsFeePercent) / 100);
  return (totalToPresaleOur * tokenPricePresale) / 10**tokenOur.decimals();
 }

 function getLiquidityTokenOur() public view returns (uint) {
  return (getLiquidityTokenTheir() * 10**tokenOur.decimals()) / tokenPriceLiquidity;
 }

 function getLiquidityTokenTheir() public view returns (uint) {
  return (totalDeposited * (100 - devsFeePercent)) / 100;
 }

 function getBalanceTokenOur() public view returns (uint) {
  return tokenOur.balanceOf(address(this));
 }

 function getBalanceTokenTheir() public view returns (uint) {
  return tokenTheir.balanceOf(address(this));
 }

 function addDevAddress(address _devAddress, uint _sharePercent) public onlyOwner {
  uint totalShare;
  for (uint i = 0; i < devWallets.length; i++) totalShare += devWallets[i].sharePercent;
  require(totalShare + _sharePercent <= 10000, 'addDevAddress: Share exceeds 100 percent');
  devWallets.push(DevWallet(_devAddress, _sharePercent));
  emit eventAddDevAddress(_devAddress, _sharePercent);
 }
}
