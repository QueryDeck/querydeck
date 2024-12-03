// React imports
import React, { useContext, useEffect, useReducer } from 'react'
import PropTypes from 'prop-types'

// Reducers
import schemaTableReducer from '../../../reducers/databases/schema/schemaTableReducer'

// Library imports
import { Box, Paper, Stack, Typography } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { DataGridPro, useGridApiContext } from '@mui/x-data-grid-pro'

// App config
import AppContext from '../../../../context/Context'

/*  unique columns table  */
function DetailPanelContentUniqueColumnsTable({ uniqueColumns }) {
    // return null
      if (uniqueColumns.length === 0) return null
  
      const headings = []
      const data = []
  
      uniqueColumns.forEach((col, index) => {
          data.push({
          id: index + 1,
          'Constrain Key': col.label,
          'Columns': col.columns.length > 1 ? `(${col.columns.join(", ")})` : col.columns[0],
          })
      })
      const titles = ['id', 'Constrain Key', 'Columns' ]
      titles.forEach((title, index) => {
          let alignment = 'left'
          if (index >= 2 && index < titles.length - 1) {
              alignment = 'center'
          } else if (index === titles.length - 1) {
              alignment = 'right'
          }
          if (title === 'id') {
              headings.push({
                  disableExport: true,
                  editable: false,
                  field: 'id',
                  hide: true,
                  type: 'string',
                  width: 100
              })
          } else {
              headings.push({
                  align: alignment,
                  editable: false,
                  field: title,
                  flex: 1,
                  headerAlign: alignment,
                  headerName: title,
                  minWidth: 140
              })
          }
      })
  
      return (
          <div style={{ paddingTop: '7px' }}>
              <Typography variant='h6'>
                  Unique Columns
              </Typography>
  
              <DataGridPro
                  density='compact'
                  columns={headings}
                  rows={data}
                  sx={{
                      flex: 1,
                      maxHeight: '500px'
                  }}
                  hideFooter
              />
          </div>
      )
  }
  
/*  reference table  */
function DetailPanelContentRefByTable({ ReferencedByCols }) {
  // return null
    if (ReferencedByCols.length === 0) return null

    const headings = []
    const data = []

    ReferencedByCols.forEach((col, index) => {
        data.push({
        id: index + 1,
        'Referencing Column': col.refCol,
        'Referenced By Schema': col.refBySchema,
        'Referenced By Table': col.refByTable,
        'Referenced By Column': col.refByCol
        })
    })
    const titles = ['id', 'Referencing Column', 'Referenced By Schema', 'Referenced By Table', 'Referenced By Column']
    titles.forEach((title, index) => {
        let alignment = 'left'
        if (index >= 2 && index < titles.length - 1) {
            alignment = 'center'
        } else if (index === titles.length - 1) {
            alignment = 'right'
        }
        if (title === 'id') {
            headings.push({
                disableExport: true,
                editable: false,
                field: 'id',
                hide: true,
                type: 'string',
                width: 100
            })
        } else {
            headings.push({
                align: alignment,
                editable: false,
                field: title,
                flex: 1,
                headerAlign: alignment,
                headerName: title,
                minWidth: 140
            })
        }
    })

    return (
        <div style={{ paddingTop: '7px' }}>
            <Typography variant='h6'>
                Referenced By
            </Typography>

            <DataGridPro
                density='compact'
                columns={headings}
                rows={data}
                sx={{
                    flex: 1,
                    maxHeight: '500px'
                }}
                hideFooter
            />
        </div>
    )
}

