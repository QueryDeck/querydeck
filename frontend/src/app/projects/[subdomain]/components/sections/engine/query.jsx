// React imports
import React from 'react'

// Redux
import { useSelector } from 'react-redux'

// Library imports
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Card,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from 'reactstrap'

const Query = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])

  const renderQueryText = () => {
    // if(queryTextLoading) {
    //   return(
    //     <div className='query-right-tab'>
    //       <div className='loading-div'>
    //         <Spinner
    //           className='loading-spinner'
    //           color='primary'
    //           type='grow'
    //         />
    //       </div>
    //     </div>
    //   )
    // } else {
      let singleMode = null;
      switch (props.mode) {
        case 'queries':
          singleMode = 'a query';
          break;
        case 'forms':
          singleMode = 'a form';
          break;
        case 'tables':
          singleMode = 'a table';
          break;
        case 'api':
          singleMode = 'an API';
          break;
        default:
          console.error(`Unknown mode: ${props.mode}`);
      }
      if(state?.text.length) {
        if (state?.base?.value) {
          return(
            <pre className='query-right-tab'>
              {state?.base?.value ? state.text : `Select a base table and add columns to generate ${singleMode}`}
            </pre>
          )
        } else {
          return `Select a base table and add columns to generate ${singleMode}`
        }
      } else {
        return `Select a base table and add columns to generate ${singleMode}`
      }
    // }
  }

  return(
    <Card className='query-right'>
      <Nav tabs>
        <NavItem
          className='query-right-nav cursor-pointer'
          id='query'
        >
          <NavLink>
            Query <FontAwesomeIcon icon={faCode} />
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent
          className='query-right-tab'
          activeTab={state?.resultMode}
      >
        <TabPane tabId='sql'>
          {renderQueryText()}
        </TabPane>
      </TabContent>
    </Card>
  )
}

export default Query