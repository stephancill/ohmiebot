require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")
const util = require("./util")

const botOptions = (process.env.DEBUG || "").toLowerCase() === "true" ? {
  polling: true
} : {
  webHook: {
    port: process.env.PORT,
  }
}

if (botOptions.polling) {
  console.log("Polling")
} else {
  console.log("Webhook")
}

const token = process.env.BOT_TOKEN
const url = process.env.APP_URL;
const bot = new TelegramBot(token, botOptions)

bot.setWebHook(`${url}/bot${token}`)

function deleteProcessingMessage(chatId, messagePromise) {
  messagePromise.then(m => {
    bot.deleteMessage(chatId, m.message_id)
  })
}

const genericCommandMatcher = /(?<prefix>(?:^|^[\s\n\t\r]+)\/(?:[\s\n\t\r]*)|(?<=[\s\n\t\r])\.:(?:[\s\n\t\r]*)|(?<=[\s\n\t\r])::(?:[\s\n\t\r]*))(?<command>[a-zA-Z0-9]+)(?:[\s\n\t\r]*)(?<arguments>[^]*?(?=(?<=[\s\n\t\r])\.:|(?<=[\s\n\t\r])::|$))/
bot.onText(genericCommandMatcher, (msg, match) => {
  console.log(match.groups.command)
  
  const command = match.groups.command
  const params = match.groups.arguments.split(" ")
  const chatId = msg.chat.id

  if (!(command in util)) {
    return
  }

  const processingPromise = bot.sendMessage(chatId, "Processing...")

  util[command](...params).then(r => {
    const wrapped = {result: r}

    console.log(JSON.stringify(wrapped.result, null, "\t"))

    bot.sendMessage(chatId, JSON.stringify(wrapped.result, null, "\t")).then(() => {
      deleteProcessingMessage(chatId, processingPromise)
    })
  }).catch(() => {
    bot.sendMessage(chatId, "Unknown command").then(() => {
      deleteProcessingMessage(chatId, processingPromise)
    })
  })
})