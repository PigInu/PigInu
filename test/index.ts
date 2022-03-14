import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Airdrop,
  LiquidityManager,
  Pool,
  Presale,
  Token,
  Stablecoin,
  UniswapV2RouterMock,
  UniswapV2FactoryMock,
} from "../typechain";
import { BigNumber } from "ethers";

describe("Token tests", function () {
  let _owner: SignerWithAddress;
  let _recipient: SignerWithAddress;
  let _developer: SignerWithAddress;
  let _taxExcluded: SignerWithAddress;
  let _burn: SignerWithAddress;

  let _tokenContract: Token;

  const tokenOurName = "Test token";
  const tokenOurSymbol = "TEST";
  const tokenOurSupply = 10000000; // 10 000 000 tokens
  const tokenOurDecimals = 18;
  const tokenOurBurnFee = 2;
  const tokenOurDevFee = 3;

  beforeEach(async function () {
    [_owner, _recipient, _developer, _taxExcluded, _burn] =
      await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    _tokenContract = await Token.deploy(
      tokenOurName,
      tokenOurSymbol,
      tokenOurSupply,
      tokenOurDecimals,
      tokenOurDevFee,
      tokenOurBurnFee,
      _burn.address
    );
    await _tokenContract.deployed();
    await _tokenContract.setDevAddress(_developer.address);
  });

  it("Should set DevAddress", async function () {
    await _tokenContract.setDevAddress(_owner.address);
    expect(await _tokenContract.devAddress()).to.be.equal(_owner.address);
  });

  it("Should set TaxExclusion", async function () {
    await _tokenContract.setTaxExclusion(_taxExcluded.address, true);
    expect(await _tokenContract.excludedFromTax(_taxExcluded.address)).to.be
      .true;
  });

  it("Should unset TaxExclusion", async function () {
    await _tokenContract.setTaxExclusion(_owner.address, false);
    expect(await _tokenContract.excludedFromTax(_owner.address)).to.be.false;
  });

  it("Should transfer with fee", async function () {
    await _tokenContract.setTaxExclusion(_owner.address, false);

    const transferAmount = 100;
    const burnAmount = (100 * tokenOurBurnFee) / 100;
    const devAmount = (100 * tokenOurDevFee) / 100;
    const recipientAmount = transferAmount - burnAmount - devAmount;

    await _tokenContract.transfer(_recipient.address, transferAmount);
    expect(await _tokenContract.balanceOf(_recipient.address)).to.be.equal(
      recipientAmount
    );
    expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(
      burnAmount
    );
    expect(await _tokenContract.balanceOf(_developer.address)).to.be.equal(
      devAmount
    );
  });

  it("Should transfer without fee", async function () {
    const transferAmount = 100;
    const burnAmount = 0;
    const devAmount = 0;
    const recipientAmount = transferAmount - burnAmount - devAmount;

    await _tokenContract.transfer(_recipient.address, transferAmount);
    expect(await _tokenContract.balanceOf(_recipient.address)).to.be.equal(
      recipientAmount
    );
    expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(
      burnAmount
    );
    expect(await _tokenContract.balanceOf(_developer.address)).to.be.equal(
      devAmount
    );
  });
});

