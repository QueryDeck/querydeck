const databasesListReducer = (state, action) => {
    switch (action.type) {
        // Opens deletion modal
        case 'OPEN_MODAL':
            return {
                ...state,
                modalState: true,
                selectedDatabase: action.row
            }
        // Closes deletion modal
        case 'CLOSE_MODAL':
            return {
                ...state,
                modalState: false,
                selectedDatabase: null
            }
        // Initiates loading
        case 'START_LOADING':
            return {
                ...state,
                tableLoading: true
            }
        // Sets databases
        case 'SET_DATABASES':
            const databasesList = action.value.databases.map(db => db.db_id)
            let tooltips = {
                ...state.tooltips
            }
            databasesList.forEach(db => {
                tooltips[db] = false
            })
            return {
                ...state,
                appName: action.value['app-name'],
                filteredData: action.value.databases.sort((a, b) => a.created_at < b.created_at),
                tableData: action.value.databases,
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

        case 'RESYNC_LOADING':
            return {
                ...state,
                resyncButtonLoading: {
                    ...state.resyncButtonLoading,
                    [action.db_id]: true
                }
            }
        case 'RESYNC_LOADED':
            return {
                ...state,
                resyncButtonLoading: {
                    ...state.resyncButtonLoading,
                    [action.db_id]: false
                }
            }
        default:
            throw new Error(`Unknown action type in databasesListReducer: ${action.type}`)
    }
}

export default databasesListReducer