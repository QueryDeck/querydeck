// React imports
import React from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import { closeColumnModal } from '../../../../../lib/data/dataSlice'

// Library imports
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner
} from 'reactstrap'

// Components
import ColumnSection from './column/column'
import FilterSection from './column/filter'
import ConflictSection from './column/conflict'
import ReturnSection from './column/return'

const ColumnModal = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const closeModal = () => dispatch(closeColumnModal({
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))

  const renderSelectColumns = () => {
    if(state?.columnModal) {
      if(state?.columnModal.includes('.')) {
        switch(state?.columnMode) {
          case 'column':
            return (
              <ColumnSection
                closeModal={closeModal}
                mode={props.mode}
                query_id={props.query_id}
                searchNodes={props.searchNodes}
                subdomain={props.subdomain}
              />
            )
          case 'filter':
            return (
              <FilterSection
                closeModal={closeModal}
                mode={props.mode}
                query_id={props.query_id}
                searchNodes={props.searchNodes}
                subdomain={props.subdomain}
              />
            )
          default:
            console.error(`Unknown tab value ${state.columnMode}`)
        }
      } else {
        return(
          <ColumnSection
            closeModal={closeModal}
            mode={props.mode}
            query_id={props.query_id}
            searchNodes={props.searchNodes}
            subdomain={props.subdomain}
          />
        )
      }
    } else {
      return(
        <>
          <ModalBody className='query-modal-columns-body'>
            <div className='loading-div'>
              <Spinner className='loading-spinner' color='primary' type='grow' />
            </div>
          </ModalBody>
        </>
      )
    }
  }

  const renderInsertColumns = () => {
    if(state?.columnModal) {
        switch(state?.columnMode) {
          case 'column':
            return (
              <ColumnSection
                closeModal={closeModal}
                mode={props.mode}
                query_id={props.query_id}
                searchNodes={props.searchNodes}
                subdomain={props.subdomain}
              />
            )
          case 'conflict':
            return (
              <ConflictSection
                closeModal={closeModal}
                mode={props.mode}
                query_id={props.query_id}
                searchNodes={props.searchNodes}
                subdomain={props.subdomain}
              />
            )
          case 'return':
            return (
              <ReturnSection
                closeModal={closeModal}
                mode={props.mode}
                query_id={props.query_id}
                searchNodes={props.searchNodes}
                subdomain={props.subdomain}
              />
            )
          default:
            console.error(`Unknown tab value ${state.columnMode}`)
        }
    } else {
      return(
        <>
          <ModalBody className='query-modal-columns-body'>
            <div className='loading-div'>
              <Spinner className='loading-spinner' color='primary' type='grow' />
            </div>
          </ModalBody>
        </>
      )
    }
  }

  const renderUpdateColumns = () => {
    if(state?.columnModal) {
        switch(state?.columnMode) {
          case 'column':
            return (
              <ColumnSection
                closeModal={closeModal}
                mode={props.mode}
                query_id={props.query_id}
                searchNodes={props.searchNodes}
                subdomain={props.subdomain}
              />
            )
          case 'return':
            return (
              <ReturnSection
                closeModal={closeModal}
                mode={props.mode}
                query_id={props.query_id}
                searchNodes={props.searchNodes}
                subdomain={props.subdomain}
              />
            )
          default:
            console.error(`Unknown tab value ${state.columnMode}`)
        }
    } else {
      return(
        <>
          <ModalBody className='query-modal-columns-body'>
            <div className='loading-div'>
              <Spinner className='loading-spinner' color='primary' type='grow' />
            </div>
          </ModalBody>
        </>
      )
    }
  }

  const renderDeleteColumns = () => {
    if(state?.columnModal) {
      return (
        <ReturnSection
          closeModal={closeModal}
          mode={props.mode}
          query_id={props.query_id}
          searchNodes={props.searchNodes}
          subdomain={props.subdomain}
        />
      )
    } else {
      return(
        <>
          <ModalBody className='query-modal-columns-body'>
            <div className='loading-div'>
              <Spinner className='loading-spinner' color='primary' type='grow' />
            </div>
          </ModalBody>
        </>
      )
    }
  }

  const renderContent = () => {
    switch(state?.method?.value) {
      case 'select':
      case 'select_id':
        return renderSelectColumns()
      case 'insert':
        return renderInsertColumns()
      case 'update':
        return renderUpdateColumns()
      case 'delete':
        return renderDeleteColumns()
      default:
        console.error('Unknown method', state.method)
        break
    }
  }

  if (state?.method?.value) {
    return (
      <Modal
        className='query-modal-columns'
        isOpen={Boolean(state.columnModal)}
        toggle={closeModal}
      >
        <ModalHeader className='modal-header clearfix'>
          <div className='float-left'>
            Add {state?.method?.value === 'delete' && 'Returned'} Columns
          </div>
          <Button
            className='float-right'
            color='falcon-danger'
            onClick={closeModal}
            size='sm'
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </ModalHeader>
        {renderContent()}
      </Modal>
    )
  }
  return null
}

export default ColumnModal