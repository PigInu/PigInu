// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./libs/IUniswapV2Router.sol";
import "./libs/IUniswapV2Factory.sol";

contract LiquidityManager {
  address public burnAddress = 0x000000000000000000000000000000000000dEaD;

  function createPair(
    address _routerAddress,
    address _tokenA,
    address _tokenB
  ) public returns (address) {
    address factory = IUniswapV2Router(_routerAddress).factory();
    return
      IUniswapV2Factory(factory).createPair(address(_tokenA), address(_tokenB));
  }

  function getLiquidityCreated(
    address _routerAddress,
    address _tokenA,
    address _tokenB
  ) public view returns (bool) {
    address factory = IUniswapV2Router(_routerAddress).factory();
    return (
      IUniswapV2Factory(factory).getPair(address(_tokenA), address(_tokenB)) ==
        address(0)
        ? false
        : true
    );
  }

  function getPairAddress(
    address _routerAddress,
    address _tokenA,
    address _tokenB
  ) public view returns (address) {
    address factory = IUniswapV2Router(_routerAddress).factory();
    return
      IUniswapV2Factory(factory).getPair(address(_tokenA), address(_tokenB));
  }
}
