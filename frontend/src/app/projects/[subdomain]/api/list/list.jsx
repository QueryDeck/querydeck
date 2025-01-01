// React imports
import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'
import AutoGenerateModal from '../../components/modals/autoGenerate/autoGenerate'
 
// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { setAPIlist } from '../../../../../lib/data/dataSlice'

// Library imports
import { Card } from 'reactstrap'
import Cookies from 'js-cookie'
import { toast } from 'react-toastify'

// Custom libraries
import { useResizable } from '@ag_meq/rrl'

// Components
import Menu from '../../../../../components/interface/menu/Menu'
import Header from '../../components/sections/engine/header'
import Left from '../../components/sections/list/left'
import Details from '../../components/sections/engine/details'
import DeleteModal from '../../components/modals/delete'

// API
import api from '../../../../../api'

// Controllers
let getListController

export const APIlist = props => {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain])
  const dispatch = useDispatch()

  let history = useHistory()

  useEffect(() => {
    getListController = new AbortController()

    getList()

    return () => {
      getListController.abort()
    }
    // eslint-disable-next-line
  }, [state?.list?.length])

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
        history.push(`/auth/login?redirect=/apps/${props.subdomain}/api`)
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

  const getList = async () => {
    try {
      const response = await api.get('/apps/editor/controllers/saved-api-query', {
        params: {
          subdomain: props.subdomain
        },
        signal: getListController.signal
      })
      const data = response.data.data
      dispatch(setAPIlist({
        list: data.queries,
        subdomain: props.subdomain
      }))
    } catch (error) {
      catchError(error)
    }
  }
  const onGenerateSuccess = ()=> { 
    getList()
  }
  const resolveMethod = method => {
    switch(method) {
      case 'select':
      case 'select_id':
        return 'get'
      case 'insert':
        return 'post'
      case 'update':
        return 'put'
      case 'delete':
        return 'delete'
      default:
        console.error(`Unknown method: ${method}`)
        break
    }
  }

  return(
    <div>
      <Helmet>
        <title>
          {state?.select_preview ? `${state?.select_preview?.name} | ` : ''}Saved APIs | QueryCharts
        </title>
      </Helmet>
      <Header
        docs={state?.select_preview?.docs}
        mode='api'
        query_id={state?.select_preview?.query_id}
        section='REST APIs'
        subdomain={props.subdomain}
      />
      <div className='core'>
        <Menu appid={props.subdomain} />
        <div>
          <div className='api-saved'>
            <Left
              catchError={catchError}
              dragging={isDragging}
              resolveMethod={resolveMethod}
              subdomain={props.subdomain}
              width={position - 48 - 8 - 8}
            />
            <div
              className='separator separator-horizontal'
              {...separatorProps}
            />
            {
              state?.select_preview?.docs ?
              <Details
                docs={state?.select_preview?.docs}
                dragging={isDragging}
                mode='api'
                query_id={state?.select_preview?.query_id}
                subdomain={props.subdomain}
                width={window.innerWidth - 4 - 4 - position}
              /> :
              <Card style={{
                marginTop: '4px',
                width: window.innerWidth - 4 - 4 - position
              }}>
                <div className='api-saved-details-empty'>
                  Click on an API to view details
                </div>
              </Card>
            }
          </div>
      </div>
      </div>
      <DeleteModal
        catchError={catchError}
        subdomain={props.subdomain}
      />
      <AutoGenerateModal
        key='auto-gen-modal'
        mode={'api'}
        subdomain={props.subdomain}
        onGenerateSuccess={onGenerateSuccess}
      />
    </div>
  )
}