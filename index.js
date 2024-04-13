'use strict'

const TwitchJs = require('twitch-js').default
const {
  Chat: {
    Events: { DISCONNECTED, PRIVATE_MESSAGE },
  },
} = TwitchJs

require('dotenv').config()

const { EVENT_NAME, IFTTT_KEY } = process.env
const CHANNELS_TO_JOIN = [] // array of any channels you want to monitor
const CHANNELS_TO_MONITOR = {} // channels you want to monitor all messages from all users
const STRINGS_TO_MONITOR = [] // array of words, regex, etc you want to be notified of in joined channels
const STRINGS_TO_REMOVE = [] // opposite of the above: array of words, regex, etc you want to *not* be notified of even in monitored channels
const USERS_TO_IGNORE = {
  // users whose messages you don't want notified of
  moobot: true,
  nightbot: true,
  streamelements: true,
}

const getCurrentTime = () => {
  const newDate = new Date()
  return newDate.toLocaleString()
}
const stripHash = (channel) => (channel && channel?.toLowerCase ? channel.toLowerCase().replace(/#/g, '') : '')

const { chat } = new TwitchJs({
  log: { level: 'silent' },
  token: '',
  username: '',
  clientId: '',
}) // you can leave these blank to "log into" chat as anonymous

const main = async () => {
  if (!IFTTT_KEY) return console.info('Please set your IFTTT key')
  chat.removeAllListeners()
  try {
    await chat.connect()
    console.debug('Notify bot is connected!')
  } catch (e) {
    console.error(`error connecting`, e)
    return process.exit(1)
  }

  if (CHANNELS_TO_JOIN && CHANNELS_TO_JOIN.length) {
    for (let i = 0; i < CHANNELS_TO_JOIN.length; i++) {
      const channel = CHANNELS_TO_JOIN[i]
      try {
        chat.join(channel)
      } catch (e) {
        return console.error(`error in joining ${channel}`, e)
      }
    }
  }
  addEventListeners()
}

const addEventListeners = () => {
  chat.on(DISCONNECTED, () => {
    console.error(`Disconnected from twitch, exiting...`)
    process.exit(1)
  })

  chat.on(PRIVATE_MESSAGE, async ({ channel, message, username }) => {
    channel = stripHash(channel)
    message = stripHash(message)
    username = username.toLowerCase()

    if (USERS_TO_IGNORE[username] || !message || message.split(' ').length < 2) {
      return null
    }

    const regexPattern = STRINGS_TO_REMOVE.map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
    const regex = new RegExp(regexPattern, 'g')
    message = message.replace(regex, '').replace(/\s+/g, ' ').trim()

    if (!message || message === '  ' || message === ' ' || message.split(' ').length < 2) {
      return null
    }

    channel = stripHash(channel)
    if (isInMonitoredChannel(channel) || includesMonitoredTerm(message.toLowerCase())) {
      try {
        await sendIFTTTNotification(`${getCurrentTime()} ${channel} | ${username}: "${message}"`)
      } catch (e) {
        console.error('error sending IFTTT notification')
      }
    }
  })
}

const baseUrl = `https://maker.ifttt.com/trigger/${EVENT_NAME}/with/key`
const sendIFTTTNotification = async (message) => {
  const url = `${baseUrl}/${IFTTT_KEY}?value1=${message}`
  try {
    await fetch(url)
  } catch (e) {
    console.error(`${getCurrentTime()} sendIFTTTNotification() fetch failed. Error:`, e)
  }
}
const includesMonitoredTerm = (message) => {
  return STRINGS_TO_MONITOR.some((term) => message.match(term))
}
const isInMonitoredChannel = (channel) => {
  return CHANNELS_TO_MONITOR[channel]
}

try {
  main()
} catch (e) {
  console.error('error in main() for notify bot:', e)
}
