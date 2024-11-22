const createDatabaseReducer = (state, action) => {
    switch(action.type) {
        // Updates DB Type
        case 'DB': 
            if(action.db_engine === 'MySQL') {
                return {
                    ...state,
                    db_engine: 'MySQL',
                    dbPort: {
                        ...state['dbPort'],
                        value: '3306',
                        check: false
                    }
                }
            } else if(action.db_engine === 'PostgreSQL') {
                return {
                    ...state,
                    db_engine: 'PostgreSQL',
                    dbPort: {
                        ...state['dbPort'],
                        value: '5432',
                        check: false
                    }
                }
            } else {
                console.error(`Invalid Engine: ${action.db_engine}`)
                return state
            }
        // Updates field value
        case 'VALUE':
            if(action.field === 'dbPort' && action.value > 65535) {
                return {
                    ...state,
                    [action.field]: {
                        ...state[action.field],
                        value: 65535
                    }
                }
            } else if(action.field === 'dbPort' && action.value < 1) {
                return {
                    ...state,
                    [action.field]: {
                        ...state[action.field],
                        value: 1
                    }
                }
            } else {
                return {
                    ...state,
                    [action.field]: {
                        ...state[action.field],
                        value: action.value
                    }
                }
            }
        // Updates connection string
        case 'UPDATE_CONNECTION_STRING':
            let query = action.connectionString
            // <username>:<password>@<host>:<port>/<name>
            let localHost
            let localUser
            let localPass
            let localPort
            let localName
            if(query.split(':').length === 4) {
                localHost = query.split(':')[2].split('@')[1]
                localUser = query.split(':').slice(1,query.split(':').length)[0].slice(2, query.split(':').slice(1,query.split(':').length)[0].length)
                localPass = query.split(':')[2].split('@')[0]
                localPort = query.split(':')[3].split('/')[0]
                localName = query.split(':')[3].split('/')[1]
            } else if(query.split(':').length === 3) {
                localHost = query.split(':')[1].split('@')[1]
                localUser = query.split(':')[0]
                localPass = query.split(':')[1].split('@')[0]
                localPort = query.split(':')[2].split('/')[0]
                localName = query.split(':')[2].split('/')[1]
            }
            if(localPort < 1) {
                localPort = 1
            } else if(localPort > 65535) {
                localPort = 65535
            }
            if(query.split(':').length <= 4) {
                return {
                    ...state,
                    connectionString: query,
                    dbHost: {
                        ...state.dbHost,
                        value: localHost
                    },
                    dbUsername: {
                        ...state.dbUsername,
                        value: localUser
                    },
                    dbPassword: {
                        ...state.dbPassword,
                        value: localPass
                    },
                    dbPort: {
                        ...state.dbPort,
                        value: localPort
                    },
                    dbName: {
                        ...state.dbName,
                        value: localName
                    }
                }
            } else {
                return state
            }
        // Updates field validation
        case 'CHECK':
            return {
                ...state,
                [action.field]: {
                    ...state[action.field],
                    check: action.check
                }
            }
        // Starts button loading
        case 'BUTTON_LOADING_START':
            return {
                ...state,
                buttonLoading: true
            }
        // Stops button loading
        case 'BUTTON_LOADING_STOP':
            return {
                ...state,
                buttonLoading: false
            }
        // Resets all fields
        case 'RESET':
            return {
                ...state,
                db_engine: null,
                [action.field]: {
                    ...state[action.field],
                    value: action.field === 'dbPort' ? '80' : '',
                    check: false
                }
            }
        default:
            throw new Error(`Unknown action type in createDatabaseReducer: ${action.type}`)
    }
}

export default createDatabaseReducer