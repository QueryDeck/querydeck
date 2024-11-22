const deleteModalReducer = (state, action) => {
    switch (action.type) {
        // Updates app name
        case 'UPDATE_NAME':
            return {
                ...state,
                appName: action.appName
            }
        default:
            throw new Error(`Unknown action type in deleteModalReducer: ${action.type}`)
    }
}

export default deleteModalReducer