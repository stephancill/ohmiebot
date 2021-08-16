const {ethers} = require("ethers")
const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/f29f1c340a60430ebff33f1ed9dad190")

module.exports = {
  provider
}