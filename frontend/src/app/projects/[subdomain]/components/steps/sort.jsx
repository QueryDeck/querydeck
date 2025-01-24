// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { openSortModal } from '../../../../../lib/data/dataSlice'

// Library imports
import {
  Button,
  UncontrolledTooltip
} from 'reactstrap'

// Sort step at 'apps/app-id/databases/database-id/queries/new'
const Sort = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  if (state?.method?.value === 'select') {
    return(
      <div className='query-sort'>
        <UncontrolledTooltip placement='top' target='sort-step'>
          <div>
            Sorting - {state?.sorts?.length}
          </div>
          <div>
            Dynamic Sorting - {state?.sorts_dynamic?.length}
          </div>
        </UncontrolledTooltip>
        <Button
          className='mr-1'
          color='falcon-primary'
          id='sort-step'
          onClick={() => dispatch(openSortModal({
            mode: props.mode,
            query_id: props.query_id,
            subdomain: props.subdomain
          }))}
          size=''
        >
          {state?.sorts?.length || state?.sorts_dynamic?.length ? `Sorting - ${state?.sorts?.length} | ${state?.sorts_dynamic?.length}` : 'Click to add sorting'}
        </Button>
      </div>
    )
  }
  return null
}

export default Sort