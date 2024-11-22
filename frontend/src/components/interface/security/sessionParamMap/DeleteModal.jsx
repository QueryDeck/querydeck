// React imports
import React from 'react'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTimes,
    faTrash
} from '@fortawesome/free-solid-svg-icons'
import {
    Button,
    Label,
    Modal,
    ModalBody,
    ModalHeader,
    ModalFooter
} from 'reactstrap'

// Param Map deletion confirmation modal  
const DeleteModal = props => {

    // Props
    const {
        modalState,
        modalHandler,
        selectedObj,
        deleteObj
    } = props

    // Closes modal and resets app name field
    const closeModal = () => {
        modalHandler()
    }

    // Deletes Param Map and closes modal
    const deleteHandler = () => {
        closeModal()
        deleteObj()
    }

    return(
        <Modal
            className='apps-modal-delete'
            isOpen={modalState}
            toggle={closeModal}
        >
            <ModalHeader className='modal-header clearfix'>
                <div className='float-left'>
                    Delete Param Map
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
                        {selectedObj.label}
                    </span>
                    . This action cannot be undone.
                </Label>
            </ModalBody>
            <ModalFooter>
                <Button
                    block
                    color="danger"
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