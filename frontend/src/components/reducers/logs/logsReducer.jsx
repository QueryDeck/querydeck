const logsReducer = (state, action) => {
    switch (action.type) {
        // Updates table data
        case 'UPDATE_TABLE':
            const tableData = []
            const titles = [
                'id',
                'Route' ,
                'Method',
                'Response Code',
                'Error',
                'IP',
                // 'Query',
                'Execution Time(s)',
                'Executed At',
            ]
            const tableHeadings = []
            action.data.forEach((elem, index) => {
                tableData.push({
                    'id': elem.query_metric_id,
                    'Route': elem.apiRotue,
                    'Method': elem.method,
                    'Error': JSON.stringify(elem.db_error ),
                    'Response Code': elem.response_code,
                    'IP':  elem.ip_address,
                    // 'Query': elem.query_text,
                    'Execution Time(s)': elem.exec_time /1000.0,
                    'Executed At':new Date(elem.created_at * 1000).toISOString()  ,
                })
            })
            
            titles.forEach((title, index) => {
                let alignment = 'left'
                if(index >=2 && index < titles.length - 1) {
                    alignment = 'center'
                } else if(index === titles.length - 1) {
                    alignment = 'right'
                }
                if(title === 'id') {
                    tableHeadings.push({
                        disableExport: true,
                        editable: false,
                        field: 'id',
                        hide: true,
                        type: 'string',
                        width: 100
                    })
                } else {
                    tableHeadings.push({
                        align: alignment,
                        editable: false,
                        field: title,
                        flex: 1,
                        headerAlign: alignment,
                        headerName: title,
                        minWidth: 150
                    })
                }
            })
            // tableHeadings[tableHeadings.length -1].minWidth =200 ;
            return {
                ...state,
                tableData: tableData,
                tableHeadings: tableHeadings,
                tableLoading: false,
                totalRowCount :  Number(action.totalRowCount),
                paginationModel:action.paginationModel || state.paginationModel ,
            }
        // Updates pagination model
        case 'UPDATE_PAGINATION_MODEL':
            return {
                ...state,
                paginationModel: action.value
            }
            
        case 'UPDATE_LOADING_STATUS':
            return {
                ...state,
                tableLoading:action.tableLoading
            }
        default:
            throw new Error(`Unknown action type in logsReducer: ${action.type}`)
    }
}

export default logsReducer