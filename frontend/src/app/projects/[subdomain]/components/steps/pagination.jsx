// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { setPagination } from '../../../../../lib/data/dataSlice'

// Library imports
import { Button } from 'reactstrap'
import Select from 'react-select'

const Pagination = props => {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  if (state?.method?.value === 'select' || state?.method?.value === 'select_id') {
    return (
      <div className='query-pagination'>
        <Button
          className='mr-1'
          color='falcon-primary'
          size=''
        >
          Pagination
        </Button>
        <div className='query-pagination-select'>
          <Select
            autoFocus
            classNamePrefix='react-select'
            hideSelectedOptions
            noOptionsMessage={() => 'No options match the search term'}
            onChange={value => dispatch(setPagination({
              pagination: value,
              query_id: props.query_id,
              subdomain: props.subdomain
            }))}
            options={[
              {
                label: 'True',
                value: true
              },
              {
                label: 'False',
                value: false
              }
            ]}
            placeholder='Select an option'
            value={state?.pagination && Object.keys(state?.pagination).length ? state.pagination : null}
          />
        </div>
      </div>
    )
  }
  return null
}

export default Pagination