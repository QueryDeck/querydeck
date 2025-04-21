// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  toggleIncludeResultCount
} from '../../../../../lib/data/dataSlice'

// Library imports
import {
  Button,
  Input
} from 'reactstrap'

// SCSS module
import styles from './count.module.scss'

const Count = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  if (state?.base?.value && state?.method?.value === 'select') {
    return (
      <div className={styles.container}>
        <Button
          color='falcon-primary'
          size=''
        >
          Include Result Count
        </Button>
        <div className={styles.dynamic}>
            <Input
              checked={state?.includeResultCount}
              onChange={() => dispatch(toggleIncludeResultCount({
                mode: props.mode,
                query_id: props.query_id,
                subdomain: props.subdomain
              }))}
              type='checkbox'
            />
        </div>
      </div>
    )
  }
  return null
}

export default Count