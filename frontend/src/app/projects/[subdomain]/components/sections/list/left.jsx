// React imports
import React, { useEffect ,useState } from 'react'
import { useHistory } from 'react-router-dom'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  filterAPIlist,
  sortAPIlist
} from '../../../../../../lib/data/dataSlice'

// Library imports
import {
  faSortAlphaUp,
  faSortAlphaDown,
  faSortNumericUp,
  faSortNumericDown,
  faPlus
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Button,
  Card,
  Input,
  Spinner
} from 'reactstrap'
// API
import api from '../../../../../../api'


// Components
import Item from './item'

// Controllers
let loadDatabaseController


const Left = props => {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain])
  const dispatch = useDispatch()
  const [dbData, setDbData] = useState(null)
  const history = useHistory()
  useEffect(() => {
    loadDatabaseController = new AbortController()

    return () => {
      loadDatabaseController.abort()
    }
  }, [])


  const loadDatabaseFromApi = async (query_id) => {
    let data  ; 
    try {
    
     if(!dbData){ 
      const response = await api.get('/apps/editor/controllers/saved-query-db', {
        params: {
          apiMode: true,
          query_id
        },
        // signal: loadDatabaseController.signal // temporarily disabled till i find a solution to preview/edit apis after filtering
      })
       data = response.data.data
       setDbData(data)
     }else { 

      data = dbData ; 
     }
     
     return data ; 
    } catch (error) {
      props.catchError(error)
    }
  }

  const renderSortIcon = () => {
    if(state.sort.field === 'Creation') {
      if(state.sort.order) {
        return faSortNumericDown
      } else {
        return faSortNumericUp
      }
    } else if(state.sort.field === 'Name') {
      if(state.sort.order) {
        return faSortAlphaDown
      } else {
        return faSortAlphaUp
      }
    }
  }

  const renderList = () => {
    return state.list_filtered.map(item => (
      <Item
        catchError={props.catchError}
        item={item}
        key={item.query_id}
        resolveMethod={props.resolveMethod}
        subdomain={props.subdomain}
        loadDatabaseFromApi={loadDatabaseFromApi}
      />
    ))
  }

  if(!state?.list) {
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
            marginTop: '4px',
            opacity: 0.5,
            width: props.width
          }}
        />
      )
    } else {
      return(
        <Card style={{
          marginTop: '4px',
          width: props.width
        }}>
          <div className='api-saved-list-search'>
            <Input
              autoFocus
              onChange={event => dispatch(filterAPIlist({
                search: event.target.value,
                subdomain: props.subdomain
              }))}
              placeholder='Search API'
              value={props.search}
            />
            <Button
              color='falcon-primary'
              onClick={() => dispatch(sortAPIlist({
                subdomain: props.subdomain
              }))}
              size='sm'
            >
              <FontAwesomeIcon icon={renderSortIcon()} />
            </Button>
            <Button
              color='falcon-primary'
              onClick={() => history.push(`/apps/${props.subdomain}/api/new`)}
              size='sm'
            >
              <FontAwesomeIcon icon={faPlus} />
            </Button>
          </div>
          <div className='api-saved-list'>
            {renderList()}
          </div>
        </Card>
      )
    }
  }
}

export default Left