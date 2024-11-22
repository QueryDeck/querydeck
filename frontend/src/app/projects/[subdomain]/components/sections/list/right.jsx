// React imports
import React, { useEffect } from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  updateAPIlist
} from '../../../../../../lib/data/dataSlice'

// Library imports
import {
  Badge,
  Card,
  Spinner
} from 'reactstrap'
import ReactJson from 'react-json-view'
import { toast } from 'react-toastify'

// API
import api, { apiBase } from '../../../../../../api'

// Controllers
let loadDatabaseController
let loadAPIcontroller

const Right = props => {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain])
  const dispatch = useDispatch()

  useEffect(() => {
    loadDatabaseController = new AbortController()
    loadAPIcontroller = new AbortController()

    if (state?.select_preview?.query_id && !state?.select_preview?.data) {
      loadDatabase(state?.select_preview?.query_id)
    }

    return () => {
      loadDatabaseController.abort()
      loadAPIcontroller.abort()
    }
    // eslint-disable-next-line
  }, [state?.select_preview])

  const loadDatabase = async (query_id) => {
    try {
      const response = await api.get('/apps/editor/controllers/saved-query-db', {
        params: {
          apiMode: true,
          query_id
        },
        signal: loadDatabaseController.signal
      })
      const data = response.data.data
      loadAPI(data.db_id, query_id)
    } catch (error) {
      props.catchError(error)
    }
  }

  const loadAPI = async (db_id, query_id) => {
    try {
      const response = await api.get('/apps/editor/controllers/api-queries', {
        params: {
          db_id,
          query_id,
          subdomain: props.subdomain
        },
        signal: loadAPIcontroller.signal
      })
      const data = response.data.data
      dispatch(updateAPIlist({
        data: data.original_state.state,
        query_id,
        subdomain: props.subdomain
      }))
    } catch (error) {
      props.catchError(error)
    }
  }

  const copyAPI = () => {
    navigator.clipboard.writeText(`https://${props.subdomain}.${apiBase}${state?.select_preview?.apiRoute}`).then(() => {
      toast.success('API copied!')
    }).catch(err => {
      console.error(err)
    })
  }

  if(state?.select_preview) {
    if(
      !state?.list ||
      !state?.select_preview?.data
    ) {
      return(
        <Card style={{ width: props.width }}>
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
      if(props.dragging) {
        return(
          <Card
            style={{
              opacity: 0.5,
              width: props.width
            }}
          />
        )
      } else {
        return(
          <Card style={{
            width: props.width,
            overflow: 'auto'
          }}>
            <div className='api-saved-details'>
              <div className='api-saved-details-route'>
                <div
                  className={`api-saved-details-route-${props.resolveMethod(state?.select_preview?.method)}`}
                  onClick={copyAPI}
                >
                  <Badge className={`api-saved-details-route-badge-${props.resolveMethod(state?.select_preview?.method)}`}>
                    {props.resolveMethod(state?.select_preview?.method).toUpperCase()}
                  </Badge>
                  <span className='api-saved-details-route-text'>
                    https://{props.subdomain}.{apiBase}{state?.select_preview?.apiRoute}
                  </span>
                </div>
                {/* <Button
                  className='api-saved-details-route-action'
                  color='falcon-primary'
                  onClick={() => history.push(`${window.location.pathname}/${selectedQuery}`)}
                  size='sm'
                >
                  Edit <FontAwesomeIcon icon={faPen} />
                </Button>
                <Button
                  className='api-saved-details-route-action'
                  color='falcon-danger'
                  onClick={() => setDeleteModalState(true)}
                  size='sm'
                >
                  Delete <FontAwesomeIcon icon={faTrash} />
                </Button> */}
              </div>
              <div className='api-saved-details-request'>
                <div className='api-saved-details-request-heading'>
                  REQUEST
                </div>
                <div className='api-saved-details-request-body'>
                  <ReactJson
                    collapsed={state?.select_preview?.data?.request.length <= 25 ? 3 : 2}
                    collapseStringsAfterLength={50}
                    displayDataTypes={false}
                    name={null}
                    src={state?.select_preview?.data?.request}
                  />
                </div>
              </div>
              <div className='api-saved-details-response'>
                <div className='api-saved-details-response-heading'>
                  RESPONSE
                </div>
                <div className='api-saved-details-response-body'>
                  <ReactJson
                    collapsed={state?.select_preview?.data?.response.length <= 25 ? 4 : 3}
                    collapseStringsAfterLength={50}
                    displayDataTypes={false}
                    name={null}
                    src={state?.select_preview?.data?.response}
                  />
                </div>
              </div>
            </div>
          </Card>
        )
      }
    }
  } else {
    return(
      <Card style={{ width: props.width }}>
        <div className='api-saved-details-empty'>
          Click on an API to view details
        </div>
      </Card>
    )
  }
}

export default Right