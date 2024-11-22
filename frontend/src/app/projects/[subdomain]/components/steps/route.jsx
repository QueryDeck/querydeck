// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { setRoute } from '../../../../../lib/data/dataSlice'

// Library imports
import {
    Button,
    Input
} from 'reactstrap'

const Route = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  if (state?.base?.value) {
    return (
      <div
        className='query-route'
        id='tour_api-left-route'
      >
        <Button
            className='mr-1'
            color='falcon-primary'
            size=''
        >
            Route
        </Button>
        <Input
          className='query-route-input mr-1'
          disabled={props.query_id !== 'new'}
          onChange={event => dispatch(setRoute({
            query_id: props.query_id,
            route: event.target.value,
            subdomain: props.subdomain
          }))}
          placeholder='Route'
          value={state?.route}
        />
      </div>
    )
  }
  return null
}

export default Route