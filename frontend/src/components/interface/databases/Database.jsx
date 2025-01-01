// React imports
import React, {
    useEffect,
    useState
} from 'react'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'

// Redux
import { useDispatch } from 'react-redux'

// Library imports
import {
    // faList,
    faTable,
    faSitemap,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Cookies from 'js-cookie'
import {
    Card,
    CardBody,
    CardHeader,
    Nav,
    NavItem,
    NavLink,
    Spinner,
    TabContent,
    TabPane
} from 'reactstrap'
import { toast } from 'react-toastify'

// Components
import Menu from '../menu/Menu'
import Header from '../../../app/projects/[subdomain]/components/sections/engine/header'
import SchemaTable from './tables/SchemaTable'
import Schema from './schema/Schema'
import Overview from './overview/Overview'

// API
import api from '../../../api'
import {isSubdomainIsSandbox} from '../../../helpers/utils'

// Abort controllers for cancelling network requests
let dataController
let detailsController
let resyncController

// Database section after selecting a database
const Database = props => {
    // Redux
    const dispatch = useDispatch()

    // Props
    const {
        appid,
        db_id
    } = props

    // For 403 errors on unauthorised users
    let history = useHistory()

    const [data, setData] = useState(null)
    const [details, setDetails] = useState(null)
    const [resync, setResync] = useState(false)
    const [tab, setTab] = useState('schema-tables')

    useEffect(() => {
        dataController = new AbortController()
        detailsController = new AbortController()
        resyncController = new AbortController()

        getData()
        getDatabaseDetails()

        return () => {
            dataController.abort()
            detailsController.abort()
            resyncController.abort()
        }
    }, [])

    ///// Network requests /////
    const catchError = (error) => {
        if (error.response) {
            if (error.response.data.meta.status === 403) {
                Cookies.remove('session')
                toast.warning(`Please login again`)
                dispatch({ type: 'RESET' })
                history.push(`/auth/login?redirect=/apps/${props.subdomain}/data-sources/${props.appid}`)
            } else if (error.response.data.meta.status === 400) {
                toast.error('Error 400 | Bad Request')
            } else if (error.response.data.meta.status === 404) {
                toast.error('Error 404 | Not Found')
            } else if (error.response.data.meta.status === 500) {
                toast.error('Error 500 | Internal Server Error')
            } else {
                toast.error('Something went wrong')
            }
        } else {
            toast.error('Something went wrong')
            console.error(error)
        }
    }

    const changeTab = newTab => {
        setTab(newTab)
    }

    // Fetch TableMap
    const getData = () => {
        api.get('/apps/editor/models/table-map-old', {
            params: {
                subdomain: appid,
                db_id: db_id
            },
            signal: dataController.signal
        }).then(res => {
            setData(res.data.data)
        }).catch(err => {
            console.error(err)
            if (err.response) {
                if (err.response.status === 403) {
                    Cookies.remove('session')
                    toast.warning(`Please login again`)
                    dispatch({ type: 'RESET' })
                    history.push(`/auth/login?redirect=/apps/${appid}/data-sources/${db_id}`)
                } else if (err.response.status === 400) {
                    toast.error('Error 400 | Bad Request')
                } else if (err.response.status === 404) {
                    toast.error('Error 404 | Not Found')
                } else if (err.response.status === 500) {
                    toast.error('Error 500 | Internal Server Error')
                }
            }
        })
    }

    const getDatabaseDetails = async () => {
        try {
            const response = await api.get('/databases/details', {
                params: {
                    db_id: props.db_id,
                    subdomain: props.appid
                },
                signal: detailsController.signal
            })
            setDetails(response.data.data)
            if (response.data.data) {
                if (isSubdomainIsSandbox(appid)){
                    setTab('schema-tables')
                } else {
                    setTab('overview')
                }
            }
            // if (response.data.data) {
            //     setTab('overview')
            // }
        } catch (error) {
            catchError(error)
        }
    }

    const reSyncSchema = () => {
        setResync(true)
        api.post('/databases/resync-schema', {
            db_id: props.db_id,
            subdomain: props.appid,
        }, {
            signal: resyncController.signal
        }).then(() => {
            toast.success(`Re-Sync Successful`)
            getDatabaseDetails()
        }).catch(err => {
            catchError(err)
        }).finally(()=>{
            setResync(false)
        })
    }

    const renderData = () => {
        if(data) {
            return(
                <>
                    <Nav tabs>
                        {
                            details && !isSubdomainIsSandbox(appid)
                            ?
                            <NavItem className='query-right-nav cursor-pointer'>
                                <NavLink
                                    className={ tab !== 'overview' ? 'active' : '' }
                                    onClick={() => tab !== 'overview' ? changeTab('overview') : ''}
                                >
                                    Overview <FontAwesomeIcon icon={faInfoCircle} />
                                </NavLink>
                            </NavItem>
                            :
                            ''
                        }
                        <NavItem
                            className='query-right-nav cursor-pointer'
                            id="query"
                        >
                            <NavLink
                                className={ tab !== 'schema-tables' ? 'active' : '' }
                                onClick={() => tab !== 'schema-tables' ? changeTab('schema-tables') : ''}
                            >
                                Tables <FontAwesomeIcon icon={faTable} />
                            </NavLink>
                        </NavItem>
                        <NavItem
                            className='query-right-nav cursor-pointer'
                        >
                            <NavLink
                                className={ tab !== 'schema' ? 'active' : '' }
                                onClick={() => tab !== 'schema' ? changeTab('schema') : ''}
                            >
                                Schema <FontAwesomeIcon icon={faSitemap} />
                            </NavLink>
                        </NavItem>
                    </Nav>
                    <div className={`${tab}-list`}>
                        <TabContent
                            className='query-right-tab'
                            activeTab={tab}
                        >
                            {
                                details   && !isSubdomainIsSandbox(appid)
                                ?
                                <TabPane tabId='overview'>
                                    <div
                                        className='databases-list'
                                        style={{ margin: '0 auto' }}
                                    >
                                        <CardHeader>
                                            <h2 className='apps-heading'>Overview</h2>
                                            {/* <RenderResync/> */}
                                        </CardHeader>
                                        <CardBody>
                                            <Overview
                                                appid={appid}
                                                db_id={db_id}
                                                details={details}
                                                resync={resync}
                                                reSyncSchema={reSyncSchema}
                                            />
                                        </CardBody>
                                    </div>
                                </TabPane>
                                :
                                ''
                            }
                            <TabPane tabId='schema-tables'>
                                <SchemaTable
                                    data={data.tables}
                                />
                            </TabPane>
                            <TabPane tabId='schema'>
                                <Schema
                                    appid={appid}
                                    db_id={db_id}
                                    data={data} 
                                    tabId={tab}
                                />
                            </TabPane>
                        </TabContent>
                    </div>
                </>
            )
        } else {
            return(
                <div className='loading-div'>
                    <Spinner
                        className='loading-spinner'
                        color="primary"
                        type="grow"
                    />
                </div>
            )
        }
    }

    return(
        <>
            <Helmet>
                <title>
                    {data ? data.db_name : 'Loading...'} | QueryDeck
                </title>
            </Helmet>
            <Header
                mode='api'
                section='Database'
                subdomain={props.subdomain}
            />
            <div className='list-deck'>
                <Menu appid={appid} />
                <Card className='list-card-main'>
                    {renderData()}
                </Card>
            </div>
        </>
    )
}

export default Database