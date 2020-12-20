## Getting Started
- Install Node https://nodejs.org/en/download/
- Install npm https://docs.npmjs.com/getting-started/installing-node#installing-npm-from-the-nodejs-site
- Sign up for IFTTT https://ifttt.com/
- Create a new IFTTT Applet https://ifttt.com/create
  - Use Webhooks as the "if this" trigger
  - Save your Webhooks Event Name! This will be used later as EVENT_NAME
  - After setting up the Applet go to https://ifttt.com/services/maker_webhooks/settings and get your URL token (end of the url). This will be used as your IFTTT_KEY

Fill out your EVENT_NAME and IFTTT_KEY in a file named `.env`; An example `.env-example` file is provided.

## To run:
```
npm install
npm run start
```
