const {ethers} = require("ethers")
const LPABI = require("./abi/dai-ohm-lp.json")

const daiEth = "0xc3d03e4f041fd4cd388c549ee2a29a9e5075882f"
const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_URL)

async function formatUSD(value) {
  return `$${(Math.round(value*100)/100).toLocaleString("en-US")}`
}

async function getReserves(contractAddress) {
  const lp = new ethers.Contract(contractAddress, LPABI, provider)
  const [reserve0, reserve1] = await lp.getReserves()
  return [reserve0, reserve1]
}

function getQuote(amount, reserve0, reserve1) {
  return amount * reserve1 / reserve0
}

async function getQuoteFromLP(lpAddress) {
  const [reserve0, reserve1] = await getReserves(lpAddress)
  return getQuote(1, reserve0, reserve1)
}

module.exports = {
  provider, 
  daiEth, 
  getQuoteFromLP,
  formatUSD
}