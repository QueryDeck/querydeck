import 'react-app-polyfill/ie9';
import 'react-app-polyfill/stable';
import CryptoJS from 'crypto-js'
import Cookies from 'js-cookie'
import secret from './secret';
import posthog from 'posthog-js'
import { PostHogProvider} from 'posthog-js/react'

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Main from './Main';

import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import {
  persistor,
  store
} from './lib/store'

import tracker from './tracker'

tracker.start()

let session = {}
if(Cookies.get('session')) {
  try {
    session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get('session'), secret).toString(CryptoJS.enc.Utf8))

    // const redirectSection = window.location.pathname
    if(session.user_id) {
      //   if(!(window.location.pathname.includes('/auth') || window.location.pathname.includes('/apps/sandbox'))) {
      //     window.location = `/auth/login?redirect=${redirectSection}`
      //   }
      // } else {
        tracker.setUserID(session.user.user_id)
        tracker.setMetadata('Email', session.user.email)
      
        posthog.identify(
          session.user_id,
          { email: session.email, api: session.api }
        )
      }
  } catch (error) {
    if (!(window.location.pathname.includes('/auth') || window.location.pathname.includes('/apps/sandbox'))) {
      localStorage.clear()
      Cookies.remove('session')
      window.location = '/auth/login'
    }
  }
}

const options = {
  api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST,
}

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <PostHogProvider 
        apiKey={process.env.REACT_APP_PUBLIC_POSTHOG_KEY}
        options={options}
      >
        <Main>
          <App />
        </Main>
      </PostHogProvider>
    </PersistGate>
  </Provider>
  ,
  document.getElementById('main')
);