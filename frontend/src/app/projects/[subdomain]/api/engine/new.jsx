// React imports
import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  setDatabasesList,
  setNew,
  setDatabase,
  setAppAuth,
  setTablesList,
  setNodes,
  setFilterNodes,
  setJoinGraphs,
  setResult
} from '../../../../../lib/data/dataSlice'

// Library imports
// import CryptoJS from 'crypto-js'
import Cookies from 'js-cookie'
// import ReactJoyride from 'react-joyride'
import { toast } from 'react-toastify'

// Custom libraries
import { useResizable } from '@ag_meq/rrl'

// Components
import Menu from '../../../../../components/interface/menu/Menu'
import Header from '../../components/sections/engine/header'
import Left from '../../components/sections/engine/left'
// import Right from '../../components/sections/engine/right'
import Details from '../../components/sections/engine/details'
// import WizardModal from '../../components/modals/wizard'
// import Tooltip, { apiBuilderSteps } from '../../../../../components/interface/tour/Tooltip'

// API
import axios from 'axios'
import api, { apiurl } from '../../../../../api'

// Secret
// import secret from '../../../../../secret'

// Controllers
let appAuthController
let databasesController
let tablesController
let nodesController
let searchNodesController
let filtersController
let joinGraphsController
let apiController

export function APInew (props) {
  // Redux
  const databases = useSelector(state => state.data.databases[props.subdomain]?.list)
  const state = useSelector(state => state.data.api[props.subdomain]?.new)
  const dispatch = useDispatch()

  const history = useHistory()

  // Session
  // let session = {}
  // if(Cookies.get('session')) {
  //     session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get('session'), secret).toString(CryptoJS.enc.Utf8))
  // }

  useEffect(() => {
    appAuthController = new AbortController()
    databasesController = new AbortController()
    tablesController = new AbortController()
    nodesController = new AbortController()
    searchNodesController = new AbortController()
    filtersController = new AbortController()
    joinGraphsController = new AbortController()

    if (!state) {
      dispatch(setNew({
        mode: 'api',
        subdomain: props.subdomain
      }))
    }

    if (!databases?.length) {
      getDatabases()
    }

    return () => {
      appAuthController.abort()
      databasesController.abort()
      tablesController.abort()
      nodesController.abort()
      searchNodesController.abort()
      filtersController.abort()
      joinGraphsController.abort()
    }
  }, [])

  // Handles positioning the separator between LHS/RHS
  const { isDragging, position, separatorProps } = useResizable({
    axis: 'x',
    initial: Math.max(400, (window.innerWidth - 4 - 4)/5),
    max: Math.min((window.innerWidth - 4 - 4) - 400, 3*(window.innerWidth - 4 - 4)/5),
    min: Math.max(400, (window.innerWidth - 4 - 4)/5)
  })

  ///// Network requests /////
  const catchError = error => {
    if(error.response) {
      if(error.response.data.meta.status === 403) {
        Cookies.remove('session')
        toast.warning(`Please login again`)
        dispatch({ type: 'RESET' })
        history.push(`/auth/login?redirect=/apps/${props.subdomain}/api/new`)
      } else if(error.response.data.meta.status === 400) {
        toast.error('Error 400 | Bad Request')
      } else if(error.response.data.meta.status === 404) {
        toast.error('Error 404 | Not Found')
      } else if(error.response.data.meta.status === 500) {
        toast.error('Error 500 | Internal Server Error')
      } else {
        toast.error('Something went wrong')
      }
    } else {
      console.error(error)
    }
  }

  // Databases List
  const getDatabases = async () => {
    try {
      const response = await api.get('/databases', {
        params: {
          subdomain: props.subdomain
        },
        signal: databasesController.signal
      })
      const data = response.data.data
      dispatch(setDatabasesList({
        databases: data.databases,
        mode: 'api',
        subdomain: props.subdomain
      }))
      // if (data.databases.length === 1 && (state?.database && !Object.keys(state?.database).length)) {
        dispatch(setDatabase({
          database: {
            label: data.databases[0].name,
            value: data.databases[0].db_id
          },
          mode: 'api',
          query_id: 'new',
          subdomain: props.subdomain
        }))
      // }
    } catch (error) {
      catchError(error)
    }
  }

  useEffect(() => {
    if (state?.database?.value) {
      getAppAuth()
      getTables()
    }
  }, [state?.database])

  // App auth
  const getAppAuth = async () => {
    try {
      const response = await api.get('/apps/editor/controllers/app-auth', {
        params: {
          subdomain: props.subdomain
        },
        signal: appAuthController.signal
      }
    )
    const data = response.data.data
    const appAuth = data
    if(data?.user_session_object && data?.user_session_object.column_id){ 
     // add user session object
      appAuth.session_key_values = appAuth.session_key_values || {}
      appAuth.session_key_values[data.user_session_object.column_id] = data.user_session_object      
      appAuth.session_key_values[data.user_session_object.column_id].isAuthColumn = true
    }

    dispatch(setAppAuth({
      appAuth, 
      authentication: Object.keys(appAuth).length ? {
        label: 'Enabled',
        value: true,
      } : {
        label: 'Disabled',
        value: false,
      },
      mode: 'api',
      query_id: 'new',
      subdomain: props.subdomain
    }))
    } catch (error) {
      catchError(error)
    }
  }

  // Base Tables List
  const getTables = async () => {
    try {
      const response = await api.get('/apps/editor/controllers/ops', {
        params: {
          db_id: state.database?.value,
          subdomain: props.subdomain
        },
        signal: tablesController.signal
      })
      const data = response.data.data
      dispatch(setTablesList({
        mode: 'api',
        query_id: 'new',
        subdomain: props.subdomain,
        tables: data.tables,
        operators: data.types
      }))
    } catch (error) {
      catchError(error)
    }
  }

  useEffect(() => {
    if (state?.base?.value) {
      // Prevent after render to make data persist correctly
      if (state?.nodes[0]?.id !== state?.base?.value) {
        getNodes(state.base.value)
      }
    }
  }, [
    state?.base,
    state?.method?.value
  ])

  // Nodes List
  const getNodes = async(node) => {
    try {
      const response = await api.get('/apps/editor/controllers/nodes', {
        params: {
          db_id: state.database.value,
          id: node,
          qm: 'select',
          subdomain: props.subdomain
        },
        signal: nodesController.signal
      })
      const data = response.data.data
      dispatch(setNodes({
        query_id: 'new',
        mode: 'api',
        node,
        nodes: data,
        subdomain: props.subdomain
      }))
    } catch (error) {
      catchError(error)
    }
  }

  // Search Nodes
  const searchNodes = term => (
    api.get('/apps/editor/controllers/nodes-search', {
      params: {
        subdomain: props.subdomain,
        db_id: state?.database?.value,
        id: state?.base?.value,
        qm: 'select',
        search_query: term
      },
      signal: searchNodesController.signal
    }).then(res => {
      const data = res.data.data
      const result = data.map(element => ({
        label: element.text + (element.table_join_path ? `  ( ${element.table_join_path} )` : ''),
        id: element.tableId,
        options: element.nodes.map(node => ({
          ...node,
          label: node.text,
          value: node.id,
          tableLabel: element.text
        })).sort((a, b) => a.label.localeCompare(b.label))
      }))
      return result
    }).catch(error => {
      catchError(error)
    })
  )

  useEffect(() => {
    if (state?.method?.value) {
      switch (state.method.value) {
        case 'select':
        case 'select_id':
        case 'update':
        case 'delete':
          getFilters()
          getJoinGraphs()
          break
        default:
          // console.error(`Unknown method: ${state.method.value}`)
          break
      }
    }
  }, [state?.method])

  // Filter Conditions
  const getFilters = async () => {
    try {
      const response = await api.post('/apps/editor/controllers/where-cols', {
        agg_paths: Object.keys(state.agg_paths),
        c: [{ id: `${state.base.value}.1` }],
        db_id: state.database.value,
        subdomain: props.subdomain
    }, {
      signal: filtersController.signal
    })
    const data = response.data.data
    dispatch(setFilterNodes({
      filterFields: [{
        label: data.table,
        options: data.columns
      }],
      query_id: 'new',
      mode: 'api',
      subdomain: props.subdomain
    }))
    } catch (error) {
      catchError(error)
    }
  }

  // Join graphs
  const getJoinGraphs = async () => {
    try {
      const response = await api.get('/apps/editor/join-graph', {
        params: {
          subdomain: props.subdomain,
          id: state.base.value,
          db_id: state.database.value
        },
        signal: joinGraphsController.signal
      })
      dispatch(setJoinGraphs({
        joinGraphs: response.data.data,
        query_id: 'new',
        mode: 'api',
        subdomain: props.subdomain
      }))
    } catch (error) {
      catchError(error)
    }
  }

  // To trigger sql-gen when joinConditions are modified
  const joinConditions = state?.joinConditions
  let joinConditionsCount = 0
  joinConditions && Object.keys(joinConditions).forEach(table => {
    if (joinConditions[table].filters !== '{}') {
      joinConditionsCount += joinConditions[table].filters.length
    }
  })

  const joinKeys = state?.joinKeys
  let joinKeysList = ''
  joinKeys && Object.values(joinKeys).forEach(table => {
    joinKeysList = joinKeysList.concat(table)
  })

  const conflictColumns = state?.conflictColumns
  let constraints = ''
  let conflictCount = 0
  conflictColumns && Object.keys(conflictColumns).forEach(table => {
    constraints = constraints.concat(conflictColumns[table].constraint)
    conflictCount += conflictColumns[table].columns?.length
  })

  useEffect(() => {
    if (state?.columns.length && state?.method.value) {
      generateAPI()
    }
  }, [
    state?.joins?.length,
    state?.columns?.length,
    (state?.agg_paths && Object.keys(state?.agg_paths)?.length),
    joinKeysList,
    (state?.multipleRowsHash && Object.keys(state?.multipleRowsHash)?.length),
    state?.columns?.filter(column => column.required).length,
    constraints,
    conflictCount,
    joinConditionsCount,
    state?.returnColumns?.length,
    state?.sorts?.length,
    state?.sorts_dynamic?.length,
    // state?.pagination?.value,
    state?.offset,
    state?.offset_dynamic,
    state?.limit,
    state?.limit_dynamic,
    state?.filters
  ])

  // const getAggregatePaths = () => {
  //   const result = {}
  //   state.columns.forEach(column => {
  //     if (column.id.includes('-')) {
  //       result[column.id.split('$')[0]] = true
  //     }
  //   })
  //   return Object.keys(result)
  // }

  // Generate API
  const generateAPI = async () => {
    try {
      // Generator
      const apiGenerator = (apiConfig = {}) => {
        if (apiController) {
          apiController.cancel('Next api request fired')
        }
        apiController = axios.CancelToken.source()
    
        apiConfig.cancelToken = apiController.token
        return axios(apiConfig)
      }
      // Config
      let config = {
        // agg_paths: Object.keys(state.agg_paths),
        agg_paths: [],
        base: state.base.value,
        c: state.columns,
        db_id: state.database.value,
        join_type: state.joinKeys,
        method: state.method.value.split('_')[0],
        subdomain: props.subdomain
      }
      // Different params for different methods
      switch (state.method.method) {
        case 'GET': {
          const joinConditions = state?.joinConditions
          const join_conditions = {}
          Object.keys(joinConditions).forEach(table => {
            if (joinConditions[table].filters !== '{}') {
              join_conditions[table] = JSON.parse(joinConditions[table].filters)
            }
          })
          const w = Object.keys(JSON.parse(state?.filters)).length
          config = {
            ...config,
            join_conditions,
            offset: state.offset,
            offset_dynamic: state.offset_dynamic,
            limit: state.limit,
            limit_dynamic: state.limit_dynamic,
            orderby: state.sorts.map(element => ({
              asc: element.order,
              id: element.column.id,
              label: element.column.label
            })),
            orderby_dynamic_columns: state.sorts_dynamic.map(element => ({
              id: element.id
            })),
            // pagination: state.pagination.value
          }
          if (w) {
            config = {
              ...config,
              w: JSON.parse(state?.filters)
            }
          }
          break
        }
        case 'POST': {
          config = {
            ...config,
            allow_multiple_row_paths: Object.keys(state.multipleRowsHash),
            on_conflict: state.conflictColumns,
            return_c: state.returnColumns
          }
          break
        }
        case 'PUT':
        case 'DELETE': {
          const w = Object.keys(JSON.parse(state?.filters)).length
          config = {
            ...config,
            return_c: state.returnColumns
          }
          if (w) {
            config = {
              ...config,
              w: JSON.parse(state?.filters)
            }
          }
          break
        }
        default:
          console.error(`Unknown method: ${state.method.method}`)
          break
      }

      if (state.method.value === 'select_id') {
        config['select_by_id'] = true
      }

      const apiConfig = {
        method: 'POST',
        url: `${apiurl}/apps/editor/controllers/sql-gen`,
        data: config,
        withCredentials: true
      }
      const response = await apiGenerator(apiConfig)
      const data = response.data.data
      dispatch(setResult({
        mode: 'api',
        query_id: 'new',
        authenticationEnabled: Boolean(!data[3].content.query.session_vars_used.length),
        authorisation: data[3].content.roles,
        filtersCount: data[3].content.model.condition_count,
        name: data[3].content.docs.title,
        queryParams: data[3].content.query.request_query_params,
        request: data[0].content,
        request_detailed: data[0].content_detailed,
        response: data[1].content,
        response_detailed: data[1].content_detailed,
        subdomain: props.subdomain,
        text: data[2].content
      }))
    } catch (error) {
      catchError(error)
    }
  }

  return (
    <>
      <Helmet>
        <title>
          {`${state?.route} | API | QueryDeck`}
        </title>
      </Helmet>
      <Header
        mode='api'
        query_id='new'
        subdomain={props.subdomain}
      />
      <div className='core'>
        <Menu appid={props.subdomain} />
        <div className='api-engine'>
          <Left
            catchError={catchError}
            dragging={isDragging}
            // getAggregatePaths={getAggregatePaths}
            mode='api'
            query_id='new'
            searchNodes={searchNodes}
            subdomain={props.subdomain}
            width={position - 48 - 8 - 8}
          />
          <div
            className='separator separator-horizontal'
            {...separatorProps}
          />
          <Details
            dragging={isDragging}
            mode='api'
            query_id='new'
            subdomain={props.subdomain}
            width={window.innerWidth - 4  - 4 - position}
          />
        </div>
      </div>
    </>
  )
}