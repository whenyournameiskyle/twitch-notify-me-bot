require('dotenv').config()
const request = require('request-promise')
const TwitchJS = require('twitch-js')
const { EVENT_NAME, IFTTT_KEY, TWITCH_CODE, TWITCH_NAME } = process.env

let Bot
const ignoredUsers = [TWITCH_NAME, 'nightbot']
const monitoredChannels = [] // array of string channel names (each needs to start with a # eg #ninja)
const monitoredTerms = [TWITCH_NAME] // or any additional terms you care about
const opts = {
  identity: {
    username: TWITCH_NAME,
    password: TWITCH_CODE
  },
  channels: [ ], // array of string channel names to join on connect (each without a # eg ninja)
  reconnect: true,
  maxReconnectAttempts: 5
}

function onChatHandler (channel, userstate = {}, message, self) {
  const user = userstate.username

  if (ignoredUsers.includes(user)) return

  if (isInMonitoredChannel(channel) || includesMonitoredTerm(message)) {
    const totalMessage = `${channel}:\t${user}: ${message}\n`
    return sendMessage(totalMessage)
  }
}

function runBot () {
  Bot = new TwitchJS.client(opts)

  Bot.on('connected', onConnectedHandler)
  Bot.on('disconnected', onDisconnectedHandler)
  Bot.on('chat', onChatHandler)

  Bot.connect()
}

function onConnectedHandler (addr, port) {
  console.info(`Connected to Twitch ${addr}:${port}`)
}

function onDisconnectedHandler (reason) {
  console.info(`Disconnected. Reason: ${reason}`)
  process.exit(1)
}

function sendMessage (message) {
  try {
    const url = `https://maker.ifttt.com/trigger/${EVENT_NAME}/with/key/${IFTTT_KEY}`
    return request(url, {
      body: { value1: message },
      json: true,
      method: 'POST'
    })
  } catch (e) {
    console.error(e)
  }
}

module.exports = runBot()

function isInMonitoredChannel (channel) {
  return monitoredChannels.includes(channel)
}

function includesMonitoredTerm (message) {
  return monitoredTerms.some(function (term) {
    return message.match(term)
  })
}
