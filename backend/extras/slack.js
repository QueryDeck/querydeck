var axios = require('axios');

async function sendSlackNotification(blocks) {
  try {
    await axios.post(
      process.env.SLACK_URL,
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
  return sendSlackNotification(blocks)

}


exports.sendSlackNotification = sendSlackNotification;
exports.sendNewUserNotification = sendNewUserNotification;
