var axios = require('axios');
const utils = require('./utils');

async function sendSlackNotification(blocks, options = {}) {


  try {
    await axios.post(
      options?.SLACK_URL,
      {
        blocks
      },
    )
  } catch (e) {
    console.log(e?.message)
    return e;
  }
  ;
}

async function sendNewUserNotification(notificationData) {


  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:man_with_gua_pi_mao: *${notificationData.name}* (${notificationData.email})  has registered on QueryDeck`

      },
    },
  ]
  return sendSlackNotification(blocks, { SLACK_URL: process.env.SLACK_URL })

}
async function sendAppStartedNotification() {

  const serverType = utils.serverType();
  if (serverType === 'localhost') return;
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:steam_locomotive::  App started on  *${serverType}*  at *${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}*`

      },
    },
  ]
  return sendSlackNotification(blocks, { SLACK_URL: process.env.SLACK_APP_STARTED_URL })

}

exports.sendSlackNotification = sendSlackNotification;
exports.sendNewUserNotification = sendNewUserNotification;
exports.sendAppStartedNotification = sendAppStartedNotification;