describe("Airdrop tests", function () {
  let _owner: SignerWithAddress;
  let _developer: SignerWithAddress;
  let _taxExcluded: SignerWithAddress;
  let _burn: SignerWithAddress;

  let _tokenContract: Token;
  let _airdropContract: Airdrop;

  const tokenOurName = "Test token";
  const tokenOurSymbol = "TEST";
  const tokenOurSupply = 10000000; // 10 000 000 tokens
  const tokenOurDecimals = 18;
  const tokenOurBurnFee = 2;
  const tokenOurDevFee = 3;
  const airdropAmount = "1000000000000000000"; // 1 token
  const airdropMinBaseCoinBalance = "1000000000000000000"; // 0.1 BNB / MATIC / etc...
  const airdropTime = 900; // 15 minutes

  beforeEach(async function () {
    [_owner, _developer, _taxExcluded, _burn] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    _tokenContract = await Token.deploy(
      tokenOurName,
      tokenOurSymbol,
      tokenOurSupply,
      tokenOurDecimals,
      tokenOurDevFee,
      tokenOurBurnFee,
      _burn.address
    );
    await _tokenContract.deployed();
    await _tokenContract.setDevAddress(_developer.address);
    await _tokenContract.setTaxExclusion(_taxExcluded.address, true);

    const Airdrop = await ethers.getContractFactory("Airdrop");
    _airdropContract = await Airdrop.deploy(
      _tokenContract.address,
      _burn.address,
      airdropAmount,
      airdropMinBaseCoinBalance
    );
    await _airdropContract.deployed();
    await _tokenContract.setTaxExclusion(_airdropContract.address, true);

    await _tokenContract.transfer(
      _airdropContract.address,
      "2000000000000000000"
    ); // 2 tokens

    await ethers.provider.send("hardhat_setBalance", [
      _owner.address,
      "0x10000000000000000",
    ]);
  });

  it("Should claim", async function () {
    expect(await _tokenContract.balanceOf(_taxExcluded.address)).to.be.equal(0);
    await _airdropContract.start(airdropTime);

    expect(await _airdropContract.connect(_taxExcluded).claim())
      .to.emit(_airdropContract, "eventClaimed")
      .withArgs(_taxExcluded.address, airdropAmount);

    expect(await _airdropContract.addressReceived(_taxExcluded.address)).to.be
      .true;
    expect(await _airdropContract.claimCount()).to.be.equal(1);
    expect(await _airdropContract.totalClaimed()).to.be.equal(airdropAmount);
    expect(await _tokenContract.balanceOf(_taxExcluded.address)).to.be.equal(
      airdropAmount
    );
  });

  it("Should revert claim - Airdrop has not started yet", async function () {
    await expect(_airdropContract.claim()).to.be.revertedWith(
      "claim: Airdrop has not started yet"
    );
  });

  it("Should revert claim - Airdrop has ended already", async function () {
    await _airdropContract.start(airdropTime);
    await ethers.provider.send("evm_increaseTime", [airdropTime * 60]);
    await expect(_airdropContract.claim()).to.be.revertedWith(
      "claim: Airdrop has ended already"
    );
  });

  it("Should revert claim - Your address have already claimed your tokens", async function () {
    await _airdropContract.start(airdropTime);
    await _airdropContract.claim();
    await expect(_airdropContract.claim()).to.be.revertedWith(
      "claim: Your address have already claimed your tokens"
    );
  });

  it("Should revert claim - Your wallet address does not have enough base coin", async function () {
    await _airdropContract.start(airdropTime);
    await ethers.provider.send("hardhat_setBalance", [
      _owner.address,
      "0x100000000000000",
    ]);
    await expect(_airdropContract.claim()).to.be.revertedWith(
      "claim: Your wallet address does not have enough base coin"
    );
  });

  it("Should burn remaining tokens", async function () {
    await _airdropContract.start(airdropTime);
    await _airdropContract.claim();
    await ethers.provider.send("evm_increaseTime", [airdropTime * 60]);

    expect(await _airdropContract.burnRemainingTokens())
      .to.emit(_airdropContract, "eventBurnRemainingTokens")
      .withArgs(airdropAmount);

    expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(
      airdropAmount
    );
  });

  it("Should revert burn - Airdrop has not started yet", async function () {
    await expect(_airdropContract.burnRemainingTokens()).to.be.revertedWith(
      "burnRemainingTokens: Airdrop has not started yet"
    );
  });

  it("Should revert burn - Airdrop has not ended yet", async function () {
    await _airdropContract.start(airdropTime);
    await expect(_airdropContract.burnRemainingTokens()).to.be.revertedWith(
      "burnRemainingTokens: Airdrop has not ended yet"
    );
  });
});

