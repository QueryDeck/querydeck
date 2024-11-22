// React imports
import React from 'react'

// Components
import Query from './query'
import Documentation from './documentation'
// import  AutoGenrateButton from '../../modals/autoGenerate/autoGenrateButton'

const Right = props => (
  <div style={{ display: 'flex'}}>
    <div
      className='left-block'
      id='tour_api-middle'
      style={{ width: (window.innerWidth - 4 - 4 - 336 - 48 - 8 - 4 - 4)/2 }}
    >
      <Query
        mode={props.mode}
        query_id={props.query_id}
        subdomain={props.subdomain}
      />
    </div>
    <div className='separator separator-horizontal separator-clear' />
    <div
      className='right-block'
      id='tour_api-right'
      style={{ width: (window.innerWidth - 4 - 4 - 336 - 48 - 8 - 4 - 4)/2 }}
    >

      {/* <AutoGenrateButton
        mode={props.mode}
        query_id={props.query_id}
        subdomain={props.subdomain}
      /> */}

      <Documentation
        mode={props.mode}
        query_id={props.query_id}
        subdomain={props.subdomain}
      />
    </div>
  </div>
)

export default Right