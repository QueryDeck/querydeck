// React imports
import React from 'react'

// Library imports
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Button,
  Spinner
} from 'reactstrap'

const Overview = props => {
  const renderField = (label, value) => {
    if (label === 'Last Sync') {
      return (
        <div className='overview-details-row-bx'>
          <div className='overview-details-row-label'>{label}</div> : 
          <div
            className='overview-details-row-value'
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ transform: 'translateY(4px)' }}>
              {value}
            </span>
            <Button
              color='falcon-success'
              disabled={props.resync}
              onClick={props.reSyncSchema}
              size='sm'
            >
              Re-Sync <FontAwesomeIcon icon={faSyncAlt} />
            </Button>
          </div>
        </div>
      )
    } else {
      return (
        <div className='overview-details-row-bx'>
          <div className='overview-details-row-label'>{label}</div> : 
          <div className='overview-details-row-value'>{value}</div>
        </div>
      )
    }
  }

  const fields = [
    {
      name: 'Host',
      value: props.details.database.dbhost
    },
    {
      name: 'Username',
      value: props.details.database.dbusername
    },
    {
      name: 'Port',
      value: props.details.database.dbport
    },
    {
      name: 'Name',
      value: props.details.database.dbname
    },
    {
      name: 'Alias',
      value: props.details.database.dbalias
    },
    {
      name: 'Last Sync',
      value: (new Date(props.details.database.last_sync * 1000)).toLocaleString()
    },
  ]

  const renderData = () => {
    if (!props.details) {
      return (
        <div className='loading-div'>
          <Spinner
            className='loading-spinner'
            color='primary'
            type='grow'
          />
        </div>
      )
    } else {
      return fields.map(element => renderField(element.name, element.value))
    }
  }

  return (
    <div>
      {renderData()}
    </div>
  )
}

export default Overview
