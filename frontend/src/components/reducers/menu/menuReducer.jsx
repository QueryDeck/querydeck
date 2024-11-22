const menuReducer = (state, action) => {
    switch(action.type) {
        // Opens change password modal
        case 'OPEN_MODAL':
            return {
                ...state,
                changePasswordModalState: true
            }
        // Closes change password modal
        case 'CLOSE_MODAL':
            return {
                ...state,
                changePasswordModalState: false
            }
        // Shows menu tooltip
        case 'SHOW_TOOLTIP':
            return {
                ...state,
                tooltip: true
            }
        // Hides menu tooltip
        case 'HIDE_TOOLTIP':
            return {
                ...state,
                tooltip: false
            }
        // Toggles settings dropdown
        case 'TOGGLE_DROPDOWN':
            return {
                ...state,
                dropdownOpen: !state.dropdownOpen
            }
        default:
            throw new Error(`Unknown action type in menuReducer: ${action.type}`)
    }
}

export default menuReducer