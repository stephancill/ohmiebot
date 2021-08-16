const {provider} = require("./util")

async function gasPrice() {
  const price = await provider.getGasPrice()
  return `${price.div(Math.pow(10, 9)).toString()} gwei` 
}

module.exports = {
  gasPrice
}