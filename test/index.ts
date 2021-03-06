import { expect } from 'chai';
import { ethers } from 'hardhat';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Airdrop, LiquidityManager, Pool, Presale, Token, Stablecoin, UniswapV2RouterMock, UniswapV2FactoryMock } from '../typechain';
import { BigNumber } from 'ethers';

describe('Token tests', function () {
 let _owner: SignerWithAddress;
 let _recipient: SignerWithAddress;
 let _developer: SignerWithAddress;
 let _taxExcluded: SignerWithAddress;
 let _burn: SignerWithAddress;
 let _tokenContract: Token;
 const tokenOurName = 'Test token';
 const tokenOurSymbol = 'TEST';
 const tokenOurSupply = 10000000; // 10 000 000 tokens
 const tokenOurDecimals = 18;
 const tokenOurBurnFee = 2;
 const tokenOurDevFee = 3;

 beforeEach(async function () {
  [_owner, _recipient, _developer, _taxExcluded, _burn] = await ethers.getSigners();
  const Token = await ethers.getContractFactory('Token');
  _tokenContract = await Token.deploy(tokenOurName, tokenOurSymbol, tokenOurSupply, tokenOurDecimals, tokenOurDevFee, tokenOurBurnFee, _burn.address);
  await _tokenContract.deployed();
  await _tokenContract.setDevAddress(_developer.address);
 });
 it('Should set DevAddress', async function () {
  await _tokenContract.setDevAddress(_owner.address);
  expect(await _tokenContract.devAddress()).to.be.equal(_owner.address);
 });
 it('Should set TaxExclusion', async function () {
  await _tokenContract.setTaxExclusion(_taxExcluded.address, true);
  expect(await _tokenContract.excludedFromTax(_taxExcluded.address)).to.be.true;
 });
 it('Should unset TaxExclusion', async function () {
  await _tokenContract.setTaxExclusion(_owner.address, false);
  expect(await _tokenContract.excludedFromTax(_owner.address)).to.be.false;
 });
 it('Should transfer with fee', async function () {
  await _tokenContract.setTaxExclusion(_owner.address, false);
  const transferAmount = 100;
  const burnAmount = (100 * tokenOurBurnFee) / 100;
  const devAmount = (100 * tokenOurDevFee) / 100;
  const recipientAmount = transferAmount - burnAmount - devAmount;
  await _tokenContract.transfer(_recipient.address, transferAmount);
  expect(await _tokenContract.balanceOf(_recipient.address)).to.be.equal(recipientAmount);
  expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(burnAmount);
  expect(await _tokenContract.balanceOf(_developer.address)).to.be.equal(devAmount);
 });
 it('Should transfer without fee', async function () {
  const transferAmount = 100;
  const burnAmount = 0;
  const devAmount = 0;
  const recipientAmount = transferAmount - burnAmount - devAmount;
  await _tokenContract.transfer(_recipient.address, transferAmount);
  expect(await _tokenContract.balanceOf(_recipient.address)).to.be.equal(recipientAmount);
  expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(burnAmount);
  expect(await _tokenContract.balanceOf(_developer.address)).to.be.equal(devAmount);
 });
});
describe('Airdrop tests', function () {
 let _owner: SignerWithAddress;
 let _developer: SignerWithAddress;
 let _taxExcluded: SignerWithAddress;
 let _burn: SignerWithAddress;
 let _tokenContract: Token;
 let _airdropContract: Airdrop;
 const tokenOurName = 'Test token';
 const tokenOurSymbol = 'TEST';
 const tokenOurSupply = 10000000; // 10 000 000 tokens
 const tokenOurDecimals = 18;
 const tokenOurBurnFee = 2;
 const tokenOurDevFee = 3;
 const airdropAmount = '1000000000000000000'; // 1 token
 const airdropMinBaseCoinBalance = '1000000000000000000'; // 0.1 BNB / MATIC / etc...
 const airdropDelayBlocks = '0';
 const airdropTimeBlocks = '130';
 beforeEach(async function () {
  await ethers.provider.send('hardhat_reset', []);
  [_owner, _developer, _taxExcluded, _burn] = await ethers.getSigners();
  const Token = await ethers.getContractFactory('Token');
  _tokenContract = await Token.deploy(tokenOurName, tokenOurSymbol, tokenOurSupply, tokenOurDecimals, tokenOurDevFee, tokenOurBurnFee, _burn.address);
  await _tokenContract.deployed();
  await _tokenContract.setDevAddress(_developer.address);
  await _tokenContract.setTaxExclusion(_taxExcluded.address, true);
  const Airdrop = await ethers.getContractFactory('Airdrop');
  _airdropContract = await Airdrop.deploy(_tokenContract.address, _burn.address, airdropAmount, airdropMinBaseCoinBalance);
  await _airdropContract.deployed();
  await _tokenContract.setTaxExclusion(_airdropContract.address, true);
  await _tokenContract.transfer(_airdropContract.address, '2000000000000000000'); // 2 tokens
  await ethers.provider.send('hardhat_setBalance', [_owner.address, '0x10000000000000000']);
 });
 it('Should claim', async function () {
  expect(await _tokenContract.balanceOf(_taxExcluded.address)).to.be.equal(0);
  await _airdropContract.start(airdropDelayBlocks, airdropTimeBlocks);
  expect(await _airdropContract.connect(_taxExcluded).claim())
   .to.emit(_airdropContract, 'eventClaimed')
   .withArgs(_taxExcluded.address, airdropAmount);
  expect(await _airdropContract.addressReceived(_taxExcluded.address)).to.be.true;
  expect(await _airdropContract.claimCount()).to.be.equal(1);
  expect(await _airdropContract.totalClaimed()).to.be.equal(airdropAmount);
  expect(await _tokenContract.balanceOf(_taxExcluded.address)).to.be.equal(airdropAmount);
 });
 it('Should revert claim - Airdrop has not started yet', async function () {
  await expect(_airdropContract.claim()).to.be.revertedWith('claim: Airdrop has not started yet');
 });
 it('Should revert claim - Airdrop has ended already', async function () {
  await _airdropContract.start(airdropDelayBlocks, airdropTimeBlocks);
  const timeInBlocksHex = BigNumber.from(airdropTimeBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  await expect(_airdropContract.claim()).to.be.revertedWith('claim: Airdrop has already ended');
 });
 it('Should revert claim - Your address have already claimed your tokens', async function () {
  await _airdropContract.start(airdropDelayBlocks, airdropTimeBlocks);
  await _airdropContract.claim();
  await expect(_airdropContract.claim()).to.be.revertedWith('claim: Your address have already claimed your tokens');
 });
 it('Should revert claim - Your wallet address does not have enough base coin', async function () {
  await _airdropContract.start(airdropDelayBlocks, airdropTimeBlocks);
  await ethers.provider.send('hardhat_setBalance', [_owner.address, '0x100000000000000']);
  await expect(_airdropContract.claim()).to.be.revertedWith('claim: Your wallet address does not have enough base coin');
 });
 it('Should burn remaining tokens', async function () {
  await _airdropContract.start(airdropDelayBlocks, airdropTimeBlocks);
  await _airdropContract.claim();
  const timeInBlocksHex = BigNumber.from(airdropTimeBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  expect(await _airdropContract.burnRemainingTokens())
   .to.emit(_airdropContract, 'eventBurnRemainingTokens')
   .withArgs(airdropAmount);
  expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(airdropAmount);
 });
 it('Should revert burn - Airdrop has not started yet', async function () {
  await expect(_airdropContract.burnRemainingTokens()).to.be.revertedWith('burnRemainingTokens: Airdrop has not started yet');
 });
 it('Should revert burn - Airdrop has not ended yet', async function () {
  await _airdropContract.start(airdropDelayBlocks, airdropTimeBlocks);
  await expect(_airdropContract.burnRemainingTokens()).to.be.revertedWith('burnRemainingTokens: Airdrop has not ended yet');
 });
});

describe('Presale tests', function () {
 let _owner: SignerWithAddress;
 let _developer: SignerWithAddress;
 let _burn: SignerWithAddress;
 let _presaleDevAddress1: SignerWithAddress;
 let _presaleDevAddress2: SignerWithAddress;
 let _presaleDevAddress3: SignerWithAddress;
 let _tokenContract: Token;
 let _stablecoinContract: Stablecoin;
 let _lpTokenContract: Stablecoin;
 let _presaleContract: Presale;
 let _liquidityManagerContract: LiquidityManager;
 let _uniswapV2RouterMockContract: UniswapV2RouterMock;
 let _uniswapV2FactoryMockContract: UniswapV2FactoryMock;
 const tokenOurName = 'Test token';
 const tokenOurSymbol = 'TEST';
 const tokenOurSupply = 10000000; // 10 000 000 tokens
 const tokenOurDecimals = 18;
 const tokenOurBurnFee = 2;
 const tokenOurDevFee = 3;
 const presalePricePresale = '1000000000000000000'; // 1 USD
 const presalePriceLiquidity = '2000000000000000000'; // 2 USD
 const presaleDepositTime = '300'; // 5 minutes
 const presaleDepositTimeInMinutes = 5;
 const presaleClaimTime = '300'; // 5 minutes
 const presaleClaimTimeInMinutes = 5;
 const presaleDepositOwnAmount = '2000000000000000000';
 const presaleDepositAmount = '1000000000000000000';
 const presaleDepositFeeAmount = '500000000000000000';
 const presaleDev1Fee = '4500';
 const presaleDev2Fee = '4500';
 const presaleDev3Fee = '1000';
 const presaleDelayBlocks = '0';
 const presaleDepositBlocks = '130';
 const presaleClaimBlocks = '130';
 const stablecoinAmount = '2000000000000000000'; // 2 USD

 beforeEach(async function () {
  [_owner, _developer, _burn, _presaleDevAddress1, _presaleDevAddress2, _presaleDevAddress3] = await ethers.getSigners();
  const LpToken = await ethers.getContractFactory('Stablecoin');
  _lpTokenContract = await LpToken.deploy();
  await _lpTokenContract.deployed();
  const UniswapV2FactoryMock = await ethers.getContractFactory('UniswapV2FactoryMock');
  _uniswapV2FactoryMockContract = await UniswapV2FactoryMock.deploy(_lpTokenContract.address);
  await _uniswapV2FactoryMockContract.deployed();
  const UniswapV2RouterMock = await ethers.getContractFactory('UniswapV2RouterMock');
  _uniswapV2RouterMockContract = await UniswapV2RouterMock.deploy(_uniswapV2FactoryMockContract.address);
  await _uniswapV2RouterMockContract.deployed();
  const LiquidityManager = await ethers.getContractFactory('LiquidityManager');
  _liquidityManagerContract = await LiquidityManager.deploy();
  await _liquidityManagerContract.deployed();
  const Stablecoin = await ethers.getContractFactory('Stablecoin');
  _stablecoinContract = await Stablecoin.deploy();
  await _stablecoinContract.deployed();
  await _stablecoinContract.mint(_owner.address, stablecoinAmount);
  const Token = await ethers.getContractFactory('Token');
  _tokenContract = await Token.deploy(tokenOurName, tokenOurSymbol, tokenOurSupply, tokenOurDecimals, tokenOurDevFee, tokenOurBurnFee, _burn.address);
  await _tokenContract.deployed();
  await _tokenContract.setDevAddress(_developer.address);
  const Presale = await ethers.getContractFactory('Presale');
  _presaleContract = await Presale.deploy(
   _tokenContract.address,
   _stablecoinContract.address,
   _uniswapV2RouterMockContract.address,
   _burn.address,
   presalePricePresale,
   presalePriceLiquidity,
   _liquidityManagerContract.address
  );
  await _presaleContract.deployed();
  await _presaleContract.addDevAddress(_presaleDevAddress1.address, presaleDev1Fee);
  await _presaleContract.addDevAddress(_presaleDevAddress2.address, presaleDev2Fee);
  await _presaleContract.addDevAddress(_presaleDevAddress3.address, presaleDev3Fee);

  await _tokenContract.setTaxExclusion(_presaleContract.address, true);
  await _tokenContract.setTaxExclusion(_owner.address, true);
 });
 it('Should revert deposit own token - Allowance is too low', async function () {
  await expect(_presaleContract.depositOwn(presaleDepositOwnAmount)).to.be.revertedWith('depositOwn: Allowance is too low');
 });
 it('Should deposit own token', async function () {
  expect(await _tokenContract.balanceOf(_presaleContract.address)).to.be.equal(0);
  await _tokenContract.approve(_presaleContract.address, presaleDepositOwnAmount);
  await _presaleContract.depositOwn(presaleDepositOwnAmount);
  expect(await _presaleContract.ownBalance()).to.be.equal(presaleDepositOwnAmount);
  expect(await _tokenContract.balanceOf(_presaleContract.address)).to.be.equal(presaleDepositOwnAmount);
 });
 it('Should revert deposit - Allowance is too low', async function () {
  await expect(_presaleContract.deposit(presaleDepositAmount)).to.be.revertedWith('deposit: Allowance is too low');
 });
 it('Should revert deposit - Deposit period already timed out', async function () {
  await _presaleContract.start(presaleDelayBlocks, presaleDepositBlocks, presaleClaimBlocks);
  await _stablecoinContract.approve(_presaleContract.address, presaleDepositAmount);
  const timeInBlocksHex = BigNumber.from(presaleDepositBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  await expect(_presaleContract.deposit(presaleDepositAmount)).to.be.revertedWith('deposit: Deposit period already timed out');
 });
 it('Should revert deposit - Maximum deposit amount exceeded', async function () {
  await _presaleContract.start(presaleDelayBlocks, presaleDepositBlocks, presaleClaimBlocks);
  await _stablecoinContract.approve(_presaleContract.address, presaleDepositAmount);
  await expect(_presaleContract.deposit(presaleDepositAmount)).to.be.revertedWith('deposit: Maximum deposit amount exceeded');
 });
 it('Should deposit', async function () {
  await _presaleContract.start(presaleDelayBlocks, presaleDepositBlocks, presaleClaimBlocks);
  await _tokenContract.approve(_presaleContract.address, presaleDepositOwnAmount);
  await _presaleContract.depositOwn(presaleDepositOwnAmount);
  await _stablecoinContract.approve(_presaleContract.address, presaleDepositAmount);
  expect(await _presaleContract.deposit(presaleDepositAmount))
   .to.emit(_presaleContract, 'eventDeposited')
   .withArgs(_owner.address, presaleDepositAmount);
  expect(await _stablecoinContract.balanceOf(_presaleDevAddress1.address)).to.be.equal(BigNumber.from(presaleDepositAmount).div(2).mul(presaleDev1Fee).div(10000));
  expect(await _stablecoinContract.balanceOf(_presaleDevAddress2.address)).to.be.equal(BigNumber.from(presaleDepositAmount).div(2).mul(presaleDev2Fee).div(10000));
  expect(await _stablecoinContract.balanceOf(_presaleDevAddress3.address)).to.be.equal(BigNumber.from(presaleDepositAmount).div(2).mul(presaleDev3Fee).div(10000));

  expect(await _presaleContract.deposited(_owner.address)).to.be.equal(presaleDepositAmount);
  expect(await _presaleContract.claimable(_owner.address)).to.be.equal(presaleDepositAmount);
  expect(await _presaleContract.totalDeposited()).to.be.equal(presaleDepositAmount);
  expect(await _presaleContract.totalClaimable()).to.be.equal(presaleDepositAmount);
  expect(await _presaleContract.totalClaimableNotDeducted()).to.be.equal(presaleDepositAmount);
 });
 it('Should revert burn - Claim period did not timed out yet', async function () {
  await _presaleContract.start(presaleDelayBlocks, presaleDepositBlocks, presaleClaimBlocks);
  await _tokenContract.approve(_presaleContract.address, presaleDepositOwnAmount);
  await _presaleContract.depositOwn(presaleDepositOwnAmount);
  await _stablecoinContract.approve(_presaleContract.address, presaleDepositAmount);
  await _presaleContract.deposit(presaleDepositAmount);
  const timeInBlocksHex = BigNumber.from(presaleDepositBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  await expect(_presaleContract.burnRemainingTokens()).to.be.revertedWith('burnRemainingTokens: Claim period did not timed out yet');
 });
 it('Should burn remaining tokens', async function () {
  await _tokenContract.approve(_presaleContract.address, presaleDepositOwnAmount);
  await _presaleContract.depositOwn(presaleDepositOwnAmount);
  await _stablecoinContract.approve(_presaleContract.address, presaleDepositAmount);
  await _presaleContract.start(presaleDelayBlocks, presaleDepositBlocks, presaleClaimBlocks);
  await _presaleContract.deposit(presaleDepositAmount);
  let timeInBlocksHex = BigNumber.from(presaleDepositBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  timeInBlocksHex = BigNumber.from(presaleClaimBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  expect(await _presaleContract.burnRemainingTokens())
   .to.emit(_presaleContract, 'eventBurnRemainingTokens')
   .withArgs(presaleDepositOwnAmount);
  expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(presaleDepositOwnAmount);
 });
 it('Should revert claim - Deposit period did not timed out yet', async function () {
  await expect(_presaleContract.claim()).to.be.revertedWith('claim: Deposit period did not timed out yet');
 });
 it('Should revert claim - Claim period already timed out', async function () {
  await _presaleContract.start(presaleDelayBlocks, presaleDepositBlocks, presaleClaimBlocks);
  let timeInBlocksHex = BigNumber.from(presaleDepositBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  timeInBlocksHex = BigNumber.from(presaleClaimBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  await expect(_presaleContract.claim()).to.be.revertedWith('claim: Claim period already timed out');
 });
 it('Should claim', async function () {
  await _tokenContract.approve(_presaleContract.address, presaleDepositOwnAmount);
  await _presaleContract.depositOwn(presaleDepositOwnAmount);
  await _stablecoinContract.approve(_presaleContract.address, presaleDepositAmount);
  await _presaleContract.start(presaleDelayBlocks, presaleDepositBlocks, presaleClaimBlocks);
  await _presaleContract.deposit(presaleDepositAmount);
  const timeInBlocksHex = BigNumber.from(presaleDepositBlocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  expect(await _presaleContract.claim())
   .to.emit(_presaleContract, 'eventClaimed')
   .withArgs(_owner.address, presaleDepositAmount);
  expect(await _presaleContract.claimed(_owner.address)).to.be.equal(presaleDepositAmount);
  expect(await _presaleContract.claimable(_owner.address)).to.be.equal(0);
  expect(await _presaleContract.totalClaimed()).to.be.equal(presaleDepositAmount);
  expect(await _presaleContract.totalClaimable()).to.be.equal(0);
 });
});

describe('Pool tests', function () {
 let _owner: SignerWithAddress;
 let _developer: SignerWithAddress;
 let _burn: SignerWithAddress;
 let _pairAddress: string;
 let _poolContract: Pool;
 let _tokenContract: Token;
 let _stablecoinContract: Stablecoin;
 let _lpTokenContract: Stablecoin;
 let _liquidityManagerContract: LiquidityManager;
 let _uniswapV2RouterMockContract: UniswapV2RouterMock;
 let _uniswapV2FactoryMockContract: UniswapV2FactoryMock;
 const tokenOurName = 'Test token';
 const tokenOurSymbol = 'TEST';
 const tokenOurSupply = 10000000; // 10 000 000 tokens
 const tokenOurDecimals = 18;
 const tokenOurBurnFee = 2;
 const tokenOurDevFee = 3;
 let tokenOwnerStartBalance: BigNumber;
 let stableOwnerStartBalance: BigNumber;
 const poolTokens = '2000000000000000000000000'; // 2 000 000 tokens
 const poolTokenStartDeposit = '10000000000000000000'; // 10 tokens
 const poolTokensDeposit = '1000000000000000000'; // 1 token
 const poolTokensOPerBlock = '100000000000000000'; // 0.1 tokens / block
 const poolTokensOurAllocPoint = 100;
 const poolTokensUSDAllocPoint = 900;
 const poolTokensOurLPAllocPoint = 0;
 let _poolDevAddress1: SignerWithAddress;
 let _poolDevAddress2: SignerWithAddress;

 const poolTokensAllocPoints = [poolTokensOurAllocPoint, poolTokensUSDAllocPoint, poolTokensOurLPAllocPoint];
 const poolOurId = 0;
 const poolUSDId = 1;
 const poolLPId = 2;
 const poolIds = [poolOurId, poolUSDId, poolLPId];
 const poolUSDDepositFee = 400;
 const stablecoinAmount = '2000000000000000000'; // 2 USD
 beforeEach(async function () {
  await ethers.provider.send('hardhat_reset', []);
  await ethers.provider.send('evm_setAutomine', [true]);
  [_owner, _developer, _burn, _poolDevAddress1, _poolDevAddress2] = await ethers.getSigners();
  const LpToken = await ethers.getContractFactory('Stablecoin');
  _lpTokenContract = await LpToken.deploy();
  await _lpTokenContract.deployed();
  await _lpTokenContract.mint(_owner.address, stablecoinAmount);
  const UniswapV2FactoryMock = await ethers.getContractFactory('UniswapV2FactoryMock');
  _uniswapV2FactoryMockContract = await UniswapV2FactoryMock.deploy(_lpTokenContract.address);
  await _uniswapV2FactoryMockContract.deployed();
  const UniswapV2RouterMock = await ethers.getContractFactory('UniswapV2RouterMock');
  _uniswapV2RouterMockContract = await UniswapV2RouterMock.deploy(_uniswapV2FactoryMockContract.address);
  await _uniswapV2RouterMockContract.deployed();
  const Stablecoin = await ethers.getContractFactory('Stablecoin');
  _stablecoinContract = await Stablecoin.deploy();
  await _stablecoinContract.deployed();
  await _stablecoinContract.mint(_owner.address, stablecoinAmount);
  const Token = await ethers.getContractFactory('Token');
  _tokenContract = await Token.deploy(tokenOurName, tokenOurSymbol, tokenOurSupply, tokenOurDecimals, tokenOurDevFee, tokenOurBurnFee, _burn.address);
  await _tokenContract.deployed();
  await _tokenContract.setDevAddress(_developer.address);
  await _tokenContract.setTaxExclusion(_owner.address, true);
  const LiquidityManager = await ethers.getContractFactory('LiquidityManager');
  _liquidityManagerContract = await LiquidityManager.deploy();
  await _liquidityManagerContract.deployed();
  _pairAddress = await _liquidityManagerContract.callStatic.createPair(_uniswapV2RouterMockContract.address, _tokenContract.address, _stablecoinContract.address);
  const Pool = await ethers.getContractFactory('Pool');
  _poolContract = await Pool.deploy(_tokenContract.address, _burn.address, poolTokensOPerBlock, poolTokens);
  await _poolContract.deployed();
  await _poolContract.addDevAddress(_poolDevAddress1.address, '5000');
  await _poolContract.addDevAddress(_poolDevAddress2.address, '5000');
  await _tokenContract.transfer(_poolContract.address, poolTokens);
  await ethers.provider.send('evm_setAutomine', [false]);
  await _poolContract.createPool(poolTokensOurAllocPoint, _tokenContract.address, 0);
  await _poolContract.createPool(poolTokensUSDAllocPoint, _stablecoinContract.address, poolUSDDepositFee);
  await _poolContract.createPool(poolTokensOurLPAllocPoint, _pairAddress, 0);
  await ethers.provider.send('evm_mine', []);
  await ethers.provider.send('evm_setAutomine', [true]);
  await _poolContract.start(2);
  tokenOwnerStartBalance = await _tokenContract.balanceOf(_owner.address);
  stableOwnerStartBalance = await _stablecoinContract.balanceOf(_owner.address);
 });

 it('Should deposit with no fee', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  expect(await _poolContract.deposit(poolOurId, poolTokensDeposit))
   .to.emit(_poolContract, 'eventDeposit')
   .withArgs(_owner.address, poolOurId, poolTokensDeposit);
  expect((await _poolContract.users(poolOurId, _owner.address)).amount).to.be.equal(poolTokensDeposit);
  expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(tokenOwnerStartBalance.sub(poolTokensDeposit));
  expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(BigNumber.from(poolTokens).add(poolTokensDeposit));
 });

 it('Should deposit with fee', async function () {
  await _stablecoinContract.approve(_poolContract.address, poolTokensDeposit);
  expect(await _poolContract.deposit(poolUSDId, poolTokensDeposit))
   .to.emit(_poolContract, 'eventDeposit')
   .withArgs(_owner.address, poolUSDId, poolTokensDeposit);
  const depositFee = BigNumber.from(poolTokensDeposit).mul(poolUSDDepositFee).div(10000);
  expect((await _poolContract.users(poolUSDId, _owner.address)).amount).to.be.equal(BigNumber.from(poolTokensDeposit).sub(depositFee));
  expect(await _stablecoinContract.balanceOf(_owner.address)).to.be.equal(BigNumber.from(stablecoinAmount).sub(poolTokensDeposit));
  expect(await _stablecoinContract.balanceOf(_poolContract.address)).to.be.equal(BigNumber.from(poolTokensDeposit).sub(depositFee));
  expect(await _stablecoinContract.balanceOf(_poolDevAddress1.address)).to.be.equal(BigNumber.from(depositFee).div(2));
  expect(await _stablecoinContract.balanceOf(_poolDevAddress2.address)).to.be.equal(BigNumber.from(depositFee).div(2));
 });

 it('Should return pending tokens', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  await _poolContract.deposit(poolOurId, poolTokensDeposit);
  await ethers.provider.send('evm_mine', []);
  const sumPoolsAllocPoints = poolTokensAllocPoints.reduce(function (a, b) {
   return a + b;
  }, 0);
  const tokenReward = BigNumber.from(poolTokensOPerBlock).mul(poolTokensOurAllocPoint).div(sumPoolsAllocPoints);
  const accTokenPerShare = tokenReward.mul(1e12).div(BigNumber.from(poolTokensDeposit));
  const pendingTokens = BigNumber.from(poolTokensDeposit).mul(accTokenPerShare).div(1e12);
  await expect(await _poolContract.pendingTokens(poolOurId, _owner.address)).to.be.equal(pendingTokens);
  await ethers.provider.send('evm_mine', []);
  await expect(await _poolContract.pendingTokens(poolOurId, _owner.address)).to.be.equal(pendingTokens.mul(2));
 });

 it('Should return 0 pending tokens if not reached startBlock', async function () {
  await expect(await _poolContract.pendingTokens(poolOurId, _owner.address)).to.be.equal(0);
 });

 it('Should withdraw with 0 amount', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  await _poolContract.deposit(poolOurId, poolTokensDeposit);
  const preBlockNumber = await ethers.provider.getBlockNumber();
  await ethers.provider.send('evm_mine', []);
  const amountToWithdraw = await _poolContract.pendingTokens(poolOurId, _owner.address);
  expect(await _poolContract.withdraw(poolOurId, 0))
   .to.emit(_poolContract, 'eventWithdraw')
   .withArgs(_owner.address, poolOurId, amountToWithdraw);
  const postBlockNumber = await ethers.provider.getBlockNumber();
  const multiplier = postBlockNumber - preBlockNumber;
  expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(tokenOwnerStartBalance.sub(poolTokensDeposit).add(amountToWithdraw.mul(multiplier)));
  expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(BigNumber.from(poolTokens).add(poolTokensDeposit).sub(amountToWithdraw.mul(multiplier)));
 });

 it('Should withdraw with deposit amount', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  await _poolContract.deposit(poolOurId, poolTokensDeposit);
  const preBlockNumber = await ethers.provider.getBlockNumber();
  await ethers.provider.send('evm_mine', []);
  const amountToWithdraw = await _poolContract.pendingTokens(poolOurId, _owner.address);
  expect(await _poolContract.withdraw(poolOurId, poolTokensDeposit))
   .to.emit(_poolContract, 'eventWithdraw')
   .withArgs(_owner.address, poolOurId, amountToWithdraw);
  const postBlockNumber = await ethers.provider.getBlockNumber();
  const multiplier = postBlockNumber - preBlockNumber;
  expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(tokenOwnerStartBalance.add(amountToWithdraw.mul(multiplier)));
  expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(BigNumber.from(poolTokens).sub(amountToWithdraw.mul(multiplier)));
 });

 it('Should emergency withdraw', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  await _poolContract.deposit(poolOurId, poolTokensDeposit);
  await ethers.provider.send('evm_mine', []);
  expect(await _poolContract.emergencyWithdraw(0))
   .to.emit(_poolContract, 'eventEmergencyWithdraw')
   .withArgs(_owner.address, poolOurId, poolTokensDeposit);
  expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(tokenOwnerStartBalance);
  expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(BigNumber.from(poolTokens).add(poolTokensDeposit).sub(poolTokensDeposit));
  const user = await _poolContract.users(poolOurId, _owner.address);
  expect(user.amount).to.be.equal(0);
  expect(user.rewardDebt).to.be.equal(0);
 });

 it('Should withdraw reward from two pools', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  await _stablecoinContract.approve(_poolContract.address, poolTokensDeposit);
  const deposit = BigNumber.from(poolTokensDeposit).div(2);
  await ethers.provider.send('evm_setAutomine', [false]);
  await _poolContract.deposit(poolOurId, deposit);
  await _poolContract.deposit(poolUSDId, deposit);
  await ethers.provider.send('evm_mine', []);
  const preBlockNumber = await ethers.provider.getBlockNumber();
  await ethers.provider.send('evm_mine', []);
  const pendingTokensOurs = await _poolContract.pendingTokens(poolOurId, _owner.address);
  const pendingTokensUSDs = await _poolContract.pendingTokens(poolUSDId, _owner.address);
  await _poolContract.withdraw(poolOurId, 0);
  await _poolContract.withdraw(poolUSDId, 0);
  await ethers.provider.send('evm_mine', []);
  const postBlockNumber = await ethers.provider.getBlockNumber();
  const multiplier = postBlockNumber - preBlockNumber;
  const expectedTokenBalance = tokenOwnerStartBalance.sub(deposit).add(pendingTokensOurs.add(pendingTokensUSDs).mul(multiplier));
  expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(expectedTokenBalance);
 });

 it('Should withdraw from two pools', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  await _stablecoinContract.approve(_poolContract.address, poolTokensDeposit);
  const deposit = BigNumber.from(poolTokensDeposit).div(2);
  const depositOur = deposit;
  const depositUSD = deposit.sub(deposit.mul(poolUSDDepositFee).div(10000));
  await ethers.provider.send('evm_setAutomine', [false]);
  await _poolContract.deposit(poolOurId, deposit);
  await _poolContract.deposit(poolUSDId, deposit);
  await ethers.provider.send('evm_mine', []);
  const preBlockNumber = await ethers.provider.getBlockNumber();
  await ethers.provider.send('evm_mine', []);
  const pendingTokensOurs = await _poolContract.pendingTokens(poolOurId, _owner.address);
  const pendingTokensUSDs = await _poolContract.pendingTokens(poolUSDId, _owner.address);
  await _poolContract.withdraw(poolOurId, depositOur);
  await _poolContract.withdraw(poolUSDId, depositUSD);
  await ethers.provider.send('evm_mine', []);
  const postBlockNumber = await ethers.provider.getBlockNumber();
  const multiplier = postBlockNumber - preBlockNumber;
  const expectedTokenBalance = tokenOwnerStartBalance.add(pendingTokensOurs.add(pendingTokensUSDs).mul(multiplier));
  expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(expectedTokenBalance);
  const expectedStableBalance = stableOwnerStartBalance.sub(deposit).add(depositUSD);
  expect(await _stablecoinContract.balanceOf(_owner.address)).to.be.equal(expectedStableBalance);
 });

 it('Should get maximum available pool reward', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  await ethers.provider.send('evm_setAutomine', [false]);
  await _poolContract.deposit(poolOurId, poolTokensDeposit);
  await ethers.provider.send('evm_mine', []);
  const preBlockNumber = await ethers.provider.getBlockNumber();
  const endRewardBlockNumber = await _poolContract.endRewardBlockNumber.call({});
  const timeInBlocks = BigNumber.from(endRewardBlockNumber).sub(preBlockNumber);
  const timeInBlocksHex = timeInBlocks.toHexString().replace(/0x0+/, '0x');
  const sumPoolsAllocPoints = poolTokensAllocPoints.reduce(function (a, b) {
   return a + b;
  }, 0);
  const tokenRewardPerBlock = BigNumber.from(poolTokensOPerBlock).mul(poolTokensOurAllocPoint).div(sumPoolsAllocPoints);
  const totalReward = tokenRewardPerBlock.mul(timeInBlocks);
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  expect(await _poolContract.pendingTokens(poolOurId, _owner.address)).to.be.equal(totalReward);
  await ethers.provider.send('evm_setAutomine', [true]);
  await ethers.provider.send('evm_mine', []);
  expect(await _poolContract.pendingTokens(poolOurId, _owner.address)).to.be.equal(totalReward);
  await _poolContract.withdraw(poolOurId, poolTokensDeposit);
  await ethers.provider.send('evm_mine', []);
  const expectedTokenBalance = tokenOwnerStartBalance.add(totalReward);
  expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(expectedTokenBalance);
  const rewardTokensLeft = await _poolContract.rewardTokensLeft.call({});
  const expectedRewardTokensLeft = BigNumber.from(poolTokens).sub(totalReward);
  expect(rewardTokensLeft).to.be.equal(expectedRewardTokensLeft);
  expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(rewardTokensLeft);
 });

 it('Should burn remaining tokens', async function () {
  await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
  await ethers.provider.send('evm_setAutomine', [true]);
  await _poolContract.deposit(poolOurId, poolTokensDeposit);
  const preBlockNumber = await ethers.provider.getBlockNumber();
  const endRewardBlockNumber = await _poolContract.endRewardBlockNumber.call({});
  const timeInBlocks = BigNumber.from(endRewardBlockNumber).sub(preBlockNumber);
  const timeInBlocksHex = timeInBlocks.toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);
  await _poolContract.withdraw(poolOurId, poolTokensDeposit);
  const tokensToBurn = await _poolContract.tokensToBurn.call({});
  expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(0);
  await _poolContract.burnRemainingTokens();
  expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(tokensToBurn);
  expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(0);
 });

 it('Should revert burning token - not finished', async function () {
  await expect(_poolContract.burnRemainingTokens()).to.be.revertedWith('burnRemainingTokens: not yet finished');
 });

 it('Should return tokens to burn', async function () {
  await ethers.provider.send('evm_mine', []);
  await ethers.provider.send('evm_mine', []);
  let tokensToBurn = await _poolContract.getTokensToBeBurned();
  expect(tokensToBurn).to.be.equal(0);
  await ethers.provider.send('evm_mine', []);
  tokensToBurn = await _poolContract.getTokensToBeBurned();
  expect(tokensToBurn).to.be.equal(poolTokensOPerBlock);
 });

 it('Should return tokens to burn after reaching last reward block', async function () {
  const lastRewardBlock = await _poolContract.endRewardBlockNumber();
  const actualBlock = await ethers.provider.getBlockNumber();
  const blocksToMineHex = lastRewardBlock.sub(actualBlock).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [blocksToMineHex]);
  const tokensToBurn = await _poolContract.getTokensToBeBurned();
  expect(tokensToBurn).to.be.equal(poolTokens);
 });

 it('Should return distributed tokens', async function () {
  await ethers.provider.send('evm_mine', []);
  await ethers.provider.send('evm_mine', []);
  let distributedTokens = await _poolContract.getDistributedTokens();
  expect(distributedTokens).to.be.equal(0);
  await ethers.provider.send('evm_mine', []);
  distributedTokens = await _poolContract.getDistributedTokens();
  expect(distributedTokens).to.be.equal(poolTokensOPerBlock);
 });

 it('Should return tokens to be distribute', async function () {
  await ethers.provider.send('evm_mine', []);
  await ethers.provider.send('evm_mine', []);
  let tokensToBeDistributed = await _poolContract.getTokensToBeDistributed();
  expect(tokensToBeDistributed).to.be.equal(poolTokens);
  await ethers.provider.send('evm_mine', []);
  tokensToBeDistributed = await _poolContract.getTokensToBeDistributed();
  expect(tokensToBeDistributed).to.be.equal(BigNumber.from(poolTokens).sub(poolTokensOPerBlock));
 });
});


