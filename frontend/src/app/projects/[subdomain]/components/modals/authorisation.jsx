// React imports
import React, { useRef } from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  closeAuthorisationModal
} from '../../../../../lib/data/dataSlice'

// Library imports
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner
} from 'reactstrap'

// Components
import Filters from '../filters'

const AuthorisationModal = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const filtersRef = useRef({})

  const closeModal = () => dispatch(closeAuthorisationModal({
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))

  const role = state?.authorisation.find(element => element.role_name === state?.authorisationModal)

  if (state?.method?.value) {
    return(
      <Modal isOpen={state?.authorisationModal} className='query-modal-filter' toggle={closeModal}>
        <ModalHeader className='modal-header clearfix'>
          <div className='float-left'>
            {state?.authorisationModal}
          </div>
          <Button
            className='float-right'
            color='falcon-danger'
            size='sm'
            onClick={closeModal}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </ModalHeader>
        <ModalBody className='query-modal-filter-body'>
          <div className='query-modal-filter-body-container'>
            {
              state?.filterFields &&
              state?.filters &&
              state?.operators &&
              state?.appAuth &&
              role?.conditions ?
              <Filters
                ref={filtersRef}
                catchError={props.catchError}
                db_id={state?.database?.value}
                fields={state?.filterFields}
                filters={role.conditions}
                joinGraphs={state?.joinGraphs}
                mode='api-select-filters-disabled'
                operators={state?.operators}
                sessionKeys={(state?.authentication?.value && state?.appAuth?.session_key_values) ? state?.appAuth?.session_key_values : {}}
                subdomain={props.subdomain}
              />
              :
              <div className='loading-div'>
                <Spinner
                  className='loading-spinner'
                  color="primary"
                  type="grow"
                />
              </div>
            }
          </div>
        </ModalBody>
        <ModalFooter>
          <div className='query-modal-filter-footer'>
            <Button
              block
              color='falcon-danger'
              onClick={closeModal}
            >
              Close
              &nbsp;
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    )
  }
  return null
}

export default AuthorisationModal