## Getting Started
- Install Node https://nodejs.org/en/download/
- Install npm https://docs.npmjs.com/getting-started/installing-node#installing-npm-from-the-nodejs-site
- Sign up for IFTTT https://ifttt.com/
- Create a new IFTTT Applet https://ifttt.com/create
  - Use Webhooks as the "if this" trigger
  - Remember your Webhooks Event Name! It will be saved in .env as EVENT_NAME
  - After setting up the Applet go to https://ifttt.com/services/maker_webhooks/settings and get your URL token (end of the url)
- Get your Twitch oauth from https://twitchapps.com/tmi/

Fill out your EVENT_NAME, IFTTT_KEY, your TWITCH_NAME and TWITCH_CODE (starts with `oauth:`) in a file named `.env`

## To run:
```
npm install
npm run start
```
