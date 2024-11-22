// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { setDatabase } from '../../../../../lib/data/dataSlice'

// Library imports
import { Button } from 'reactstrap'
import Select from 'react-select'

const Database = props => {
  // Redux
  const databases = useSelector(state => state.data.databases[props.subdomain]?.list)
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  return (
    <div className='query-db'>
      <Button
        className='mr-1'
        color='falcon-primary'
        size=''
      >
        Database
      </Button>
      <div className='query-db-select'>
        <Select
          autoFocus
          classNamePrefix='react-select'
          // defaultMenuIsOpen={props.query_id === 'new' && !(state?.database && Object.keys(state?.database).length)}
          hideSelectedOptions
          isDisabled={props.query_id !== 'new'}
          noOptionsMessage={() => 'No databases match the search term'}
          onChange={value => dispatch(setDatabase({
            database: value,
            mode: props.mode,
            query_id: props.query_id,
            subdomain: props.subdomain
          }))}
          options={databases?.map(database => ({
            label: database.name,
            value: database.db_id
          }))}
          placeholder='Select Database'
          value={state?.database && Object.keys(state?.database).length ? state.database : null}
        />
      </div>
    </div>
  )
}

export default Database