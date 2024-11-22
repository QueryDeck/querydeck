// Packages
import tracker from '../tracker'
import trackerRedux from '@openreplay/tracker-redux'
import {
  combineReducers,
  configureStore
} from '@reduxjs/toolkit'
import {
  persistReducer,
  persistStore,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE
} from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'

// Reducers
import dataReducer from './data/dataSlice'

const openReplayMiddleware = tracker.use(trackerRedux({
  actionType: action => action.type
}))

const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null)
    },
    setItem(_key, value) {
      return Promise.resolve(value)
    },
    removeItem(_key) {
      return Promise.resolve()
    },
  }
}

const storage = typeof window === 'undefined' ? createNoopStorage() : createWebStorage('local')

const persistConfig = {
  key: 'root',
  storage
}

const combinedReducer = combineReducers({
  data: dataReducer
})

const rootReducer = (state, action) => {
  if (action.type === 'RESET') {
    state = undefined
  }
  return combinedReducer(state, action)
}

// const rootReducer = combineReducers({
//   data: dataReducer
// })

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE]
      }
    })
    .prepend()
    .concat(openReplayMiddleware)
})

export const persistor = persistStore(store)