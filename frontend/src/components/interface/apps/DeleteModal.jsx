// React imports
import React, { useReducer } from 'react'

// Reducers
import deleteModalReducer from '../../reducers/apps/deleteModalReducer'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTimes,
    faTrash
} from '@fortawesome/free-solid-svg-icons'
import {
    Button,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader
} from 'reactstrap'

// App deletion confirmation modal at '/apps'
const DeleteModal = props => {

    // Props
    const {
        deleteApp,
        modalHandler,
        modalState,
        selectedApp,
    } = props

    // Initial state
    const initialState = {
        appName: ''
    }

    const [state, dispatch] = useReducer(deleteModalReducer, initialState)

    // Updates app name field
    const appNameHandler = event => {
        dispatch({
            type: 'UPDATE_NAME',
            appName: event.target.value
        })
    }

    // Closes modal and resets app name field
    const closeModal = () => {
        dispatch({
            type: 'UPDATE_NAME',
            appName: ''
        })
        modalHandler()
    }

    // Deletes app and closes modal
    const deleteHandler = () => {
        closeModal()
        deleteApp()
    }

    return(
        <Modal
            className='apps-modal-delete'
            isOpen={modalState}
            toggle={closeModal}
        >
            <ModalHeader className='modal-header clearfix'>
                <div className='float-left'>
                    Delete App
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
                <Label htmlFor='app-name'>
                    This action deletes
                    <span className='confirmation-span pre'>
                        {selectedApp.name}
                    </span>
                    . This action cannot be undone.
                </Label>
                <Input
                    placeholder='Enter the app name to confirm'
                    name='app-name'
                    value={state.appName}
                    onChange={appNameHandler}
                />
            </ModalBody>
            <ModalFooter>
                <Button
                    block
                    color="danger"
                    disabled={selectedApp.name !== state.appName}
                    onClick={deleteHandler}
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