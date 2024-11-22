const schemaTableReducer = (state, action) => {
    switch (action.type) {
        // Updates table data
        case 'UPDATE_TABLE':
            const tableData = []
            const titles = [
                'id',
                'Schema',
                'Table',
                'Inbound Connections',
                'Outbound Connections',
                'No. of Columns',
            ]
            const tableHeadings = []
            action.data.forEach((table, index) => {
                tableData.push({
                    'id': table.id,
                    'Schema': table.text.split('.')[0],
                    'Table': table.text.split('.')[1],
                    'Inbound Connections': table.ref_in_count,
                    'Outbound Connections': table.ref_out_count,
                    'No. of Columns': table.col_count,
                    'ReferencedByCols': table.referenced_by_cols,
                    'uniqueColumns': table.unique_cols,
                    'Columns': table.columns
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
            return {
                ...state,
                tableData: tableData,
                tableHeadings: tableHeadings,
                tableLoading: false
            }
        // Updates pagination model
        case 'UPDATE_PAGINATION_MODEL':
            return {
                ...state,
                paginationModel: action.value
            }
        default:
            throw new Error(`Unknown action type in schemaTableReducer: ${action.type}`)
    }
}

export default schemaTableReducer