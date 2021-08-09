const {ethers} = require("ethers")
const helpers = require("./helpers")

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

async function getStakingStats(address) {
  const stakingContract = new ethers.Contract("0xFd31c7d00Ca47653c6Ce64Af53c1571f9C36566a", stakingABI, provider);
  const sohmMainContract = new ethers.Contract(sOHMAddress, sOHMABI, provider);
  // Calculating staking
  const epoch = await stakingContract.epoch();
  const stakingReward = epoch.distribute;

  const circ = await sohmMainContract.circulatingSupply();
  const stakingRebase = stakingReward / circ;
  const fiveDayRate = Math.pow(1 + stakingRebase, 5 * 3) - 1;
  const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;

  let res = {stakingRebase, fiveDayRate, stakingAPY}

  if (address) {
    const ohmBalance = await getOhmBalance(address)
    res["nextReward"] = ohmBalance * stakingRebase
  }

  return res
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

async function getOhmBalanceAfterDays(address, days, apy) {
  let rebaseRate
  if (apy) {
    rebaseRate = Math.log(apy/100)/(3*365)
  } else {
    const stakingStats = await getStakingStats()
    rebaseRate = stakingStats.stakingRebase
    apy = Math.exp(rebaseRate * 3 * 365)*100 
  }
  if (!days) {
    days = 30
  }

  const ohmBalance = await getOhmBalance(address)

  return {days, apy, ohmBalance: ohmBalance * Math.pow(1+rebaseRate, days*3)}
}

async function getEthValueAfterDays(address, days, apy) {
  const {OHM_ETH} = await getOhmPrice()
  const balanceAfterDays = await getOhmBalanceAfterDays(address, days, apy)
  const ethValue = OHM_ETH * balanceAfterDays.ohmBalance
  
  return {ethValue, ...balanceAfterDays}
}

async function daysToGetEthValue(address, ethValue) {
  const ohmBalance = await getOhmBalance(address)
  const {OHM_ETH} = await getOhmPrice()
  const {stakingRebase} = await getStakingStats()
  const requiredOhmBalance = ethValue / OHM_ETH
  
  const days = Math.log(requiredOhmBalance/ohmBalance) / Math.log(1+stakingRebase) / 3
  let targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + Math.round(days))

  return {ethValue, days, targetDate, ohmBalance, requiredOhmBalance, stakingRebase, OHM_ETH}
}

async function daysToGetOhmBalance(address, requiredOhmBalance) {
  const ohmBalance = await getOhmBalance(address)
  const {stakingRebase} = await getStakingStats()
  
  const days = Math.log(requiredOhmBalance/ohmBalance) / Math.log(1+stakingRebase) / 3
  let targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + Math.round(days))

  return {requiredOhmBalance, days, targetDate, ohmBalance, stakingRebase}
}

async function getOhmBalance(address) {
  const balance = await getBalance(address, sOHMAddress)
  return balance / Math.pow(10, 9)
}

async function timeUntilRebase() {
  const currentBlock = await provider.getBlockNumber()
  const rebaseBlock = helpers.getRebaseBlock(currentBlock)
  const seconds = helpers.secondsUntilBlock(currentBlock, rebaseBlock)
  return helpers.prettifySeconds(seconds)
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

module.exports = {getStakedOhmEthValue, getStakingStats, getOhmPrice, getOhmBalance, timeUntilRebase, getOhmBalanceAfterDays, getEthValueAfterDays, daysToGetEthValue, daysToGetOhmBalance}

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error)
//     process.exit(1)
//   })