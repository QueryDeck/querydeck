// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { openColumnModal } from '../../../../../lib/data/dataSlice'

// Library imports
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from 'reactstrap'

const Columns = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  let joins = state?.joins.map(join => (
    <div
      className='query-columns'
      key={join.tableID}
    >
      <Button
        className='mr-1'
        color='falcon-primary'
        size=''
      >
        {join.tableName} [{state.columns.filter(element => element.id.split('$')[0] === join.tableID).length}]
      </Button>
      <Button
        color='falcon-success'
        onClick={() => dispatch(openColumnModal({
          columnModal: join.tableID,
          mode: props.mode,
          query_id: props.query_id,
          subdomain: props.subdomain
        }))}
      >
        <FontAwesomeIcon icon={faPencilAlt} />
      </Button>
    </div>
  ))

  if (state?.method?.value) {
    return (
      <>
        <div
          className='query-columns'
          id='tour_api-left-columns'
          key={state?.base?.value}
        >
          <Button
            className='mr-1'
            color='falcon-primary'
            size=''
          >
            {state.base.label} [{state.method.value === 'delete' ? state.returnColumns.filter(element => !element.id.includes('$')).length : state.columns.filter(element => !element.id.includes('$')).length}]
          </Button>
          <Button
            color='falcon-success'
            onClick={() => dispatch(openColumnModal({
              columnModal: state.base.value,
              mode: props.mode,
              query_id: props.query_id,
              subdomain: props.subdomain
            }))}
          >
            <FontAwesomeIcon icon={faPencilAlt} />
          </Button>
        </div>
        {joins}
      </>
    )
  }
  return null
}

export default Columns