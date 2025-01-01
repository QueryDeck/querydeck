// React imports
import React, { useEffect } from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  selectPreviewAPIlist,
  selectDeleteAPIlist,
  updateDeploymentDiff
} from '../../../../../lib/data/dataSlice'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTimes,
    faTrash
} from '@fortawesome/free-solid-svg-icons'
import {
    Button,
    Modal,
    ModalBody,
    ModalHeader,
    ModalFooter
} from 'reactstrap'
import { toast } from 'react-toastify'

// API
import api from '../../../../../api'

// Controllers
let deploymentDiffController
let deleteAPIController

const DeleteModal = props => {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain])
  const dispatch = useDispatch()

  useEffect(() => {
    deploymentDiffController = new AbortController()
    deleteAPIController = new AbortController()

    return () => {
      deploymentDiffController.abort()
      deleteAPIController.abort()
    }
  })

  const getDiff = async () => {
    try {
      const response = await api.get('/apps/git/diff', {
        params: {
          subdomain: props.subdomain,
        },
        signal: deploymentDiffController.signal,
      })
      dispatch(updateDeploymentDiff({
        subdomain:  props.subdomain,
        diff: response.data.data.diff
      }))
      dispatch(selectDeleteAPIlist({
        select_delete: state.select_delete.query_id,
        subdomain: props.subdomain
      }))
      if (state.select_preview?.query_id === state.select_delete.query_id) {
        dispatch(selectPreviewAPIlist({
          select_preview: null,
          subdomain: props.subdomain
        }))
      }
    } catch (error) {
      props.catchError(error);
    }
  }

  const deleteAPI = async () => {
    try {
      await api.delete('/apps/editor/controllers/saved-api-query', {
        data: {
          subdomain: props.subdomain,
          query_id: state.select_delete.query_id
        }
      }, {
        signal: deleteAPIController.signal
      })
      toast.success('API deleted successfully!')
      getDiff()
    } catch (error) {
      props.catchError(error)
    }
  }

  // Closes modal
  const closeModal = () => {
    dispatch(selectDeleteAPIlist({
      select_delete: '',
      subdomain: props.subdomain
    }))
  }

  return(
    <Modal
      className='apps-modal-delete'
      isOpen={typeof(state?.select_delete) === 'object'}
      toggle={closeModal}
    >
      <ModalHeader className='modal-header clearfix'>
        <div className='float-left'>
            Delete API
        </div>
        <Button
          className='float-right'
          color="falcon-danger"
          size='sm'
          onClick={closeModal}
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </ModalHeader>
      <ModalBody className='apps-modal-delete-body'>
        This action deletes
        <span className='confirmation-span pre'>
          {state?.select_delete?.name}
        </span>
        . This action cannot be undone.
      </ModalBody>
      <ModalFooter>
        <Button
          block
          color="danger"
          onClick={deleteAPI}
        >
          Delete
          &nbsp;
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteModal