// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IUniswapV2Router {
  function factory() external view returns (address);
  function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity);
}

contract UniswapV2RouterMock is IUniswapV2Router {
  address private _factoryAddress;
  address private _tokenA;
  address private _tokenB;
  uint private _amountADesired;
  uint private _amountBDesired;
  uint private _amountAMin;
  uint private _amountBMin;
  address private _to;
  uint private _deadline;

  constructor(address factoryAddress) {
    _factoryAddress = factoryAddress;
  }

  function factory() external view returns (address) {
    return _factoryAddress;
  }

  function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity) {
    _tokenA = tokenA;
    _tokenB = tokenB;
    _amountADesired = amountADesired;
    _amountBDesired = amountBDesired;
    _amountAMin = amountAMin;
    _amountBMin = amountBMin;
    _to = to;
    _deadline = deadline;
    return (1, 1, 1);
  }
}
