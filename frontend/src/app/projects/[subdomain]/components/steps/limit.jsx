// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  setLimit,
  toggleDynamicLimit
} from '../../../../../lib/data/dataSlice'

// Library imports
import {
  Button,
  Input,
  Label
} from 'reactstrap'

// SCSS module
import styles from './limit.module.scss'

const Limit = props => {
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
          Limit
        </Button>
        <Input
          className={styles.field}
          max={1000}
          min={1}
          onChange={event => dispatch(setLimit({
            limit: event.target.value,
            mode: props.mode,
            query_id: props.query_id,
            subdomain: props.subdomain
          }))}
          placeholder='Limit'
          type='number'
          value={state?.limit}
        />
        <div className={styles.dynamic}>
          <Label>
            <span>
              Dynamic
            </span>
            &nbsp;
            <Input
              checked={state?.limit_dynamic}
              onChange={() => dispatch(toggleDynamicLimit({
                mode: props.mode,
                query_id: props.query_id,
                subdomain: props.subdomain
              }))}
              type='checkbox'
            />
          </Label>
        </div>
      </div>
    )
  }
  return null
}

export default Limit