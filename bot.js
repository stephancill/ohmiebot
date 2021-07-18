require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")
const util = require("./util")

const token = process.env.BOT_TOKEN
const bot = new TelegramBot(token, {polling: true})

const genericCommandMatcher = /(?<prefix>(?:^|^[\s\n\t\r]+)\/(?:[\s\n\t\r]*)|(?<=[\s\n\t\r])\.:(?:[\s\n\t\r]*)|(?<=[\s\n\t\r])::(?:[\s\n\t\r]*))(?<command>[a-zA-Z0-9]+)(?:[\s\n\t\r]*)(?<arguments>[^]*?(?=(?<=[\s\n\t\r])\.:|(?<=[\s\n\t\r])::|$))/
bot.onText(genericCommandMatcher, (msg, match) => {
  console.log(match.groups.command)
  
  const command = match.groups.command
  const params = match.groups.arguments.split(" ")
  const chatId = msg.chat.id

  try {
    util[command](...params).then(r => {
      const wrapped = {result: r}

      console.log(JSON.stringify(wrapped.result, null, "\t"))

      bot.sendMessage(chatId, JSON.stringify(wrapped.result, null, "\t"))
    }).catch(() => {
      bot.sendMessage(chatId, "Unknown command")
    })
  } catch (error) {
    bot.sendMessage(chatId, "Unknown command")
  }
})

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", (msg) => {
  const chatId = msg.chat.id

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, "Processing...")
})