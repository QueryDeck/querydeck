// React imports
import React, {
    useEffect,
    useState
} from 'react'
import { useHistory } from 'react-router-dom'

// Redux
import { useDispatch } from 'react-redux'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTimes,
    faKey
} from '@fortawesome/free-solid-svg-icons'
import Cookies from 'js-cookie'
import {
    Button,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalHeader,
    ModalFooter
} from 'reactstrap'
import { toast } from 'react-toastify'

// API
import api from '../../../api'

// Abort controllers for cancelling network requests
let changePasswordController

// Change password modal in sidebar
const ChangePasswordModal = props => {
    // Redux
    const reduxDispatch = useDispatch()

    // Props
    const {
        modalState,
        modalHandler
    } = props

    // For 403 errors on unauthorised users
    let history = useHistory()

    // Initial State
    const [passwordOld, setPasswordOld] = useState('')
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')

    useEffect(() => {
        changePasswordController = new AbortController()

        return () => {
            changePasswordController.abort()
        }
    })

    const passwordOldHandler = event => {
        setPasswordOld(event.target.value)
    }

    const password1Handler = event => {
        setPassword1(event.target.value)
    }

    const password2Handler = event => {
        setPassword2(event.target.value)
    }

    // Closes modal and resets password field
    const closeModal = () => {
        setPasswordOld('')
        setPassword1('')
        setPassword2('')
        modalHandler()
    }

    const changePassword = () => {
        if(password1 === password2) {
            api.post('/account/change-password', {
                old_password: passwordOld,
                new_password: password1,
                signal: changePasswordController
            }).then(res => {
                console.log('res', res.data)
                toast.success('Password changed successfully')
                closeModal()
            }).catch(err => {
                console.error(err)
                if(err.response) {
                    if(err.response.status === 403) {
                        Cookies.remove('session')
                        toast.warning(`Please login again`)
                        reduxDispatch({ type: 'RESET' })
                        history.push(`/auth/login?redirect=/apps`)
                    } else if(err.response.status === 400) {
                        toast.error('Incorrect Password')
                    } else if(err.response.status === 404) {
                        toast.error('Error 404 | Not Found')
                    } else if(err.response.status === 500) {
                        toast.error('Error 500 | Internal Server Error')
                    }
                }
            })
        } else {
            toast.error(`Passwords don't match`)
        }
    }

    return(
        <Modal
            className='apps-modal-delete'
            isOpen={modalState}
            toggle={closeModal}
        >
            <ModalHeader className='modal-header clearfix'>
                <div className='float-left'>
                    Change Password
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
            <ModalBody>
                <Label style={{ width: '100%' }}>
                    Old Password
                    <Input
                        onChange={passwordOldHandler}
                        minLength={8}
                        placeholder='Enter new password'
                        type='password'
                        value={passwordOld}
                    />
                </Label>
                <Label style={{ width: '100%' }}>
                    New Password
                    <Input
                        onChange={password1Handler}
                        minLength={8}
                        placeholder='Enter new password'
                        type='password'
                        value={password1}
                    />
                </Label>
                <Label style={{ width: '100%' }}>
                    Re-enter New Password
                    <Input
                        onChange={password2Handler}
                        minLength={8}
                        placeholder='Re-enter new password'
                        type='password'
                        value={password2}
                    />
                </Label>
            </ModalBody>
            <ModalFooter>
                <Button
                    block
                    color="falcon-success"
                    disabled={password1 !== password2}
                    onClick={changePassword}
                >
                    Update Password
                    &nbsp;
                    <FontAwesomeIcon icon={faKey} />
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default ChangePasswordModal