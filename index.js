'use strict'

const { config } = require('dotenv')
const request = require('request-promise')
const TwitchJs = require('twitch-js').default
const { Chat: { Events: { DISCONNECTED, PARSE_ERROR_ENCOUNTERED, PRIVATE_MESSAGE } } } = TwitchJs

config()

const { EVENT_NAME, IFTTT_KEY } = process.env
const myUsername = '' //assuming you want to join your own channel to monitor, otherwise leave blank
const channelsToJoin = [ myUsername ] // array of any channels you want to monitor
const ignoredUsers = { // users whose messages you don't want notified of
  moobot: true,
  nightbot: true,
  streamelements: true
}
const monitoredChannels = { // channels you want to monitor ALL messages from ALL users
  [myUsername]: true
}
const monitoredTerms = [ myUsername ] // array of words, regex, etc you want to be notified of in joined channels
const ignoredTerms = [] // opposite of the above: array of words, regex, etc you want to *not* be notified of even in monitored channels

const { chat } = new TwitchJs({
  log: { level: 'silent' },
  token: '',
})

// remove other listeners
chat.removeAllListeners()
chat.connect().then(() => {
  chat.on(PARSE_ERROR_ENCOUNTERED, () => {})
  chat.on(PRIVATE_MESSAGE, ({ channel, message, username }) => {
    if (ignoredUsers[username]) return
    if (includesIgnoredTerm(message)) return
    if (isInMonitoredChannel(channel) || includesMonitoredTerm(message)) {
      return sendIFTTTNotification(`${channel}:\t${username}: ${message}\n`)
    }
  })
  chat.on(DISCONNECTED, () => process.exit(0))
  channelsToJoin.forEach((channel, index) => setTimeout(() => channel && chat.join(channel), 2000 * index))
}).catch((e) => console.error('Error connecting to Twitch Chat', e))

const includesMonitoredTerm = (message) => monitoredTerms.some((term) => message.match(term))
const isInMonitoredChannel = (channel) => monitoredChannels[channel] || monitoredChannels[stripHash(channel)]
const includesIgnoredTerm = (message) => ignoredTerms.some((term) => message.match(term))

const sendIFTTTNotification = (message) => {
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
const stripHash = (channel) => channel && channel[0] === '#' ? channel.toLowerCase().replace('#', '') : channel.toLowerCase()