describe("Presale tests", function () {
  let _owner: SignerWithAddress;
  let _developer: SignerWithAddress;
  let _burn: SignerWithAddress;

  let _tokenContract: Token;
  let _stablecoinContract: Stablecoin;
  let _lpTokenContract: Stablecoin;
  let _presaleContract: Presale;
  let _liquidityManagerContract: LiquidityManager;
  let _uniswapV2RouterMockContract: UniswapV2RouterMock;
  let _uniswapV2FactoryMockContract: UniswapV2FactoryMock;

  const tokenOurName = "Test token";
  const tokenOurSymbol = "TEST";
  const tokenOurSupply = 10000000; // 10 000 000 tokens
  const tokenOurDecimals = 18;
  const tokenOurBurnFee = 2;
  const tokenOurDevFee = 3;
  const presalePricePresale = "1000000000000000000"; // 1 USD
  const presalePriceLiquidity = "2000000000000000000"; // 2 USD
  const presaleDepositTime = "300"; // 5 minutes
  const presaleDepositTimeInMinutes = 5;
  const presaleClaimTime = "300"; // 5 minutes
  const presaleClaimTimeInMinutes = 5;
  const presaleDepositOwnAmount = "2000000000000000000";
  const presaleDepositAmount = "1000000000000000000";
  const stablecoinAmount = "2000000000000000000"; // 2 USD

  beforeEach(async function () {
    [_owner, _developer, _burn] = await ethers.getSigners();

    const LpToken = await ethers.getContractFactory("Stablecoin");
    _lpTokenContract = await LpToken.deploy();
    await _lpTokenContract.deployed();

    const UniswapV2FactoryMock = await ethers.getContractFactory(
      "UniswapV2FactoryMock"
    );
    _uniswapV2FactoryMockContract = await UniswapV2FactoryMock.deploy(
      _lpTokenContract.address
    );
    await _uniswapV2FactoryMockContract.deployed();

    const UniswapV2RouterMock = await ethers.getContractFactory(
      "UniswapV2RouterMock"
    );
    _uniswapV2RouterMockContract = await UniswapV2RouterMock.deploy(
      _uniswapV2FactoryMockContract.address
    );
    await _uniswapV2RouterMockContract.deployed();

    const LiquidityManager = await ethers.getContractFactory(
      "LiquidityManager"
    );
    _liquidityManagerContract = await LiquidityManager.deploy();
    await _liquidityManagerContract.deployed();

    const Stablecoin = await ethers.getContractFactory("Stablecoin");
    _stablecoinContract = await Stablecoin.deploy();
    await _stablecoinContract.deployed();
    await _stablecoinContract.mint(_owner.address, stablecoinAmount);

    const Token = await ethers.getContractFactory("Token");
    _tokenContract = await Token.deploy(
      tokenOurName,
      tokenOurSymbol,
      tokenOurSupply,
      tokenOurDecimals,
      tokenOurDevFee,
      tokenOurBurnFee,
      _burn.address
    );
    await _tokenContract.deployed();
    await _tokenContract.setDevAddress(_developer.address);

    const Presale = await ethers.getContractFactory("Presale");
    _presaleContract = await Presale.deploy(
      _tokenContract.address,
      _stablecoinContract.address,
      _uniswapV2RouterMockContract.address,
      _developer.address,
      _burn.address,
      presalePricePresale,
      presalePriceLiquidity,
      presaleDepositTime,
      presaleClaimTime,
      _liquidityManagerContract.address
    );
    await _presaleContract.deployed();
    await _tokenContract.setTaxExclusion(_presaleContract.address, true);
    await _tokenContract.setTaxExclusion(_owner.address, true);
  });

  it("Should revert deposit own token - Allowance is too low", async function () {
    await expect(
      _presaleContract.depositOwn(presaleDepositOwnAmount)
    ).to.be.revertedWith("depositOwn: Allowance is too low");
  });

  it("Should deposit own token", async function () {
    expect(
      await _tokenContract.balanceOf(_presaleContract.address)
    ).to.be.equal(0);
    await _tokenContract.approve(
      _presaleContract.address,
      presaleDepositOwnAmount
    );
    await _presaleContract.depositOwn(presaleDepositOwnAmount);
    expect(await _presaleContract.ownBalance()).to.be.equal(
      presaleDepositOwnAmount
    );
    expect(
      await _tokenContract.balanceOf(_presaleContract.address)
    ).to.be.equal(presaleDepositOwnAmount);
  });

  it("Should revert deposit - Allowance is too low", async function () {
    await expect(
      _presaleContract.deposit(presaleDepositAmount)
    ).to.be.revertedWith("deposit: Allowance is too low");
  });

  it("Should revert deposit - Deposit period already timed out", async function () {
    await _stablecoinContract.approve(
      _presaleContract.address,
      presaleDepositAmount
    );
    await ethers.provider.send("evm_increaseTime", [
      presaleDepositTimeInMinutes * 60,
    ]);
    await expect(
      _presaleContract.deposit(presaleDepositAmount)
    ).to.be.revertedWith("deposit: Deposit period already timed out");
  });

  it("Should revert deposit - Maximum deposit amount exceeded", async function () {
    await _stablecoinContract.approve(
      _presaleContract.address,
      presaleDepositAmount
    );
    await expect(
      _presaleContract.deposit(presaleDepositAmount)
    ).to.be.revertedWith("deposit: Maximum deposit amount exceeded");
  });

  it("Should deposit", async function () {
    await _tokenContract.approve(
      _presaleContract.address,
      presaleDepositOwnAmount
    );
    await _presaleContract.depositOwn(presaleDepositOwnAmount);

    await _stablecoinContract.approve(
      _presaleContract.address,
      presaleDepositAmount
    );

    expect(await _presaleContract.deposit(presaleDepositAmount))
      .to.emit(_presaleContract, "eventDeposited")
      .withArgs(_owner.address, presaleDepositAmount);

    expect(await _presaleContract.deposited(_owner.address)).to.be.equal(
      presaleDepositAmount
    );
    expect(await _presaleContract.claimable(_owner.address)).to.be.equal(
      presaleDepositAmount
    );
    expect(await _presaleContract.totalDeposited()).to.be.equal(
      presaleDepositAmount
    );
    expect(await _presaleContract.totalClaimable()).to.be.equal(
      presaleDepositAmount
    );
    expect(await _presaleContract.totalClaimableNotDeducted()).to.be.equal(
      presaleDepositAmount
    );
  });

  it("Should revert burn - Claim period did not timed out yet", async function () {
    await _tokenContract.approve(
      _presaleContract.address,
      presaleDepositOwnAmount
    );
    await _presaleContract.depositOwn(presaleDepositOwnAmount);

    await _stablecoinContract.approve(
      _presaleContract.address,
      presaleDepositAmount
    );
    await _presaleContract.deposit(presaleDepositAmount);

    await ethers.provider.send("evm_increaseTime", [
      presaleDepositTimeInMinutes * 60,
    ]);

    await expect(_presaleContract.burnRemainingTokens()).to.be.revertedWith(
      "burnRemainingTokens: Claim period did not timed out yet"
    );
  });

  it("Should burn remaining tokens", async function () {
    await _tokenContract.approve(
      _presaleContract.address,
      presaleDepositOwnAmount
    );
    await _presaleContract.depositOwn(presaleDepositOwnAmount);

    await _stablecoinContract.approve(
      _presaleContract.address,
      presaleDepositAmount
    );
    await _presaleContract.deposit(presaleDepositAmount);

    await ethers.provider.send("evm_increaseTime", [
      presaleDepositTimeInMinutes * 60,
    ]);

    await ethers.provider.send("evm_increaseTime", [
      presaleClaimTimeInMinutes * 60,
    ]);

    expect(await _presaleContract.burnRemainingTokens())
      .to.emit(_presaleContract, "eventBurnRemainingTokens")
      .withArgs(presaleDepositOwnAmount);

    expect(await _tokenContract.balanceOf(_burn.address)).to.be.equal(
      presaleDepositOwnAmount
    );
  });

  it("Should revert claim - Deposit period did not timed out yet", async function () {
    await expect(_presaleContract.claim()).to.be.revertedWith(
      "claim: Deposit period did not timed out yet"
    );
  });

  it("Should revert claim - Claim period already timed out", async function () {
    await ethers.provider.send("evm_increaseTime", [
      presaleDepositTimeInMinutes * 60,
    ]);

    await ethers.provider.send("evm_increaseTime", [
      presaleClaimTimeInMinutes * 60,
    ]);

    await expect(_presaleContract.claim()).to.be.revertedWith(
      "claim: Claim period already timed out"
    );
  });

  it("Should claim", async function () {
    await _tokenContract.approve(
      _presaleContract.address,
      presaleDepositOwnAmount
    );
    await _presaleContract.depositOwn(presaleDepositOwnAmount);

    await _stablecoinContract.approve(
      _presaleContract.address,
      presaleDepositAmount
    );

    await _presaleContract.deposit(presaleDepositAmount);

    await ethers.provider.send("evm_increaseTime", [
      presaleDepositTimeInMinutes * 60,
    ]);

    expect(await _presaleContract.claim())
      .to.emit(_presaleContract, "eventClaimed")
      .withArgs(_owner.address, presaleDepositAmount);

    expect(await _presaleContract.claimed(_owner.address)).to.be.equal(
      presaleDepositAmount
    );
    expect(await _presaleContract.claimable(_owner.address)).to.be.equal(0);
    expect(await _presaleContract.totalClaimed()).to.be.equal(
      presaleDepositAmount
    );
    expect(await _presaleContract.totalClaimable()).to.be.equal(0);
  });
});

