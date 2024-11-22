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
import appsListReducer from '../../reducers/apps/appsListReducer'

// Library imports
import {
    faPlus,
    faSortAlphaUp,
    faSortAlphaDown,
    faSortNumericUp,
    faSortNumericDown,
    faTrash
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
import DeleteModal from './DeleteModal'
import timeCalculator from '../../../timeCalculator'

// API
import api from '../../../api'

// Abort controller for cancelling network requests
let getAppsListController
let deleteAppController

// Apps list at '/apps'
const AppsList = () => {
    // Redux
    const reduxDispatch = useDispatch()

    // For 403 errors on unauthorised users
    const history = useHistory()

    // Initial state
    const initialState = {
        filteredData: [],
        filterText: '',
        modalState: false,
        selectedApp: null,
        sorting: {
            field: 'Creation',
            order: true // True: Ascending | False: Descending
        },
        tableData: [],
        tableLoading: true,
        tooltips: {
            'create': false
        }
    }
    const timeoutIDs = useRef([])

    const [state, dispatch] = useReducer(appsListReducer, initialState)

    useEffect(() => {
        getAppsListController = new AbortController()
        deleteAppController = new AbortController()

        getApps()

        return() => {
            getAppsListController.abort()
            deleteAppController.abort()
        }
        // eslint-disable-next-line
    }, [])

    // Opens delete app modal
    const openModal = row => {
        dispatch({
            type: 'OPEN_MODAL',
            row
        })
    }

    // Closes delete app modal
    const closeModal = () => {
        dispatch({
            type: 'CLOSE_MODAL'
        })
    }

    // Deletes app selected through modal
    const deleteApp = () => {
        console.log('Deleting App')
        console.table(state.selectedApp)
        dispatch({
            type: 'START_LOADING'
        })
        api.delete('/apps', {
                data: {
                    app_id: state.selectedApp.app_id
                }
            }, {
                signal: deleteAppController.signal
        }).then(res => {
            closeModal()
            console.log(`✅ App Deleted with name:'${state.selectedApp.name}' and id:'${state.selectedApp.app_id}'`)
            toast.success(`Deleted app ${state.selectedApp.name}`)
            // if(state.tableData.length <= 1) {
            //     history.replace('/apps/new')
            // } else {
                getApps()
            // }
        }).catch(err => {
            console.error(err)
            if(err.response) {
                if(err.response.status === 403) {
                    Cookies.remove('session')
                    toast.warning(`Please login again`)
                    reduxDispatch({ type: 'RESET' })
                    history.push('/auth/login?redirect=/apps')
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

    // Filters apps according to text in searchbox
    const filterItems = val => {
        const lowerCaseVal = val.toLowerCase()
        const updatedData = []
        state.tableData.forEach(item => {
            if(
                item.name.toLowerCase().includes(lowerCaseVal) ||
                item.subdomain.toLowerCase().includes(lowerCaseVal)
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

    // Renders delete app modal
    const renderDeleteModal = () => {
        if(state.selectedApp) {
            return(
                <DeleteModal
                    deleteApp={deleteApp}
                    modalHandler={closeModal}
                    modalState={state.modalState}
                    selectedApp={state.selectedApp}
                />
            )
        } else {
            return('')
        }
    }

    // Fetches apps list
    const getApps = () => {
        api.get('/apps', {
            signal: getAppsListController.signal
        }).then(res => {
            const apps = res.data.data
            if(apps.length) {
                // if(apps.length === 1) {
                //     history.replace(`/apps/${apps[0].subdomain}/api/new`)
                // } else {
                    console.log('Apps List')
                    console.table(apps)
                    dispatch({
                        type: 'SET_APPS',
                        value: apps
                    })
                // }
            } else {
                history.replace('/apps/new')
            }
        }).catch(err => {
            console.error(err)
            if(err.response) {
                if(err.response.status === 403) {
                    Cookies.remove('session')
                    toast.warning(`Please login again`)
                    reduxDispatch({ type: 'RESET' })
                    history.push('/auth/login?redirect=/apps')
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

    // Cycles sorting field
    const cycleField = () => {
        if(state.sorting.field === 'Name') {
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

    // Toggles sorting order
    const toggleOrder = () => {
        dispatch({
            type: 'TOGGLE_ORDER'
        })
    }

    // Renders sort icon depending on sort and order
    const renderOrderIcon = () => {
        if(state.sorting.field === 'Name') {
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

    // Renders list toolbar
    const renderToolbar = () => {
        return(
            <div
                className='apps-list-toolbar'
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
                        className='float-left apps-list-search mr-3'
                        autoFocus
                        onChange={updateFilter}
                        placeholder={'Search Apps'}
                        type="search"
                        value={state.filterText}
                    />
                    <Button
                        color='falcon-primary'
                        onClick={() => history.push(`/apps/new`)}
                        onMouseEnter={() => showTooltip('create')}
                        onMouseLeave={() => hideTooltip('create')}
                    >
                        {state.tooltips['create'] ? <span>New App</span> : ''} <FontAwesomeIcon icon={faPlus} />
                    </Button>
                </div>
            </div>
        )
    }

    const renderApp = app => {
        return(
            <div
                className='apps-list-app'
                key={app.app_id}
            >
                <div
                    className='apps-list-app-name'
                    onClick={() => history.push(`/apps/${app.subdomain}/api/new`)}
                >
                    <div className='apps-list-app-name-text'>
                        {app.name}
                    </div>
                    <div className='apps-list-app-name-creation'>
                        <Badge>{timeCalculator(app.created_at)}</Badge>
                    </div>
                </div>
                <div className='apps-list-app-action'>
                    <Button
                        color='falcon-danger'
                        onClick={() => openModal(app)}
                        onMouseEnter={() => showTooltip(app.app_id)}
                        onMouseLeave={() => hideTooltip(app.app_id)}
                    >
                        {state.tooltips[app.app_id] ? <span>Delete</span> : ''} <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>
            </div>
        )
    }

    const renderEmpty = () => {
        if(state.tableData.length) {
            return(
                <div
                    className='apps-list-app apps-list-app-create-disabled apps-list-app-empty'
                    key='empty'
                >
                    No apps match the search term
                </div>
            )
        } else {
            return(
                <div
                    className='apps-list-app apps-list-app-create apps-list-app-empty'
                    key='empty'
                    onClick={() => history.push(`/apps/new`)}
                >
                    No apps found. Click to create an app
                </div>
            )
        }
    }

    const renderApps = () => {
        const appsList = []
        appsList.push(renderToolbar())
        const savedApps = []
        if(state.filteredData.length) {
            state.filteredData.forEach(app => {
                savedApps.push(
                    renderApp(app)
                )
            })
            appsList.push(
                <div
                    className='apps-list-saved'
                    key='saved'
                >
                    {savedApps}
                </div>
            )
        } else {
            appsList.push(renderEmpty())
        }
        return appsList
    }

    const renderData = () => {
        if(state.tableLoading) {
            return(
                <Card className='list-card'>
                    <div className='loading-div'>
                        <Spinner
                            className='loading-spinner'
                            color="primary"
                            type="grow"
                        />
                    </div>
                </Card>
            )
        } else {
            return(
                <Card className='list-card'>
                    <div className='apps-list'>
                        <CardHeader>
                            <h2 className='apps-heading'>
                                Apps
                            </h2>
                        </CardHeader>
                        <CardBody>
                            {renderApps()}
                        </CardBody>
                    </div>
                </Card>
            )
        }
    }

    return(
        <div>
            <Helmet>
                <title>
                    Apps | QueryDeck
                </title>
            </Helmet>
            {renderDeleteModal()}
            {renderData()}
        </div>
    )
}

export default AppsList