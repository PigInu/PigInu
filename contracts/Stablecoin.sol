// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Stablecoin is ERC20 {
  constructor() ERC20('StableCoin', 'SC') {}

  function mint(address account, uint amount) external {
    _mint(account, amount);
  }
}
