// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IUniswapV2Factory {
  event PairCreated(address indexed token0, address indexed token1, address pair, uint);
  function getPair(address tokenA, address tokenB) external view returns (address pair);
  function createPair(address tokenA, address tokenB) external returns (address pair);
}

contract UniswapV2FactoryMock is IUniswapV2Factory {
  address private _lpTokenAddress;
  address private _tokenA;
  address private _tokenB;

  constructor(address lpTokenAddress) {
    _lpTokenAddress = lpTokenAddress;
  }

  function getPair(address tokenA, address tokenB) external view returns (address) {
    tokenA = tokenB;
    return _lpTokenAddress;
  }

  function createPair(address tokenA, address tokenB) external returns (address) {
    _tokenA = tokenA;
    _tokenB = tokenB;
    return _lpTokenAddress;
  }
}