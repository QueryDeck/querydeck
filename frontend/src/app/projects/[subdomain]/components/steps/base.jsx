// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { setBase } from '../../../../../lib/data/dataSlice'

// Library imports
import { Button } from 'reactstrap'
import Select from 'react-select'

const Base = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const schemaHash = {}
  // eslint-disable-next-line
  state?.tables.forEach(table => {
    if (schemaHash[table.text.split('.')[0]]) {
      schemaHash[table.text.split('.')[0]].push({
        label: table.text.split('.').slice(1, table.text.split('.').length).join('.'),
        value: table.id
      })
    } else {
      schemaHash[table.text.split('.')[0]] = [{
        label: table.text.split('.').slice(1, table.text.split('.').length).join('.'),
        value: table.id
      }]
    }
  })

  if (state?.database?.value) {
    return (
      <div
        className='query-base'
        id='tour_api-left-base'
      >
        <Button
          className='mr-1'
          color='falcon-primary'
          size=''
        >
          Base Table
        </Button>
        <div className='query-base-select'>
          <Select
            autoFocus
            classNamePrefix='react-select'
            defaultMenuIsOpen={props.query_id === 'new' && !(state?.base && Object.keys(state?.base).length)}
            hideSelectedOptions
            isDisabled={props.query_id !== 'new'}
            noOptionsMessage={() => 'No tables match the search term'}
            onChange={value => dispatch(setBase({
              base: value,
              mode: props.mode,
              query_id: props.query_id,
              subdomain: props.subdomain
            }))}
            options={Object.keys(schemaHash).map(table => ({
              label: table,
              options: schemaHash[table]
            }))}
            placeholder='Select Table'
            value={state?.base && Object.keys(state?.base).length ? state.base : null}
          />
        </div>
      </div>
    )
  }
  return null
}

export default Base