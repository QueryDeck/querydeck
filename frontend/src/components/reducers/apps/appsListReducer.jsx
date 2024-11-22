const appsListReducer = (state, action) => {
    switch (action.type) {
        // Opens deletion modal
        case 'OPEN_MODAL':
            return {
                ...state,
                modalState: true,
                selectedApp: action.row
            }
        // Closes deletion modal
        case 'CLOSE_MODAL':
            return {
                ...state,
                modalState: false,
                selectedApp: null
            }
        // Initiates loading
        case 'START_LOADING':
            return {
                ...state,
                tableLoading: true
            }
        // Sets apps
        case 'SET_APPS':
            const appsList = action.value.map(app => app.app_id)
            let tooltips = {
                ...state.tooltips
            }
            appsList.forEach(app => {
                tooltips[app] = false
            })
            return {
                ...state,
                filteredData: action.value.sort((a, b) => a.created_at < b.created_at),
                tableData: action.value,
                tableLoading: false,
                tooltips
            }
        // Shows delete tooltip
        case 'SHOW_TOOLTIP':
            return {
                ...state,
                tooltips: {
                    ...state.tooltips,
                    [action.field]: true
                }
            }
        // Hides delete tooltip
        case 'HIDE_TOOLTIP':
            return {
                ...state,
                tooltips: {
                    ...state.tooltips,
                    [action.field]: false
                }
            }
        // Cycles sorting field
        case 'CYCLE_FIELD':
            return {
                ...state,
                filteredData: action.filteredData,
                sorting: {
                    ...state.sorting,
                    field: action.field
                }
            }
        // Toggles sorting order
        case 'TOGGLE_ORDER':
            return {
                ...state,
                filteredData: state.filteredData.reverse(),
                sorting: {
                    ...state.sorting,
                    order: !state.sorting.order
                }
            }
        // Updates a single field
        case 'SINGLE':
            return {
                ...state,
                [action.field]: action.payload
            }
        default:
            throw new Error(`Unknown action type in appsListReducer: ${action.type}`)
    }
}

export default appsListReducer