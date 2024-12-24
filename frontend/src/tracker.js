import OpenReplay from '@openreplay/tracker'

const config = {
    projectKey: process.env.REACT_APP_OPENREPLAY_KEY,
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

const tracker = new OpenReplay(config)

export default tracker