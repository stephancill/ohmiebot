require("dotenv").config()
const replaceAll = require('string.prototype.replaceall')
const TelegramBot = require("node-telegram-bot-api")
const util = require("./ohm-util")

const botOptions = (process.env.DEBUG || "").toLowerCase() === "true" ? {
  polling: true
} : {
  webHook: {
    port: process.env.PORT,
  }
}

const token = process.env.BOT_TOKEN
const url = process.env.APP_URL;
const bot = new TelegramBot(token, botOptions)

if (botOptions.polling) {
  console.log("Polling")
} else {
  console.log("Webhook")
  bot.deleteWebHook().then(() => {
    bot.setWebHook(`${url}/bot${token}`).then(e => {
      console.log(e)
    })
  })
}

function deleteProcessingMessage(chatId, messagePromise) {
  messagePromise.then(m => {
    bot.deleteMessage(chatId, m.message_id)
  })
}

const genericCommandMatcher = /(?<prefix>(?:^|^[\s\n\t\r]+)\/(?:[\s\n\t\r]*)|(?<=[\s\n\t\r])\.:(?:[\s\n\t\r]*)|(?<=[\s\n\t\r])::(?:[\s\n\t\r]*))(?<command>[a-zA-Z0-9]+)(?:[\s\n\t\r]*)(?<arguments>[^]*?(?=(?<=[\s\n\t\r])\.:|(?<=[\s\n\t\r])::|$))/
bot.onText(genericCommandMatcher, (msg, match) => {
  console.log(match.groups.command)
  
  let command = match.groups.command
  const params = match.groups.arguments.split(" ")
  const chatId = msg.chat.id

  command = Object.keys(util).find(element => element.toLowerCase() === command.toLowerCase())

  if (match.groups.command.toLowerCase() === "help") {
    bot.sendMessage(chatId, Object.keys(util).join(", "))
    return
  } else if (!(command in util)) {
    return
  } 

  const processingPromise = bot.sendMessage(chatId, "Processing...")

  util[command](...params).then(r => {
    const wrapped = {result: r}

    let message = replaceAll(replaceAll(replaceAll(JSON.stringify(wrapped.result, null, "\n"), '"', ""), "{", ""), "}", "")

    bot.sendMessage(chatId, message).then(() => {
      deleteProcessingMessage(chatId, processingPromise)
    })
  }).catch((e) => {
    console.log(e)
    bot.sendMessage(chatId, "Unknown command").then(() => {
      deleteProcessingMessage(chatId, processingPromise)
    })
  })
})