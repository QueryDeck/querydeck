// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  setOffset,
  toggleDynamicOffset
} from '../../../../../lib/data/dataSlice'

// Library imports
import {
    Button,
    Input,
    Label
} from 'reactstrap'

// SCSS module
import styles from './offset.module.scss'

const Offset = props => {
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
          Offset
        </Button>
        <Input
          className={styles.field}
          min={0}
          onChange={event => dispatch(setOffset({
            offset: event.target.value,
            mode: props.mode,
            query_id: props.query_id,
            subdomain: props.subdomain
          }))}
          placeholder='Offset'
          type='number'
          value={state?.offset}
        />
        <div className={styles.dynamic}>
          <Label>
            <span>
              Dynamic
            </span>
            &nbsp;
            <Input
              checked={state?.offset_dynamic}
              onChange={() => dispatch(toggleDynamicOffset({
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

export default Offset