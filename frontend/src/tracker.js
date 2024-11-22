import OpenReplay from '@openreplay/tracker'

const config = {
    projectKey: '',
    ingestPoint: 'https://openreplay.querycharts.com/ingest',
    defaultInputMode: 0,
    network: {
        capturePayload: true,
        ignoreHeaders: false,
        sanitizer: data => {
            if (data.url.startsWith("/auth")) {
                return null
            }
            return data
        },
        sessionTokenHeader: true
    },
    obscureInputDates: false,
    obscureInputEmails: false,
    obscureTextEmails: false,
    obscureTextNumbers: false,
    verbose: true
}

switch (window.location.hostname) {
    case 'app.querydeck.io':
        config.projectKey = 'A69rf4P72IN4PvQ3837u'
        break
    case 'dev.querydeck.io':
        config.projectKey = 'bDs7tHOXaczTcTdZuLVf'
        break
    default:
        console.log('Tracker not initialised', window.location.hostname)
        break
}

const tracker = new OpenReplay(config)

export default tracker