/*   columns  table ( child table ) */
function DetailPanelContent({ row: rowProp }) {
    const apiRef = useGridApiContext()
    const [width, setWidth] = React.useState(() => {
        const dimensions = apiRef.current.getRootDimensions()
        return dimensions.viewportInnerSize.width
    })

    const handleViewportInnerSizeChange = React.useCallback(() => {
        const dimensions = apiRef.current.getRootDimensions()
        setWidth(dimensions.viewportInnerSize.width)
    }, [apiRef])

    React.useEffect(() => {
        return apiRef.current.subscribeEvent(
            'viewportInnerSizeChange',
            handleViewportInnerSizeChange,
        )
    }, [apiRef, handleViewportInnerSizeChange])

    const headings = []
    const data = []
    rowProp.row.Columns.forEach(col => {
        data.push({
            'id': col.id,
            'Name': col.label,
            'Datatype': col.type,
            'Not NULL': col.not_null  ? '✅' : '❌',
            // 'Unique': col.unique  ? '✅' : '❌',
            'Primary Key': col.primary  ? '✅' : '❌',
            'Foreign Key': col.foreign ? col.fk_col : '❌',
            'Default Value': col.default ? col.default : '❌',
        })
    })

    const titles = [
        'id',
        'Name',
        'Datatype',
        'Not NULL',
        // 'Unique',
        'Primary Key',
        'Foreign Key',
        'Default Value'
    ]
    titles.forEach((title, index) => {
        let alignment = 'left'
        if(index >=2 && index < titles.length - 1) {
            alignment = 'center'
        } else if(index === titles.length - 1) {
            alignment = 'right'
        }
        if(title === 'id') {
            headings.push({
                disableExport: true,
                editable: false,
                field: 'id',
                hide: true,
                type: 'string',
                width: 100
            })
        } else {
            headings.push({
                align: alignment,
                editable: false,
                field: title,
                flex: 1,
                headerAlign: alignment,
                headerName: title,
                minWidth: 150,
            })
        }
    })

    return (
        <Stack
            sx={{
                py: 2,
                maxHeight: '500px',
                boxSizing: 'border-box',
                position: 'sticky',
                left: 0,
                width,
            }}
            direction='column'
        >
            <Paper sx={{ flex: 1, mx: 'auto', width: '90%', p: 1 }}>
                <Stack direction='column' spacing={1} sx={{ height: 1 }}>
                    <Typography variant='h6'>
                        {`Schema: ${rowProp.row.Schema} | Table: ${rowProp.row.Table}`}
                    </Typography>
                    <DataGridPro
                        density='compact'
                        columns={headings}
                        rows={data}
                        sx={{ flex: 1, maxHeight: '500px' }}
                        hideFooter
                    />
                        <DetailPanelContentRefByTable
                            ReferencedByCols={rowProp.row.ReferencedByCols}
                        /> 
                        <DetailPanelContentUniqueColumnsTable
                            uniqueColumns={rowProp.row.uniqueColumns}
                        /> 
                        
                </Stack>
            </Paper>            
        </Stack>
    )
}

DetailPanelContent.propTypes = {
    row: PropTypes.object.isRequired,
}

// Database table at 'apps/app-id/data-sources/database-id'
const DatabaseTable = props => {

    // Props
    const { data } = props

    const { isDark } = useContext(AppContext)

    // Initial state
    const initialState = {
        paginationModel: {
            page: 0,
            pageSize: 25
        },
        tableData: [],
        tableHeadings: [],
        tableLoading: true
    }

    const [state, dispatch] = useReducer(schemaTableReducer, initialState)

    useEffect(() => {
        updateTable()
        // eslint-disable-next-line
    }, [])

    // Sets theme based on user's preference
    const darkTheme = isDark ? createTheme({
        palette: {
            mode: 'dark',
        },
    }) : createTheme({
        palette: {
            mode: 'light',
        },
    })

    // Updates table data
    const updateTable = () => {
        dispatch({
            type: 'UPDATE_TABLE',
            data
        })
    }

    // Updates page size and current page
    const paginationModelHandler = value => {
        dispatch({
            type: 'UPDATE_PAGINATION_MODEL',
            value
        })
    }

    const getDetailPanelContent = React.useCallback(row => {
        return(
            <div className='test'>
                <DetailPanelContent row={row} />
            </div>
        )
    }, [])

    const getDetailPanelHeight = React.useCallback(row => {
        return Math.min(row.row.Columns.length * 36 + 39 + 32 + 8 + 8 + 8 + 16 + 16 + 16 + 4, 574)
    }, [])

    // Renders table
    const renderTable = () => {
        return (
            <Box
                className='data-src-table-bx'
                sx={{
                    display: 'flex',
                    height: 'calc(100vh - 61.283px - 8px - 4px - 4px - 34px)'
                }}
                dir='ltr'
            >
                <DataGridPro
                    columns={state.tableHeadings}
                    columnVisibilityModel={{
                        id: false
                    }}
                    density='compact'
                    disableRowSelectionOnClick={true}
                    getCellClassName={() => 'custom-cell'}
                    getDetailPanelContent={getDetailPanelContent}
                    getDetailPanelHeight={getDetailPanelHeight}
                    loading={state.tableLoading}
                    onPaginationModelChange={paginationModelHandler}
                    pagination={true}
                    paginationMode='client'
                    paginationModel={state.paginationModel}
                    rows={state.tableData}
                    pageSizeOptions={[10, 25, 50]}
                    rowThreshold={0}
                    sortingMode='client'
                    sx={{
                        border: 'none',
                        zIndex: 0
                    }}
                    unstable_headerFilters ={true}
                />
            </Box>
        )
    }

    return(
        <ThemeProvider theme={darkTheme}>
            {renderTable()}
        </ThemeProvider>
    )
}

export default DatabaseTable