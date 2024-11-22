// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { openSortModal } from '../../../../../lib/data/dataSlice'

// Library imports
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from 'reactstrap'

// Sort step at 'apps/app-id/databases/database-id/queries/new'
const Sort = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  if (state?.method?.value === 'select') {
    return(
      <div className='query-sort'>
        <Button
          className='mr-1'
          color='falcon-primary'
          size=''
        >
          Sort [{state?.sorts?.length}]
        </Button>
        <Button
          color='falcon-success'
          onClick={() => dispatch(openSortModal({
            mode: props.mode,
            query_id: props.query_id,
            subdomain: props.subdomain
          }))}
        >
          <FontAwesomeIcon icon={faPencilAlt} />
        </Button>
      </div>
    )
  }
  return null
}

export default Sort