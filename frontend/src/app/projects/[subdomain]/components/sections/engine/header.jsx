// React imports
import React from 'react'
import { useHistory } from 'react-router-dom'

// Library imports
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Badge,
  Button,
  Card
} from 'reactstrap'

// Components
import AutoGenerateButton from '../../modals/autoGenerate/autoGenerateButton'
import Save from '../../steps/save'

// Utils
// import { isSubdomainIsSandbox } from "../../../../../../helpers/utils";

// SCSS module
import styles from './header.module.scss'

const Header = props => {
  // For 403 errors on unauthorised users
  const history = useHistory();

  const renderUnsavedWarning = () => {
    if (window.location.pathname.includes('api')) {
      if (window.location.pathname.endsWith('/api') || window.location.pathname.endsWith('/api/')) {
        return false
      }
      return true
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
        {props.query_id ? props.docs?.title || 'Untitled' : props.section}
        {renderUnsavedWarning() && <Badge className={styles.title_warning}>Draft</Badge>}
      </div>
      {(window.location.pathname.endsWith('/api') || window.location.pathname.endsWith('/api/')) &&
        <AutoGenerateButton
          mode={props.mode}
          subdomain={props.subdomain}
        />
      }
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