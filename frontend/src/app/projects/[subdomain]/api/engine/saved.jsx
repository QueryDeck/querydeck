// React imports
import React, {
  useEffect,
  useRef
} from 'react'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  setAppAuth,
  setDatabase,
  setJoinGraphs,
  restoreAPI,
  restoreNodes,
  restoreFilters,
  setResult,
  setSaved,
  setTablesList,
} from '../../../../../lib/data/dataSlice'

// Library imports
import Cookies from 'js-cookie'
import { toast } from 'react-toastify'

// Custom libraries
import { useResizable } from '@ag_meq/rrl'

// Components
import Menu from '../../../../../components/interface/menu/Menu'
import Header from '../../components/sections/engine/header'
import Left from '../../components/sections/engine/left'
// import Right from '../../components/sections/engine/right'
import Details from '../../components/sections/engine/details'

// API
import axios from 'axios'
import api, { apiurl } from '../../../../../api'

// Controllers
let appAuthController
let loadDatabaseController
let loadAPIcontroller
let searchNodesController
let joinGraphsController
let loadNodesController
let loadFiltersController
let apiController
let tablesController

export function APIsaved (props) {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const history = useHistory()

  const loadingRef = useRef({
    api: true,
    tables: true,
    appAuth: true,
    joinGraphs: true,
    nodes: true,
    filters: true
  })

  useEffect(() => {
    appAuthController = new AbortController()
    joinGraphsController = new AbortController()
    loadDatabaseController = new AbortController()
    loadNodesController = new AbortController()
    loadFiltersController = new AbortController()
    loadAPIcontroller = new AbortController()
    searchNodesController = new AbortController()
    tablesController = new AbortController()
    if (!state) {
      dispatch(setSaved({
        mode: 'api',
        query_id: props.query_id,
        subdomain: props.subdomain
      }))
    }

    if (!state?.database?.value) {
      loadDatabase()
    }

    return () => {
      appAuthController.abort()
      joinGraphsController.abort()
      loadDatabaseController.abort()
      loadNodesController.abort()
      loadFiltersController.abort()
      loadAPIcontroller.abort()
      searchNodesController.abort()
      tablesController.abort()
    }
  }, [])

  // Handles positioning the separator between LHS/RHS
  const { isDragging, position, separatorProps } = useResizable({
    axis: 'x',
    initial: Math.max(400, (window.innerWidth - 4 - 4)/5),
    max: Math.min((window.innerWidth - 4 - 4) - 400, 3*(window.innerWidth - 4 - 4)/5),
    min: Math.max(400, (window.innerWidth - 4 - 4)/5)
  })

  useEffect(() => {
    if (state?.database?.value && !state?.method.value) {
      loadAPI()
    }
  }, [state?.database])

  ///// Network requests /////
  const catchError = error => {
    if(error.response) {
      if(error.response.data.meta.status === 403) {
        Cookies.remove('session')
        toast.warning(`Please login again`)
        dispatch({ type: 'RESET' })
        history.push(`/auth/login?redirect=/apps/${props.subdomain}/api/${props.query_id}`)
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

  const loadDatabase = async () => {
    try {
      const response = await api.get('/apps/editor/controllers/saved-query-db', {
        params: {
          apiMode: true,
          query_id: props.query_id
        },
        signal: loadDatabaseController.signal
      })
      const data = response.data.data
      dispatch(setDatabase({
        database: {
          label: data.db_name,
          value: data.db_id
        },
        mode: 'api',
        query_id: props.query_id,
        subdomain: props.subdomain
      }))
    } catch (error) {
      catchError(error)
    }
  }

  const loadAPI = async () => {
    if (loadingRef.current.api) {
      try {
        const response = await api.get('/apps/editor/controllers/api-queries', {
          params: {
            db_id: state.database?.value,
            query_id: props.query_id,
            subdomain: props.subdomain
          },
          signal: loadAPIcontroller.signal
        })
        const data = response.data.data
        dispatch(restoreAPI({
          query_id: props.query_id,
          state: data.data,
          subdomain: props.subdomain
        }))
        loadingRef.current.api = false
      } catch (error) {
        catchError(error)
      }
    }
  }

  useEffect(() => {
    if (state?.method?.value && !state?.nodes.length) { // added check to trigger it after restoreAPI
      getAppAuth()
      getTables()
      getJoinGraphs()
      loadNodes()
      loadFilters()
    }
  }, [state?.method])

  // App auth
  const getAppAuth = async () => {
    if (loadingRef.current.appAuth) {
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
        mode: 'api',
        query_id: props.query_id,
        subdomain: props.subdomain
      }))
      loadingRef.current.appAuth = false
      } catch (error) {
        catchError(error)
      }
    }
  }

  // Base Tables List
  const getTables = async () => {
    if (loadingRef.current.tables) {
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
          query_id: props.query_id,
          subdomain: props.subdomain,
          tables: data.tables,
          operators: data.types
        }))
        loadingRef.current.tables = false
      } catch (error) {
        catchError(error)
      }
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

  // Join graphs
  const getJoinGraphs = async () => {
    if (loadingRef.current.joinGraphs) {
      try {
        const response = await api.get('/apps/editor/join-graph', {
          params: {
            subdomain: props.subdomain,
            id: state.base.value,
            db_id: state?.database?.value
          },
          signal: joinGraphsController.signal
        })
        dispatch(setJoinGraphs({
          joinGraphs: response.data.data,
          query_id: props.query_id,
          mode: 'api',
          subdomain: props.subdomain
        }))
        loadingRef.current.joinGraphs = false
      } catch (error) {
        catchError(error)
      }
    }
  }

  // Loads all filters
  const loadNodes = async () => {
    if (loadingRef.current.nodes) {
      try {
        const response = await api.post('/apps/editor/controllers/load-all-nodes', {
          id: [...state?.checkedKeys?.checked, state?.base?.value],
          db_id: state?.database?.value,
          subdomain: props.subdomain,
          qm: 'select'
        }, {
          signal: loadNodesController.signal
        })
        const data = response.data.data
        dispatch(restoreNodes({
          data,
          query_id: props.query_id,
          mode: 'api',
          subdomain: props.subdomain
        }))
        loadingRef.current.nodes = false
      } catch (error) {
        catchError(error)
      }
    }
  }

  // Loads all filters
  const loadFilters = async () => {
    if (loadingRef.current.filters) {
      try {
        const response = await api.post('/apps/editor/controllers/load-all-where-cols', {
          agg_paths: Object.keys(state?.agg_paths),
          base: `${state?.base?.value}.1`,
          joinConditions: state?.checkedKeys?.checked,
          db_id: state?.database?.value,
          subdomain: props.subdomain,
        }, {
          signal: loadFiltersController.signal
        })
        const data = response.data.data
        dispatch(restoreFilters({
          filterFields: [{
            label: data.base.table,
            options: data.base.columns
          }],
          joinConditions: data.joinConditions,
          query_id: props.query_id,
          mode: 'api',
          subdomain: props.subdomain
        }))
        loadingRef.current.filters = false
      } catch (error) {
        catchError(error)
      }
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
        query_id: props.query_id,
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
    <div className='core'>
      <Helmet>
        <title>
          {`${state?.route} | API | QueryDeck`}
        </title>
      </Helmet>
      <Menu appid={props.subdomain} />
      <div>
        <Header
          mode='api'
          query_id={props.query_id}
          subdomain={props.subdomain}
        />
        <div className='api-engine'>
          <Left
            catchError={catchError}
            dragging={isDragging}
            // getAggregatePaths={getAggregatePaths}
            mode='api'
            query_id={props.query_id}
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
            query_id={props.query_id}
            subdomain={props.subdomain}
            width={window.innerWidth - 4 - 4 - position}
          />
        </div>
      </div>
    </div>
  )
}