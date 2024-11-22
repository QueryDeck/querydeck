// React imports
import React from 'react'

// Redux
import { useSelector } from 'react-redux'

// Library imports
import {
  Badge,
  Card,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from 'reactstrap'
import ReactJson from 'react-json-view'
import { toast } from 'react-toastify'

// API
import { apiBase } from '../../../../../../api';

const Documentation = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])

  // Tab Label
  const copyAPI = () => {
      navigator.clipboard.writeText(`https://${props.subdomain}.${apiBase}${state.route}`).then(() => {
          toast.success('API copied!')
      }).catch(err => {
          console.error(err)
      })
  }

  const renderApiResponse = () => {
    // if (queryTextLoading) {
    //   return (
    //     <div className="query-right-tab">
    //       <div className="loading-div">
    //         <Spinner className="loading-spinner" color="primary" type="grow" />
    //       </div>
    //     </div>
    //   );
    // } else {
      if (state?.request) {
        // let filteredQueryRequest = {};
        // let queryRequestKeys = Object.keys(state.request).sort();
        // queryRequestKeys.forEach(key => {
        //   filteredQueryRequest[key] = { ...queryRequest[key] };
        //   if (Array.isArray(filteredQueryRequest[key].required)) delete filteredQueryRequest[key].required;
        // });
        return (
          <div className="query-right-tab">
            <div className='api-tab'>
              <div
                className={`api-tab-route-${state.method.method ? state.method.method.toLowerCase() : 'get'}`}
                id='tour_api-right-route'
                onClick={copyAPI}
              >
                <Badge className={`api-tab-route-badge-${state.method.method ? state.method.method.toLowerCase() : 'get'}`}>
                  {state.method.method ? state.method.method : 'GET'}
                </Badge>
                <span className='api-tab-route-text'>
                  https://{props.subdomain}.{apiBase}{state.route}
                </span>
              </div>
              {
                state?.method?.value === 'select' &&
                <div
                  className='api-tab-request'
                  id='tour_api-right-request'
                >
                  <div className='api-tab-request-heading'>
                    ADDITIONAL DETAILS
                  </div>
                  <div className='api-tab-details-body'>
                    <div className='api-tab-details-body-item'>
                      Pagination: {state?.pagination?.label}
                    </div>
                    <div className='api-tab-details-body-item'>
                      Authorization: {state?.authorization?.label || 'False '} 
                    </div>
                    <div className='api-tab-details-body-item'>
                      Limit: {state?.limit}
                    </div>
                    <div className='api-tab-details-body-item'>
                      Query Params: {JSON.parse(state?.filters)?.usedFields ? JSON.parse(state?.filters)?.usedFields.join(', ') : ''}
                    </div>
                  </div>
                </div>
              }
              <div
                className='api-tab-request'
                id='tour_api-right-request'
              >
                <div className='api-tab-request-heading'>
                  REQUEST
                </div>
                <div className='api-tab-request-body'>
                  <ReactJson
                    collapsed={state.request.length <= 25 ? 3 : 2}
                    collapseStringsAfterLength={50}
                    displayDataTypes={false}
                    name={null}
                    src={state?.base?.value ? state.request : {}}
                  />
                </div>
              </div>
              <div
                className='api-tab-response'
                id='tour_api-right-response'
              >
                <div className='api-tab-response-heading'>
                  RESPONSE
                </div>
                <div className='api-tab-response-body'>
                  <ReactJson
                    collapsed={state.response.length <= 25 ? 4 : 3}
                    collapseStringsAfterLength={50}
                    displayDataTypes={false}
                    name={null}
                    src={state?.base?.value ? state.response : {}}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      } else {
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
        return `Select a base table and add columns to generate ${singleMode}`;
      }
    // }
  };

  return(
    <Card className='query-right'>
      <Nav tabs>
        <NavItem
          className='query-right-nav cursor-pointer'
          id='response'
        >
          <NavLink>
            Documentation
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent
        className='query-right-tab'
        activeTab='json'
      >
        <TabPane tabId='json' >
          {renderApiResponse()}
        </TabPane>
      </TabContent>
    </Card>
  )
}

export default Documentation