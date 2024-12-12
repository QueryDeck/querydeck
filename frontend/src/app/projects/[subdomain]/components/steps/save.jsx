// React imports
import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  setNew,
  updateDeploymentDiff
} from '../../../../../lib/data/dataSlice'

// Library imports
import {
  faBan,
  faEraser,
  faSave
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CryptoJS from 'crypto-js'
import Cookies from 'js-cookie'
import { Button } from 'reactstrap'
import { toast } from 'react-toastify'

// API
import axios from 'axios'
import api, { apiurl, apiBase } from '../../../../../api'

// Secret
import secret from '../../../../../secret'

// Controllers
let deploymentDiffController
let tourController
let createQueryController
let updateQueryController

const Save = props => {
  // Redux
  const listState = useSelector(state => state.data[props.mode][props.subdomain])
  const state = listState?.[props.query_id]
  const dispatch = useDispatch()

  const history = useHistory()

  // Session
  let session = {}
  if(Cookies.get('session')) {
    session = JSON.parse(CryptoJS.AES.decrypt(Cookies.get('session'), secret).toString(CryptoJS.enc.Utf8))
  }

  useEffect(() => {
    deploymentDiffController = new AbortController()
    tourController = new AbortController()

    return () => {
      deploymentDiffController.abort()
      tourController.abort()
    }
  })

  const getDeploymentDiff = async (createMode = false) => {
    try {
      const response = await api.get("/apps/git/diff", {
        params: {
          subdomain: props.subdomain,
        },
        signal: deploymentDiffController.signal,
      })
      dispatch(updateDeploymentDiff({
        subdomain:  props.subdomain,
        diff: response.data.data.diff
      }))
      if (createMode) {
        dispatch(setNew({
          mode: props.mode,
          subdomain: props.subdomain
        }))
        history.push(`/apps/${props.subdomain}/api`)
      }
    } catch (error) {
      props.catchError(error);
    }
  }

  const finishTour = async () => {
    try {
      await api.put('/account/details', {
        api_project: true,
        preference: {}
      }, {
        signal: tourController.signal
      })
      Cookies.set('session', CryptoJS.AES.encrypt(JSON.stringify({
        ...session,
        preferences: {
          ...session.preferences,
          tour: 'done'
        }
      }), secret), { expires: 7 }, { sameSite: 'strict' })
      createQuery()
    } catch (error) {
      props.catchError(error)
    }
  }

  const createQuery = async () => {
    try {
      // Generator
      const create = (apiConfig = {}) => {
        if (createQueryController) {
          createQueryController.cancel('Request overridden')
        }
        createQueryController = axios.CancelToken.source()

        apiConfig.cancelToken = createQueryController.token
        return axios(apiConfig)
      }
      const formattedJoinConditions = {}
      Object.keys(state.joinConditions).forEach(element => {
        formattedJoinConditions[element] = {
          filterFields: [],
          filters: state.joinConditions[element].filters ? state.joinConditions[element].filters : '{}'
        }
      })
      // Config
      let config = {
        data: {
          name: state.name,
          method: state.method,
          route: state.route,
          base: state.base,
          expandedKeys: state.expandedKeys,
          checkedKeys: state.checkedKeys,
          columns: state.columns,
          joinConditions: formattedJoinConditions,
          conflictColumns: state.conflictColumns,
          returnColumns: state.returnColumns,
          multipleRowsHash: state.multipleRowsHash,
          filters: state.filters,
          pagination: state.pagination,
          authentication: state.authentication,
          sorts: state.sorts,
          sorts_dynamic: state.sorts_dynamic,
          offset: state.offset,
          offset_dynamic: state.offset_dynamic,
          limit: state.limit,
          limit_dynamic: state.limit_dynamic,

          request: state.request,
          request_detailed: state.request_detailed,
          response: state.response,
          response_detailed: state.response_detailed,
          text: state.text
        },
        // agg_paths: Object.keys(state.agg_paths),
        agg_paths: [],
        apiRoute: state.route,
        base: state.base.value,
        c: state.columns,
        db_id: state.database.value,
        deployed: true,
        execute: true,
        join_type: state.joinKeys,
        method: state.method.value.split('_')[0],
        name: state.route,
        subdomain: props.subdomain,
        auth_required: state.authentication.value,
      }
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
            pagination: state.pagination.value,
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
      const createConfig = {
        method: 'POST',
        url: props.mode === 'api' ? `${apiurl}/apps/editor/controllers/saved-api-query` : `${apiurl}/apps/editor/controllers/saved-query`,
        data: config,
        withCredentials: true
      }
      await create(createConfig)
      navigator.clipboard.writeText(`https://${props.subdomain}.${apiBase}${state.route}`)
      getDeploymentDiff(true)
      toast.success('API saved successfully!')
    } catch (error) {
      if (error.response.status === 400) {
        toast.warn(`API already exists for '${state?.route}'`)
      } else {
        props.catchError(error)
      }
    }
  }

  const updateQuery = async () => {
    try {
      // Generator
      const update = (apiConfig = {}) => {
        if (updateQueryController) {
          updateQueryController.cancel('Request overridden')
        }
        updateQueryController = axios.CancelToken.source()

        apiConfig.cancelToken = updateQueryController.token
        return axios(apiConfig)
      }
      const formattedJoinConditions = {}
      Object.keys(state.joinConditions).forEach(element => {
        formattedJoinConditions[element] = {
          filterFields: [],
          filters: state.joinConditions[element].filters ? state.joinConditions[element].filters : '{}'
        }
      })
      // Config
      let config = {
        data: {
          name: state.name,
          method: state.method,
          route: state.route,
          base: state.base,
          expandedKeys: state.expandedKeys,
          checkedKeys: state.checkedKeys,
          columns: state.columns,
          joinConditions: formattedJoinConditions,
          conflictColumns: state.conflictColumns,
          returnColumns: state.returnColumns,
          multipleRowsHash: state.multipleRowsHash,
          filters: state.filters,
          pagination: state.pagination,
          authentication: state.authentication,
          sorts: state.sorts,
          sorts_dynamic: state.sorts_dynamic,
          offset: state.offset,
          offset_dynamic: state.offset_dynamic,
          limit: state.limit,
          limit_dynamic: state.limit_dynamic,

          request: state.request,
          request_detailed: state.request_detailed,
          response: state.response,
          response_detailed: state.response_detailed,
          text: state.text
        },
        // agg_paths: Object.keys(state.agg_paths),
        agg_paths: [],
        apiRoute: state.route,
        base: state.base.value,
        c: state.columns,
        db_id: state.database.value,
        deployed: true,
        execute: true,
        join_type: state.joinKeys,
        method: state.method.value.split('_')[0],
        name: state.route,
        query_id: props.query_id,
        subdomain: props.subdomain,
        auth_required: state.authentication.value,
      }
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
            pagination: state.pagination.value,
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
        case 'PUT': {
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
      const updateConfig = {
        method: 'PUT',
        url: props.mode === 'api' ? `${apiurl}/apps/editor/controllers/saved-api-query` : `${apiurl}/apps/editor/controllers/saved-query`,
        data: config,
        withCredentials: true
      }
      await update(updateConfig)
      navigator.clipboard.writeText(`https://${props.subdomain}.${apiBase}${state.route}`)
      getDeploymentDiff()
      toast.success('API updated successfully!')
    } catch (error) {
      props.catchError(error)
    }
  }

  const clickHandler = () => {
    switch(props.query_id) {
      case 'new':
        finishTour()
        break
      default:
        updateQuery()
        break
    }
  }

  return (
    <>
        {
          (props.query_id === 'new' ||
          !listState.select_preview) &&
          <Button
            color='falcon-danger'
            onClick={() => history.push(`/apps/${props.subdomain}/api`)}
            size='sm'
          >
            <FontAwesomeIcon icon={faBan} /> Cancel
          </Button>
        }
        {
          props.query_id === 'new'
          &&
          <Button
            color='falcon-danger'
            onClick={() => dispatch(setNew({
              mode: props.mode,
              subdomain: props.subdomain
            }))}
            size='sm'
          >
            <FontAwesomeIcon icon={faEraser} /> Reset
          </Button>
        }
        <Button
          color='primary'
          onClick={clickHandler}
          disabled={!(state?.base?.value && state?.method?.value && state?.text.length)}
          size='sm'
        >
          <FontAwesomeIcon icon={faSave} /> Save
        </Button>
    </>
  )
}

export default Save