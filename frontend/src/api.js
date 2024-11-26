import axios from 'axios'
import tracker from './tracker'

let apiurl
let apiBase
if(window.location.hostname === 'localhost') {
    apiurl = 'http://localhost:3000'
    apiBase = 'http://localhost:3000'
} 
else if(window.location.hostname.split('.').length === 2) {
    switch (window.location.hostname) {
        case 'querydeck-dev.com':
            apiurl = 'https://api.querydeck-dev.com'
            apiBase = 'api.querydeck-dev.com'
            break
        case 'app.querydeck.io':
            apiurl = 'https://api.querydeck.io'
            apiBase = 'querydeck.io'
            break
        default:
            console.error('Incorrect API Address!')
            break
    }
}
else if(window.location.hostname.split('.').length === 3) {
    switch (window.location.hostname) {
        case 'dev.querydeck.io':
            apiurl = 'https://dev-api.querydeck.io'
            apiBase = 'dev-api.querydeck.io'
            break
        case 'app.querydeck.io':
            apiurl = 'https://api.querydeck.io'
            apiBase = 'querydeck.io'
            break
        default:
            console.error('Incorrect API Address')
            break
    }
} else if(window.location.hostname.split('.').length === 4) {
    switch(window.location.hostname.split('.').slice(1,4).join('.')) {
        case 'dev.querydeck.io':
            apiurl = 'https://dev-api.querydeck.io'
            apiBase = 'dev-api.querydeck.io'
            break
        case 'app.querydeck.io':
            apiurl = 'https://api.querydeck.io'
            apiBase = 'querydeck.io'
            break
        default:
            console.error('Incorrect API Address')
            break
        }
} else {
    console.error('Mayday Mayday Mayday')
}

export { apiurl, apiBase }

// const apiurl = "https://dev-api.querydeck.io"
// const apiurl = 'http://13.250.59.129:3000'
// const apiurl = "https://api.pgtavern.com"
// const apiurl = "http://localhost:3000"
// const apiurl = "http://localhost:3001"

// const apiurl = "http://165.227.199.101"
// const apiurl = "http://127.0.0.1"

let headers = {}
if (tracker && tracker.getSessionToken()) {
    headers['X-OpenReplay-SessionToken'] = tracker.getSessionToken(); // Inject openreplay_session token
}
if (tracker && tracker.getSessionURL()) {
    headers['X-OpenReplay-SessionURL'] = tracker.getSessionURL(); // Inject openreplay_session url
} 

export default axios.create({
    baseURL: apiurl,
    headers,
    withCredentials: true
})