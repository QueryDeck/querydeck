// React imports
import React, {
    useEffect,
    useReducer,
    useRef
} from 'react'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'

// Redux
import { useDispatch } from 'react-redux'

// Reducers
import databasesListReducer from '../../reducers/databases/databasesListReducer'

// Library imports
import {
    faPlus,
    faSortAlphaUp,
    faSortAlphaDown,
    faSortNumericUp,
    faSortNumericDown,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Cookies from 'js-cookie'
import {
    Badge,
    Button,
    ButtonGroup,
    Card,
    CardBody,
    CardHeader,
    Input,
    Spinner
} from 'reactstrap'
import { toast } from 'react-toastify'
// Components
// import DeleteModal from './DeleteModal'
import Menu from '../menu/Menu'
import timeCalculator from '../../../timeCalculator'

// API
import api from '../../../api'

// Abort controllers for cancelling network requests
let getDatabasesController
let resyncDatabaseController

// Databases list at '/apps/app-id/databases'
const DatabasesList = props => {
    // Redux
    const reduxDispatch = useDispatch()

    // Props
    const { appid } = props

    // For 403 errors on unauthorised users
    let history = useHistory()

    // Initial state
    const initialState = {
        appName: 'Loading...',
        filteredData: [],
        filterText: '',
        modalState: false,
        selectedDatabase: null,
        sorting: {
            field: 'Creation',
            order: true // True: Ascending | False: Descending
        },
        tableData: [],
        tableLoading: true,
        tooltips: {
            'create': false
        },
        resyncButtonLoading : {}
    }
    const timeoutIDs = useRef([])

    const [state, dispatch] = useReducer(databasesListReducer, initialState)
    useEffect(() => {
        getDatabasesController = new AbortController()
        resyncDatabaseController = new AbortController()

        getDatabases()

        return() => {
            getDatabasesController.abort()
            resyncDatabaseController.abort()
        }
        // eslint-disable-next-line
    }, [])

    // useEffect(() => {
    //     if(state.tableData.length === 1) {
    //         history.replace(`/apps/${appid}/data-sources/${state.tableData[0].db_id}${document.location.search.split('=')[1]}`)
    //     }
    // // eslint-disable-next-line
    // }, [window.location.search])

    // Opens delete database modal


    // // Re-syncs schema
    // const reSyncSchema = (db) => {

    //     dispatch({
    //         type: 'RESYNC_LOADING',
    //         db_id: db.db_id
    //     })

    //     api.post('/databases/resync-schema', {
    //             db_id: db.db_id,
    //             subdomain: appid,
    //     }, {
    //         signal: resyncDatabaseController.signal
    //     }).then(() => {
    //         toast.success(`Successfully Resynced`)    
    //     }).catch(err => {
    //         console.error(err)
    //         if(err.response) {
    //             if(err.response.status === 403) {
    //                 Cookies.remove('session')
    //                 toast.warning(`Please login again`)
    //                 reduxDispatch({ type: 'RESET' })
    //                 history.push(`/auth/login?redirect=/apps/${appid}/databases`)
    //             } else if(err.response.status === 400) {
    //                 toast.error('Error 400 | Bad Request')
    //             } else if(err.response.status === 404) {
    //                 toast.error('Error 404 | Not Found')
    //             } else if(err.response.status === 500) {
    //                 toast.error('Error 500 | Internal Server Error')
    //             }
    //         }
    //     })
    //     .finally(()=>{
    //         dispatch({
    //             type: 'RESYNC_LOADED',
    //             db_id: db.db_id
    //         })
    //     })
    // }

    // Filters apps according to text in searchbox
    const filterItems = val => {
        const lowerCaseVal = val.toLowerCase()
        const updatedData = []
        state.tableData.forEach(item => {
            if(
                item.name.toLowerCase().includes(lowerCaseVal) ||
                item.db_type.toLowerCase().includes(lowerCaseVal)
            ) {
                updatedData.push(item)
            }
        })
        dispatch({
            type: 'SINGLE',
            field: 'filteredData',
            payload: updatedData
        })
    }

    // Updates text in searchbox
    const updateFilter = event => {
        dispatch({
            type: 'SINGLE',
            field: 'filterText',
            payload: event.target.value
        })
        filterItems(event.target.value)
    }

/* 

    const openModal = row => {
        dispatch({
            type: 'OPEN_MODAL',
            row
        })
    }

    // Closes delete database modal
    const closeModal = () => {
        dispatch({
            type: 'CLOSE_MODAL'
        })
    }


// Renders delete database modal
    const renderDeleteModal = () => {
        if(state.selectedDatabase) {
            return(
                <DeleteModal
                    modalState={state.modalState}
                    selectedDatabase={state.selectedDatabase}
                    deleteDatabase={deleteDatabase}
                    modalHandler={closeModal}
                />
            )
        } else {
            return('')
        }
    } */

    // Fetches databases list
    const getDatabases = () => {
        api.get('/databases', {
            params: {
                subdomain: appid
            },
            signal: getDatabasesController.signal
        }).then(res => {
            const data = res.data.data
            if(data.databases.length) {
                history.replace(`/apps/${appid}/data-sources/${data.databases[0].db_id}`)
                // console.log('Databases List')
                // console.table(data)
                // dispatch({
                //     type: 'SET_DATABASES',
                //     value: data
                // })
            } else {
                history.replace('/apps')
            }
        }).catch(err => {
            console.error(err)
            if(err.response) {
                if(err.response.status === 403) {
                    Cookies.remove('session')
                    toast.warning(`Please login again`)
                    reduxDispatch({ type: 'RESET' })
                    history.push(`/auth/login?redirect=/apps/${appid}/databases`)
                } else if(err.response.status === 400) {
                    toast.error('Error 400 | Bad Request')
                } else if(err.response.status === 404) {
                    toast.error('Error 404 | Not Found')
                } else if(err.response.status === 500) {
                    toast.error('Error 500 | Internal Server Error')
                }
            }
        })
    }

    // Shows delete tooltip
    const showTooltip = field => {
        timeoutIDs.current.push(setTimeout(() => {
            dispatch({
                type: 'SHOW_TOOLTIP',
                field
            })
        }, 150))
    }

    // Hides delete tooltip
    const hideTooltip = field => {
        timeoutIDs.current.forEach(id => {
            clearTimeout(id)
        })
        timeoutIDs.current = []
        dispatch({
            type: 'HIDE_TOOLTIP',
            field
        })
    }

    const cycleField = () => {
        if(state.sorting.field === 'Name') {
            dispatch({
                type: 'CYCLE_FIELD',
                field: 'Engine',
                filteredData: state.sorting.order ?
                    state.filteredData.sort((a, b) => a.db_type.localeCompare(b.db_type)) :
                    state.filteredData.sort((a, b) => b.db_type.localeCompare(a.db_type))
            })
        } else if(state.sorting.field === 'Engine') {
            dispatch({
                type: 'CYCLE_FIELD',
                field: 'Creation',
                filteredData: state.sorting.order ?
                    state.filteredData.sort((a, b) => a.created_at < b.created_at) :
                    state.filteredData.sort((a, b) => a.created_at > b.created_at)
            })
        } else if(state.sorting.field === 'Creation') {
            dispatch({
                type: 'CYCLE_FIELD',
                field: 'Name',
                filteredData: state.sorting.order ?
                    state.filteredData.sort((a, b) => a.name.localeCompare(b.name)) :
                    state.filteredData.sort((a, b) => b.name.localeCompare(a.name))
            })
        }
    }

    const toggleOrder = () => {
        dispatch({
            type: 'TOGGLE_ORDER'
        })
    }

    const renderOrderIcon = () => {
        if(state.sorting.field === 'Name' || state.sorting.field === 'Engine') {
            if(state.sorting.order) {
                return <FontAwesomeIcon icon={faSortAlphaUp} />
            } else {
                return <FontAwesomeIcon icon={faSortAlphaDown} />
            }
        } else if(state.sorting.field === 'Creation') {
            if(state.sorting.order) {
                return <FontAwesomeIcon icon={faSortNumericUp} />
            } else {
                return <FontAwesomeIcon icon={faSortNumericDown} />
            }
        }
    }

    const renderHeading = () => {
        return(
            <h2 className='databases-heading'>
                Data Sources
            </h2>
        )
    }

    // Renders list toolbar
    const renderToolbar = () => {
        return(
            <div
                className='databases-list-toolbar'
                key='toolbar'
            >
                <div>
                    <ButtonGroup>
                        <Button
                            color='falcon-primary'
                            onClick={cycleField}
                        >
                            {state.sorting.field}
                        </Button>
                        <Button
                            color='falcon-primary'
                            onClick={toggleOrder}
                        >
                            {renderOrderIcon()}
                        </Button>
                    </ButtonGroup>
                </div>
                <div className='clearfix'>
                    <Input 
                        className='float-left databases-list-search mr-3'
                        autoFocus
                        onChange={updateFilter}
                        placeholder={'Search Data Sources'}
                        type="search"
                        value={state.filterText}
                    />
                    <Button
                        color='falcon-primary'
                        onClick={() => history.push(`/apps/${appid}/data-sources/new`)}
                        onMouseEnter={() => showTooltip('create')}
                        onMouseLeave={() => hideTooltip('create')}
                    >
                        {state.tooltips['create'] ? <span>New Data Source</span> : ''} <FontAwesomeIcon icon={faPlus} />
                    </Button>
                </div>
            </div>
        )
    }

    const renderDatabase = db => {
        return(
            <div
                className='databases-list-database'
                key={db.db_id}
            >
                <div
                    className='databases-list-database-name'
                    onClick={() => history.push(`/apps/${appid}/data-sources/${db.db_id}`)}
                >
                    <div className='databases-list-database-name-text'>
                        {db.dbalias}
                        <Badge>{db.db_type}</Badge>
                    </div>
                    <div className='databases-list-database-name-creation'>
                        <Badge>{timeCalculator(db.created_at)}</Badge>
                    </div>
                </div>
                {/* <div className='databases-list-database-action'>
                
                    <Button
                        className='databases-list-database-action-resync-btn'
                        color='falcon-success'
                        onClick={() => reSyncSchema(db)}
                        onMouseEnter={() => showTooltip(db.db_id)}
                        onMouseLeave={() => hideTooltip(db.db_id)}
                        disabled={state.resyncButtonLoading[db.db_id]}
                    >
                        {state.tooltips[db.db_id]  ? <span>Sync Schema &nbsp;</span> : ''} 
                      <FontAwesomeIcon icon={faSyncAlt} />
                    </Button>
                </div>     */}
 
            </div>
        )
    }

    const renderEmpty = () => {
        if(state.tableData.length) {
            return(
                <div
                    className='databases-list-database databases-list-database-create-disabled databases-list-database-empty'
                    key='empty'
                >
                    No data sources match the search term
                </div>
            )
        } else {
            return(
                <div
                    className='databases-list-database databases-list-database-create databases-list-database-empty'
                    key='empty'
                    onClick={() => history.push(`/apps/${appid}/data-sources/new`)}
                >
                    No data sources found. Click to create a database
                </div>
            )
        }
    }

    const renderDatabases = () => {
        const databasesList = []
        databasesList.push(renderToolbar())
        const savedDatabases = []
        if(state.filteredData.length) {
            state.filteredData.forEach(db => {
                savedDatabases.push(
                    renderDatabase(db)
                )
            })
            databasesList.push(
                <div
                    className='databases-list-saved'
                    key='saved'
                >
                    {savedDatabases}
                </div>
            )
        } else {
            databasesList.push(renderEmpty())
        }
        return databasesList
    }

    const renderData = () => {
        if(state.tableLoading) {
            return(
                <div className='list-deck'>
                    <Menu appid={appid} />
                    <Card className='list-card-main'>
                        <div className='loading-div'>
                            <Spinner
                                className='loading-spinner'
                                color="primary"
                                type="grow"
                            />
                        </div>
                    </Card>
                </div>
            )
        } else {
            return(
                <div className='list-deck'>
                    <Menu appid={appid} />
                    <Card className='list-card-main'>
                        <div className='databases-list'>
                            <CardHeader>
                                {renderHeading()}
                            </CardHeader>
                            <CardBody>
                                {renderDatabases()}
                            </CardBody>
                        </div>
                    </Card>
                </div>
            )
        }
    }

    return(
        <div>
            <Helmet>
                <title>
                    Data Sources | QueryDeck
                </title>
            </Helmet>
            {/* {renderDeleteModal()} */}
            {renderData()}
        </div>
    )
}

export default DatabasesList