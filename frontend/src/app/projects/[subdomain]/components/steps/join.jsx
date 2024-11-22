// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { openJoinModal } from '../../../../../lib/data/dataSlice'

// Library imports
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from 'reactstrap'

// Join step at 'apps/app-id/databases/database-id/queries/new'
const Join = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  switch (state?.method?.value) {
    case 'select':
    case 'select_id':
    case 'insert':
      return(
        <div className='query-join'>
          <Button
            className='mr-1'
            color='falcon-primary'
            size=''
          >
            Join [{state?.checkedKeys?.checked.length}]
          </Button>
          <Button
            color='falcon-success'
            onClick={() => dispatch(openJoinModal({
              mode: props.mode,
              query_id: props.query_id,
              subdomain: props.subdomain
            }))}
          >
            <FontAwesomeIcon icon={faPencilAlt} />
          </Button>
        </div>
      )
      default:
        // console.error(`Unknown method: ${state?.method?.value}`)
        break
  }
  return null
}

export default Join