// React imports
import React from 'react'
import { useHistory } from "react-router-dom"

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { openAuthorisationModal } from '../../../../../lib/data/dataSlice';

// Library imports
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown
} from 'reactstrap'

const Authorisation = (props) => {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const history = useHistory()

  const renderItems = () => {
    const items = []
    const getRole = role => {
      switch (role) {
        case -1:
          return '🔴'
        case 0:
          return '🟡'
        case 1:
          return '🟢'
        default:
          console.error(`Unknown role: ${role}`)
          break
      }
    } 
    if (state?.authorisation?.length) {
      state.authorisation.forEach(element => {
        items.push(
          <DropdownItem
            disabled={Boolean(element.access_type)}
            onClick={() => !element.access_type && dispatch(openAuthorisationModal({
              authorisationModal: element.role_name,
              mode: props.mode,
              query_id: props.query_id,
              subdomain: props.subdomain
            }))}
          >{getRole(element.access_type)} {element.role_name}</DropdownItem>
        )
      })
      return (
        <DropdownMenu style={{ padding: '4px' }}>
          {items}
        </DropdownMenu>
      )
    } else {
      return (
        <DropdownMenu style={{ padding: '4px' }}>
          <DropdownItem onClick={() => history.push(`/apps/${props.subdomain}/security/roles`)}>Set up roles to view</DropdownItem>
        </DropdownMenu>
      )
    }
  }

  if (state?.method?.value) {
    return (
      <div className='query-pagination'>
        <UncontrolledDropdown>
          <DropdownToggle
            caret
            color='falcon-primary'
          >
            Authorisation
          </DropdownToggle>
          {renderItems()}
        </UncontrolledDropdown>
      </div>
    );
  }
  return null;
};

export default Authorisation;
