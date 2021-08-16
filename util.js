const {ethers} = require("ethers")
const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER_URL)

module.exports = {
  provider
}