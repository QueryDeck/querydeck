// React imports
import React from 'react'
import { useHistory } from 'react-router-dom'

// Redux
import { useSelector } from 'react-redux'

// Library imports
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Badge,
  Button,
  Card
} from 'reactstrap'

// Components
import Save from '../../steps/save'

// Utils
// import { isSubdomainIsSandbox } from "../../../../../../helpers/utils";

// SCSS module
import styles from './header.module.scss'

const Header = props => {
  // Redux
  const listState = useSelector(state => state.data[props.mode][props.subdomain])
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])

  // For 403 errors on unauthorised users
  const history = useHistory();

  const renderUnsavedWarning = () => {
    if (props.query_id === 'new') {
      if (state?.text?.length) {
        return true
      }
    } else {
      const savedDocs = listState?.list?.filter(element => element.query_id === props.query_id)[0]
      if (savedDocs) {
        return savedDocs.docs.sql_query.text.replace(/\s\s+/g, ' ') !== state?.text.replace(/\s\s+/g, ' ')
      }
    }
    return false
  }

  return (
    <Card className={styles.header}>
      <div className={styles.actions}>
        <Button
          color='falcon-primary'
          onClick={() => history.push(`/apps`)}
          size='sm'
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Apps
        </Button>
      </div>
      <div className={styles.title}>
        {props.query_id ? state?.name || 'Untitled' : props.section}
        {renderUnsavedWarning() && <Badge className={styles.title_warning}>Draft</Badge>}
      </div>
      {props.query_id && <div className={styles.actions}>
        <Save
          mode='api'
          query_id={props.query_id}
          subdomain={props.subdomain}
        />
      </div>}
    </Card>
  )
}

export default Header