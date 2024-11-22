// React imports
import React, { useState } from 'react'

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
    ModalHeader,
    ModalFooter
} from 'reactstrap'

// Database deletion confirmation modal at '/apps/app-id/databases'
const DeleteModal = props => {

    // Props
    const {
        modalState,
        modalHandler,
        selectedDatabase,
        deleteDatabase
    } = props

    // Initial state
    const [databaseName, setDatabaseName] = useState('')

    // Updates app name field
    const databaseNameHandler = event => {
        setDatabaseName(event.target.value)
    }

    // Closes modal and resets app name field
    const closeModal = () => {
        setDatabaseName('')
        modalHandler()
    }

    // Deletes database and closes modal
    const deleteHandler = () => {
        closeModal()
        deleteDatabase()
    }

    return(
        <Modal
            className='apps-modal-delete'
            isOpen={modalState}
            toggle={closeModal}
        >
            <ModalHeader className='modal-header clearfix'>
                <div className='float-left'>
                    Delete Data Source
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
                        {selectedDatabase.name}
                    </span>
                    . This action cannot be undone.
                </Label>
                <Input
                    placeholder='Enter the data source name to confirm'
                    name='app-name'
                    value={databaseName}
                    onChange={databaseNameHandler}
                />
            </ModalBody>
            <ModalFooter>
                <Button
                    block
                    color="danger"
                    disabled={selectedDatabase.name !== databaseName}
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