// React imports
import React, { useRef } from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  closeFilterModal,
  updateFilters
} from '../../../../../lib/data/dataSlice'

// Library imports
import {
  faTimes,
  faSave
} from '@fortawesome/free-solid-svg-icons'
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

const FilterModal = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const filtersRef = useRef({})

  const closeModal = () => dispatch(closeFilterModal({
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))

  const saveQueryChange = () => {
    dispatch(updateFilters({
      filters: JSON.stringify(filtersRef.current.getFilters()),
      mode: props.mode,
      query_id: props.query_id,
      subdomain: props.subdomain
    }))
    closeModal()
  }

  if (state?.method?.value) {
    return(
      <Modal isOpen={state?.filterModal} className='query-modal-filter' toggle={closeModal}>
        <ModalHeader className='modal-header clearfix'>
          <div className='float-left'>
            Filter Columns
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
              state?.appAuth ?
              <Filters
                ref={filtersRef}
                catchError={props.catchError}
                db_id={state?.database?.value}
                fields={state?.filterFields}
                filters={JSON.parse(state?.filters)}
                joinGraphs={state?.joinGraphs}
                mode={state?.method.value === 'select_id' ? `api-select-id-filters` : `api-${state?.method.value}-filters`}
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
          <div  className='query-modal-filter-footer'>
            <Button
              block
              color='falcon-danger'
              onClick={closeModal}
            >
              Close
              &nbsp;
              <FontAwesomeIcon icon={faTimes} />
            </Button>
            &nbsp;&nbsp;&nbsp;
            <Button
              block
              color='falcon-success'
              onClick={saveQueryChange}
              >
              Save 
              &nbsp;
              <FontAwesomeIcon icon={faSave} />
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    )
  }
  return null
}

export default FilterModal