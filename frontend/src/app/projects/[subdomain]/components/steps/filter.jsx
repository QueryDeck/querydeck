// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { openFilterModal } from '../../../../../lib/data/dataSlice'

// Library imports
import { Button } from 'reactstrap'

const Filter = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  switch (state?.method?.value) {
    case 'select':
    case 'select_id':
    case 'update':
    case 'delete':
      return(
        <div className='query-filter'>
          <Button
            className='mr-1'
            color='falcon-primary'
            onClick={() => dispatch(openFilterModal({
              mode: props.mode,
              query_id: props.query_id,
              subdomain: props.subdomain
            }))}
            size=''
          >
            {state?.filtersCount ? `Filters - ${state?.filtersCount}` : 'Click to add filters'}
          </Button>
        </div>
      )
    default:
      // console.error(`Unknown method: ${state?.method?.value}`)
      break
  }
  return null
}

export default Filter