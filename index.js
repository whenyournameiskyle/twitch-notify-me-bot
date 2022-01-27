'use strict'

const fs = require('fs')
const { config } = require('dotenv')
const fetch = require('node-fetch')
const TwitchJs = require('twitch-js').default
const { Chat: { Events: { DISCONNECTED, PARSE_ERROR_ENCOUNTERED, PRIVATE_MESSAGE } } } = TwitchJs
const toml = require('toml')

const stripHash = (channel) => channel && channel[0] === '#' ? channel.toLowerCase().replace('#', '') : channel.toLowerCase()

config()
const { EVENT_NAME, IFTTT_KEY } = process.env

// load customized settings
let userSettings
try {
  userSettings = toml.parse(fs.readFileSync(__dirname + '/user-settings.toml'))
} catch (e) {
  console.error('Error loading user-settings.toml', e)
  process.exit(1)
}

const channelsToJoin = userSettings.channelsToJoin || []
const monitoredTerms = (userSettings.monitoredTerms || []).map(s => new RegExp(s, 'i'))
const ignoredTerms = (userSettings.ignoredTerms || []).map(s => new RegExp(s, 'i'))
const strippedTerms = (userSettings.strippedTerms || []).map(s => new RegExp(s, 'g'))
const ignoredUsers = new Set(userSettings.ignoredUsers || [])
const monitoredChannels = new Set((userSettings.monitoredChannels || []).map(stripHash))

const dryRun = userSettings.dryRun || false

const myUserName = userSettings.myUserName || ''
if (myUserName != '') {
  // by default i'm interested in my own channel
  monitoredChannels.add(myUserName)
  // don't need to be notified that i'm talking
  ignoredUsers.add(myUserName)
  // do want to be notified when people are talking about me
  // or i guess to me
  monitoredTerms.push(new RegExp(myUserName, 'i'))
}

const { chat } = new TwitchJs({
  log: { level: 'silent' },
  token: '',
})

// remove other listeners
chat.removeAllListeners()
chat.on(PARSE_ERROR_ENCOUNTERED, () => {})
chat.on(DISCONNECTED, () => process.exit(1))
chat.connect().then(() => {
  chat.on(PRIVATE_MESSAGE, ({ channel, message, username }) => {
    if (ignoredUsers.has(username)) return
    if (includesIgnoredTerm(message)) return
    if (isInMonitoredChannel(channel) || includesMonitoredTerm(message)) {
      if (!dryRun) {
        return sendIFTTTNotification(`${stripHash(channel)}:\t${username}: ${message}\n`)
      }
      else {
        console.log("would send notification", channel, username, message)
      }
    }
  })
  chat.on(DISCONNECTED, () => process.exit(0))
  new Set([... channelsToJoin, ...monitoredChannels]).forEach((channel, index) => setTimeout(() => channel && chat.join(channel), 2000 * index))
}).catch((e) => console.error('Error connecting to Twitch Chat', e))

const includesMonitoredTerm = (message) => {
  strippedTerms.forEach(strip => message = message.replace(strip, ''))
  return monitoredTerms.some((term) => message.match(term))
}
const isInMonitoredChannel = (channel) => monitoredChannels.has(stripHash(channel))
const includesIgnoredTerm = (message) => ignoredTerms.some((term) => message.match(term))

const sendIFTTTNotification = async (message) => {
  try {
    const url = `https://maker.ifttt.com/trigger/${EVENT_NAME}/with/key/${IFTTT_KEY}?value1=${message}`
    console.log({url})
    await fetch(url, { method: 'POST' })
  } catch (e) {
    console.error('IFTTT POST fetch failed', e.message)
  }
}
