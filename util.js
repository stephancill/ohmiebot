const {ethers} = require("ethers")
const LPABI = require("./abi/dai-ohm-lp.json")
const sOHMABI = require("./abi/sohm.json")
const stakingABI = require("./abi/staking-contract.json")
const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/f29f1c340a60430ebff33f1ed9dad190")
const sOHMAddress = "0x04F2694C8fcee23e8Fd0dfEA1d4f5Bb8c352111F"

async function getReserves(contractAddress) {
  const lp = new ethers.Contract(contractAddress, LPABI, provider)
  const [reserve0, reserve1] = await lp.getReserves()
  return [reserve0, reserve1]
}

async function getBalance(address, contractAddress) {
  const sohm = new ethers.Contract(contractAddress, sOHMABI, provider)
  const balance = await sohm.balanceOf(address)
  return balance
}

function getQuote(amount, reserve0, reserve1) {
  return amount * reserve1 / reserve0
}

async function getQuoteFromLP(lpAddress) {
  const [reserve0, reserve1] = await getReserves(lpAddress)
  return getQuote(1, reserve0, reserve1)
}

async function getStakingStats() {
  const stakingContract = new ethers.Contract("0xFd31c7d00Ca47653c6Ce64Af53c1571f9C36566a", stakingABI, provider);
  const sohmMainContract = new ethers.Contract(sOHMAddress, sOHMABI, provider);
  // Calculating staking
  const epoch = await stakingContract.epoch();
  const stakingReward = epoch.distribute;

  const circ = await sohmMainContract.circulatingSupply();
  const stakingRebase = stakingReward / circ;
  const fiveDayRate = Math.pow(1 + stakingRebase, 5 * 3) - 1;
  const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;

  return {stakingRebase, fiveDayRate, stakingAPY}
}

async function getOhmPrice() {
  const daiQuote = await getQuoteFromLP("0x34d7d7Aaf50AD4944B70B320aCB24C95fa2def7c")
  const ethQuote = await getQuoteFromLP("0xc3d03e4f041fd4cd388c549ee2a29a9e5075882f")
  // 567107172095
  return {
    OHM_DAI: daiQuote / Math.pow(10, 9),
    OHM_ETH: ethQuote * daiQuote / Math.pow(10, 9)
  }
}

async function getStakedOhmEthValue(address) {
  const ohmQuote = await getQuoteFromLP("0x34d7d7Aaf50AD4944B70B320aCB24C95fa2def7c")
  const ethQuote = await getQuoteFromLP("0xc3d03e4f041fd4cd388c549ee2a29a9e5075882f")
  const balance = await getBalance(address, sOHMAddress)

  const daiBalance = balance * ohmQuote
  const ethBalance = ethQuote * daiBalance

  return ethBalance / Math.pow(10, 18)
}

async function main() {
  
  await getStakingStats()
  
}

module.exports = {getStakedOhmEthValue, getStakingStats, getOhmPrice}

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error)
//     process.exit(1)
//   })