describe('Audit Tests', function () {
 let _owner: SignerWithAddress;
 let _developer: SignerWithAddress;
 let _burn: SignerWithAddress;
 let _poolContract: Pool;
 let _tokenContract: Token;
 const tokenOurName = 'Test token';
 const tokenOurSymbol = 'TEST';
 const tokenOurSupply = 10000000; // 10 000 000 tokens
 const tokenOurDecimals = 18;
 const tokenOurBurnFee = 2;
 const tokenOurDevFee = 3;
 let tokenOwnerStartBalance: BigNumber;
 let tokenInvestorStartBalance: BigNumber;
 const poolTokens = '2000000000000000000000000'; // 2 000 000 tokens
 const poolTokensOPerBlock = '100000000000000000'; // 0.1 tokens / block
 const poolTokensOurAllocPoint = 100;
 let _investor1: SignerWithAddress;
 let _investor2: SignerWithAddress;

 const poolOurId = 0;
 beforeEach(async function () {
  await ethers.provider.send('hardhat_reset', []);
  await ethers.provider.send('evm_setAutomine', [true]);
  [_owner, _developer, _burn, _investor1, _investor2] = await ethers.getSigners();
  const Token = await ethers.getContractFactory('Token');
  _tokenContract = await Token.deploy(tokenOurName, tokenOurSymbol, tokenOurSupply, tokenOurDecimals, tokenOurDevFee, tokenOurBurnFee, _burn.address);
  await _tokenContract.deployed();
  await _tokenContract.setDevAddress(_developer.address);
  await _tokenContract.setTaxExclusion(_owner.address, true);
  await _tokenContract.setTaxExclusion(_investor1.address, true);
  await _tokenContract.setTaxExclusion(_investor2.address, true);
  const Pool = await ethers.getContractFactory('Pool');
  _poolContract = await Pool.deploy(_tokenContract.address, _burn.address, poolTokensOPerBlock, poolTokens);
  await _poolContract.deployed();
  await _tokenContract.transfer(_poolContract.address, poolTokens);
  await _poolContract.createPool(poolTokensOurAllocPoint, _tokenContract.address, 0);
  await _poolContract.start(10);
  tokenOwnerStartBalance = await _tokenContract.balanceOf(_owner.address);
  tokenInvestorStartBalance = tokenOwnerStartBalance.div(2);
  _tokenContract.transfer(_investor1.address, tokenInvestorStartBalance);
  _tokenContract.transfer(_investor2.address, tokenInvestorStartBalance);
 });

 it('Audit task: Withdrawals and harvests will fail once max supply is reached unless emissions and/or multipliers are set to zero. Users will still be able to emergency withdraw though.', async function () {
  await _tokenContract.connect(_investor1).approve(_poolContract.address, tokenInvestorStartBalance);
  await _tokenContract.connect(_investor2).approve(_poolContract.address, tokenInvestorStartBalance);
  await ethers.provider.send('evm_setAutomine', [false]);
  await _poolContract.connect(_investor1).deposit(poolOurId, tokenInvestorStartBalance);
  await _poolContract.connect(_investor2).deposit(poolOurId, tokenInvestorStartBalance);
  await ethers.provider.send('evm_setAutomine', [true]);

  const blocks = BigNumber.from(poolTokens).div(BigNumber.from(poolTokensOPerBlock)).add(1000);
  const timeInBlocksHex = BigNumber.from(blocks).toHexString().replace(/0x0+/, '0x');
  await ethers.provider.send('hardhat_mine', [timeInBlocksHex]);

  const expectedBalance = tokenInvestorStartBalance.add(BigNumber.from(poolTokens).div(2));
  await _poolContract.connect(_investor1).withdraw(poolOurId, tokenInvestorStartBalance);
  await _poolContract.connect(_investor2).withdraw(poolOurId, tokenInvestorStartBalance);

  console.log("Pool tokens:                       ", poolTokens);
  console.log("Investor start balance:            ", tokenInvestorStartBalance);
  console.log("Investor1 balance after withdraw:  ", await _tokenContract.balanceOf(_investor1.address));
  console.log("Investor2 balance after withdraw:  ", await _tokenContract.balanceOf(_investor2.address));
  expect(await _tokenContract.balanceOf(_investor1.address)).to.eq(expectedBalance);
  expect(await _tokenContract.balanceOf(_investor2.address)).to.eq(expectedBalance);
 });

});