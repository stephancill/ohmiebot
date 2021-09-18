const {ethers} = require("ethers")

const balancerVaultABI = require("./abi/balancer-vault.json")
const lbpABI = require("./abi/LiquidityBootstrappingPool.json")

const {provider, formatUSD} = require("./util")

const balancerVaultAddress = "0xba12222222228d8ba445958a75a0704d566bf2c8"
const klimaUsdPoolAddress = "0x6Aa8A7B23F7B3875a966dDCc83D5b675cC9af54B"
const aKlimaAddress = "0x6b4d5e9ec2acea23d4110f4803da99e25443c5df"
const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"

const poolID = "0x6aa8a7b23f7b3875a966ddcc83d5b675cc9af54b00020000000000000000008e"

async function getKlimaPrice() {
  const balancerVault = new ethers.Contract(balancerVaultAddress, balancerVaultABI, provider)
  const klimaTokenInfo = await balancerVault.getPoolTokenInfo(poolID, aKlimaAddress)
  const pool = new ethers.Contract(klimaUsdPoolAddress, lbpABI, provider)
  
  const [tokenWeightIn, tokenWeightOut] = await pool.getNormalizedWeights()
  const [tokenBalanceIn, tokenBalanceOut] = (await balancerVault.getPoolTokens(poolID)).balances
  // const swapFee = await pool.getSwapFeePercentage() / Math.pow(10, 18)

  // console.log(tokenWeightIn.toString(), tokenWeightOut.toString())
  // console.log(tokenBalanceIn.toString(), tokenBalanceOut.toString())

  // uint256 denominator = balanceIn.add(amountIn);
  // uint256 base = balanceIn.divUp(denominator);
  // uint256 exponent = weightIn.divDown(weightOut);
  // uint256 power = base.powUp(exponent);

  // return balanceOut.mulDown(power.complement());

  const denom = tokenBalanceIn + 1 * Math.pow(10, 18)
  const base = tokenBalanceIn / denom
  const exponent = tokenWeightIn / tokenWeightOut
  const power = Math.pow(base, exponent)

  console.log(exponent.toString())
  console.log(base.toString())

  return tokenBalanceOut * (1 - power) // TODO: This is wrong
}

module.exports = {
  getKlimaPrice
}