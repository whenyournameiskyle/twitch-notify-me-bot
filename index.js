const { config } = require('dotenv')
const request = require('request-promise')
const TwitchJs = require('twitch-js').default

config()

const { EVENT_NAME, IFTTT_KEY, TWITCH_CODE, TWITCH_NAME } = process.env
const channelsToJoin = [TWITCH_NAME] // channels you want to join to monitor
const ignoredUsers = { 'moobot': true, 'nightbot': true } // users whose  messages you don't want notified of
const monitoredChannels = { [TWITCH_NAME]: true } // channels you want to be notifed of ALL messages by non-ignoredUsers
const monitoredTerms = [TWITCH_NAME] // words, regex, etc you want to be notified of in channels you are joined

const { api, chat } = new TwitchJs({
  username: TWITCH_NAME,
  token: TWITCH_CODE
})

// silence all built in console.info
chat.removeAllListeners()

chat.connect().then(() => {
  channelsToJoin.forEach((channel, index) => setTimeout(() => channel && chat.join(channel), 2000 * index))
})

chat.on(TwitchJs.Chat.Events.PARSE_ERROR_ENCOUNTERED, () => {})

chat.on(TwitchJs.Chat.Events.PRIVATE_MESSAGE, ({ channel, message, username }) => {
  if (ignoredUsers[username]) return

  if (isInMonitoredChannel(channel) || includesMonitoredTerm(message)) {
    return sendIFTTTNotification(`${channel}:\t${user}: ${message}\n`)
  }
})

chat.on(TwitchJs.Chat.Events.DISCONNECTED, () => {
  process.exit(1)
})

function isInMonitoredChannel (channel) {
  return monitoredChannels[channel] || monitoredChannels[`#${channel}`]
}

function includesMonitoredTerm (message) {
  return monitoredTerms.some(function (term) {
    return message.match(term)
  })
}

function sendIFTTTNotification (message) {
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