describe("Pool tests", function () {
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

  const tokenOurName = "Test token";
  const tokenOurSymbol = "TEST";
  const tokenOurSupply = 10000000; // 10 000 000 tokens
  const tokenOurDecimals = 18;
  const tokenOurBurnFee = 2;
  const tokenOurDevFee = 3;
  let tokenOwnerStartBalance: BigNumber;
  const poolTokens = "2000000000000000000000000"; // 7 500 000 tokens
  const poolTokenStartDeposit = "10000000000000000000"; // 10 tokens
  const poolTokensDeposit = "1000000000000000000"; // 1 token
  const poolTokensOurPerBlock = "100000000000000000"; // 0.1 tokens / block
  const poolTokensUSDPerBlock = "200000000000000000"; // 0.2 tokens / block
  const poolTokensOurLPPerBlock = "300000000000000000"; // 0.3 tokens / block
  const poolPendingTokensFirstBlock = "49999000000";
  const poolPendingTokensSecondBlock = "99999000000";
  const poolOurId = 0;
  const poolTheirId = 1;
  const poolTheirDepositFee = 400;
  const stablecoinAmount = "2000000000000000000"; // 2 USD

  beforeEach(async function () {
    [_owner, _developer, _burn] = await ethers.getSigners();

    const LpToken = await ethers.getContractFactory("Stablecoin");
    _lpTokenContract = await LpToken.deploy();
    await _lpTokenContract.deployed();
    await _lpTokenContract.mint(_owner.address, stablecoinAmount);

    const UniswapV2FactoryMock = await ethers.getContractFactory(
      "UniswapV2FactoryMock"
    );
    _uniswapV2FactoryMockContract = await UniswapV2FactoryMock.deploy(
      _lpTokenContract.address
    );
    await _uniswapV2FactoryMockContract.deployed();

    const UniswapV2RouterMock = await ethers.getContractFactory(
      "UniswapV2RouterMock"
    );
    _uniswapV2RouterMockContract = await UniswapV2RouterMock.deploy(
      _uniswapV2FactoryMockContract.address
    );
    await _uniswapV2RouterMockContract.deployed();

    const Stablecoin = await ethers.getContractFactory("Stablecoin");
    _stablecoinContract = await Stablecoin.deploy();
    await _stablecoinContract.deployed();
    await _stablecoinContract.mint(_owner.address, stablecoinAmount);

    const Token = await ethers.getContractFactory("Token");
    _tokenContract = await Token.deploy(
      tokenOurName,
      tokenOurSymbol,
      tokenOurSupply,
      tokenOurDecimals,
      tokenOurDevFee,
      tokenOurBurnFee,
      _burn.address
    );
    await _tokenContract.deployed();
    await _tokenContract.setDevAddress(_developer.address);
    await _tokenContract.setTaxExclusion(_owner.address, true);

    const Pool = await ethers.getContractFactory("Pool");
    _poolContract = await Pool.deploy(_developer.address);
    await _poolContract.deployed();
    await _tokenContract.transfer(_poolContract.address, poolTokens);

    const LiquidityManager = await ethers.getContractFactory(
      "LiquidityManager"
    );
    _liquidityManagerContract = await LiquidityManager.deploy();
    await _liquidityManagerContract.deployed();
    _pairAddress = await _liquidityManagerContract.callStatic.createPair(
      _uniswapV2RouterMockContract.address,
      _tokenContract.address,
      _stablecoinContract.address
    );

    await _poolContract.createPool(
      _tokenContract.address,
      _tokenContract.address,
      poolTokensOurPerBlock,
      0
    );
    await _poolContract.createPool(
      _stablecoinContract.address,
      _stablecoinContract.address,
      poolTokensUSDPerBlock,
      400
    );
    await _poolContract.createPool(
      _pairAddress,
      _tokenContract.address,
      poolTokensOurLPPerBlock,
      0
    );
    await _poolContract.start();

    tokenOwnerStartBalance = await _tokenContract.balanceOf(_owner.address);
  });

  it("Should deposit with no fee", async function () {
    await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
    expect(await _poolContract.deposit(poolOurId, poolTokensDeposit))
      .to.emit(_poolContract, "eventDeposit")
      .withArgs(_owner.address, poolOurId, poolTokensDeposit);

    expect(
      (await _poolContract.users(poolOurId, _owner.address)).amount
    ).to.be.equal(poolTokensDeposit);

    expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(
      tokenOwnerStartBalance.sub(poolTokensDeposit)
    );
    expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(
      BigNumber.from(poolTokens).add(poolTokensDeposit)
    );
  });

  it("Should deposit with fee", async function () {
    await _stablecoinContract.approve(_poolContract.address, poolTokensDeposit);
    expect(await _poolContract.deposit(poolTheirId, poolTokensDeposit))
      .to.emit(_poolContract, "eventDeposit")
      .withArgs(_owner.address, poolTheirId, poolTokensDeposit);

    const depositFee = BigNumber.from(poolTokensDeposit)
      .mul(poolTheirDepositFee)
      .div(10000);

    expect(
      (await _poolContract.users(poolTheirId, _owner.address)).amount
    ).to.be.equal(BigNumber.from(poolTokensDeposit).sub(depositFee));

    expect(await _stablecoinContract.balanceOf(_owner.address)).to.be.equal(
      BigNumber.from(stablecoinAmount).sub(poolTokensDeposit)
    );

    expect(
      await _stablecoinContract.balanceOf(_poolContract.address)
    ).to.be.equal(BigNumber.from(poolTokensDeposit).sub(depositFee));
  });

  it("Should return pending tokens", async function () {
    await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
    await _poolContract.deposit(poolOurId, poolTokensDeposit);

    await ethers.provider.send("evm_mine", []);
    await expect(
      await _poolContract.pendingTokens(poolOurId, _owner.address)
    ).to.be.equal(poolPendingTokensFirstBlock);

    await ethers.provider.send("evm_mine", []);
    await expect(
      await _poolContract.pendingTokens(poolOurId, _owner.address)
    ).to.be.equal(poolPendingTokensSecondBlock);
  });

  it("Should withdraw", async function () {
    await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
    await _poolContract.deposit(poolOurId, poolTokensDeposit);
    await ethers.provider.send("evm_mine", []);
    const amountToWithdraw = await _poolContract.pendingTokens(
      0,
      _owner.address
    );

    expect(await _poolContract.withdraw(0, amountToWithdraw))
      .to.emit(_poolContract, "eventWithdraw")
      .withArgs(_owner.address, poolOurId, amountToWithdraw);

    expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(
      tokenOwnerStartBalance.sub(poolTokensDeposit).add(amountToWithdraw)
    );
    expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(
      BigNumber.from(poolTokens).add(poolTokensDeposit).sub(amountToWithdraw)
    );
  });

  it("Should emergency withdraw", async function () {
    await _tokenContract.approve(_poolContract.address, poolTokensDeposit);
    await _poolContract.deposit(poolOurId, poolTokensDeposit);
    await ethers.provider.send("evm_mine", []);
    const amountToWithdraw = (
      await _poolContract.users(poolOurId, _owner.address)
    ).amount;

    expect(await _poolContract.emergencyWithdraw(0))
      .to.emit(_poolContract, "eventEmergencyWithdraw")
      .withArgs(_owner.address, poolOurId, amountToWithdraw);

    expect(await _tokenContract.balanceOf(_owner.address)).to.be.equal(
      tokenOwnerStartBalance.sub(poolTokensDeposit).add(amountToWithdraw)
    );

    expect(await _tokenContract.balanceOf(_poolContract.address)).to.be.equal(
      BigNumber.from(poolTokens).add(poolTokensDeposit).sub(amountToWithdraw)
    );
    const user = await _poolContract.users(poolOurId, _owner.address);
    expect(user.amount).to.be.equal(0);
    expect(user.rewardDebt).to.be.equal(0);
  });
});

// test
