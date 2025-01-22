// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { openColumnModal } from '../../../../../lib/data/dataSlice'

// Library imports
import {
  Button,
  UncontrolledTooltip
} from 'reactstrap'

const Columns = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  let joins = state?.joins.map((join, index) => (
    <div
      className='query-columns'
      key={join.tableID}
    >
      <UncontrolledTooltip placement='top' target={`table-step-${index}`}>
        <div>
          Join Depth - Level {join.tableID.split('-').length/2}
        </div>
        <div>
          Columns - {state.columns.filter(element => element.id.split('$')[0] === join.tableID).length}
        </div>
        <div>
          {(state.method.value === 'insert') ? `Conflicting Columns - ${state.conflictColumns[join.tableID]?.columns ? state.conflictColumns[join.tableID].columns.length : '0'}` : null}
        </div>
        <div>
          {(state.method.value === 'insert' || state.method.value === 'update') ? `Returned Columns - ${state.returnColumns.filter(element => element.id.split('$')[0] === join.tableID).length}` : null}
        </div>
      </UncontrolledTooltip>
      <Button
        className='mr-1'
        color='falcon-primary'
        id={`table-step-${index}`}
        onClick={() => dispatch(openColumnModal({
          columnModal: join.tableID,
          mode: props.mode,
          query_id: props.query_id,
          subdomain: props.subdomain
        }))}
        size=''
      >
        L{join.tableID.split('-').length/2} | {join.tableName} - {state.columns.filter(element => element.id.split('$')[0] === join.tableID).length} {(state.method.value === 'insert') ? `| ${state.conflictColumns[join.tableID]?.columns ? state.conflictColumns[join.tableID].columns.length : '0'}` : null} {(state.method.value === 'insert' || state.method.value === 'update') ? `| ${state.returnColumns.filter(element => element.id.split('$')[0] === join.tableID).length}` : null}
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
          <UncontrolledTooltip placement='top' target='table-step-base'>
            <div>
              Base Table
            </div>
            <div>
              {state.method.value === 'delete' ? 'Returned' : null} Columns - {state.method.value === 'delete' ? state.returnColumns.filter(element => !element.id.includes('$')).length : state.columns.filter(element => !element.id.includes('$')).length}
            </div>
            <div>
              {(state.method.value === 'insert') ? `Conflicting Columns - ${state.conflictColumns[state.base.value]?.columns ? state.conflictColumns[state.base.value].columns.length : '0'}` : null}
            </div>
            <div>
              {(state.method.value === 'insert' || state.method.value === 'update') ? `Returned Columns - ${state.returnColumns.filter(element => !element.id.includes('$')).length}` : null}
            </div>
          </UncontrolledTooltip>
          <Button
            className='mr-1'
            color='falcon-primary'
            id='table-step-base'
            onClick={() => dispatch(openColumnModal({
              columnModal: state.base.value,
              mode: props.mode,
              query_id: props.query_id,
              subdomain: props.subdomain
            }))}
            size=''
          >
            Base | {state.base.label} - {state.method.value === 'delete' ? state.returnColumns.filter(element => !element.id.includes('$')).length : state.columns.filter(element => !element.id.includes('$')).length} {(state.method.value === 'insert') ? `| ${state.conflictColumns[state.base.value]?.columns ? state.conflictColumns[state.base.value].columns.length : '0'}` : null} {(state.method.value === 'insert' || state.method.value === 'update') ? `| ${state.returnColumns.filter(element => !element.id.includes('$')).length}` : null}
          </Button>
        </div>
        {joins}
      </>
    )
  }
  return null
}

export default Columns