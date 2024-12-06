// React imports
import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  setDatabase,
  selectDeleteAPIlist,
  selectPreviewAPIlist,
  restoreAPI
} from '../../../../../../lib/data/dataSlice'

// Library imports
import {
  faPen,
  faTrash
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Badge,
  Button,
  ButtonGroup
} from 'reactstrap'

// API
import api from '../../../../../../api'

// Controllers
let loadDatabaseController
let loadAPIcontroller

const Item = props => {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain])
  const dispatch = useDispatch()

  const history = useHistory()

  useEffect(() => {
    loadDatabaseController = new AbortController()
    loadAPIcontroller = new AbortController()

    return () => {
      loadDatabaseController.abort()
      loadAPIcontroller.abort()
    }
  }, [])

  // Gets database id of query
  const loadDatabase = async (query_id, redirect = false) => {
    try {
      const response = await api.get('/apps/editor/controllers/saved-query-db', {
        params: {
          apiMode: true,
          query_id
        },
        // signal: loadDatabaseController.signal // temporarily disabled till i find a solution to preview/edit apis after filtering
      })
      const data = response.data.data
      dispatch(setDatabase({
        database: {
          label: data.db_name,
          value: data.db_id
        },
        mode: 'api',
        query_id,
        subdomain: props.subdomain
      }))
      loadAPI(data.db_id, query_id, redirect)
    } catch (error) {
      props.catchError(error)
    }
  }

  // Gets data to populate ui
  const loadAPI = async (db_id, query_id, redirect) => {
    try {
      const response = await api.get('/apps/editor/controllers/api-queries', {
        params: {
          db_id,
          query_id,
          subdomain: props.subdomain
        },
        // signal: loadAPIcontroller.signal // temporarily disabled till i find a solution to preview/edit apis after filtering
      })
      const data = response.data.data
      dispatch(restoreAPI({
        query_id,
        state: data.data,
        subdomain: props.subdomain
      }))
      if (redirect) {
        history.push(`/apps/${props.subdomain}/api/${props.item.query_id}`)
      }
    } catch (error) {
      props.catchError(error)
    }
  }

  const previewAPI = () => {
    loadDatabase(props.item.query_id)
    dispatch(selectPreviewAPIlist({
      select_preview: props.item,
      subdomain: props.subdomain
    }))
  }

  const editAPI = () => {
    loadDatabase(props.item.query_id, true)
  }

  return(
    <div className={`api-saved-list-item${state?.select_preview?.query_id === props.item?.query_id ? '-active' : ''}`}>
      <div className='api-saved-list-item-api'>
        <div
          className='api-saved-list-item-method'
          onClick={previewAPI}
        >
          <span style={{ paddingLeft: '4px' }}>
            {props.item.auth_required ? '🔐 ' : '🌐 '}
          </span>
          <Badge className={`api-saved-list-item-badge-${props.resolveMethod(props.item.method)}`}>
            {props.resolveMethod(props.item.method)?.toUpperCase()}
          </Badge>
        </div>
        <div
          className='api-saved-list-item-route'
          onClick={previewAPI}
        >
          {props.item.apiRoute}
        </div>
        <div className='api-saved-list-item-actions'>
          <ButtonGroup>
            <Button
              className='api-saved-list-item-action'
              color='falcon-primary'
              onClick={editAPI}
              size='sm'
            >
              <FontAwesomeIcon icon={faPen} />
            </Button>
            <Button
              className='api-saved-list-item-action'
              color='falcon-danger'
              onClick={() => dispatch(selectDeleteAPIlist({
                select_delete: props.item,
                subdomain: props.subdomain
              }))}
              size='sm'
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}

export default Item