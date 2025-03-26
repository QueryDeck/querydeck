import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalHeader,
  ModalBody,
  Input,
  Label,
  Button
} from 'reactstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

const SessionModal = props => {
  const [sessionOverride, setSessionOverride] = useState(false)
  const [sessionKey, setSessionKey] = useState('')

  useEffect(() => {
    setSessionKey(props.sessionModal?.session_input_key)
    setSessionOverride(props.sessionModal?.session_value_override)
  }, [props.sessionModal])

  const closeModal = () => {
    props.toggleSessionOverride({
      ...props.sessionModal,
      session_value_override: sessionOverride,
      session_input_key: sessionKey.startsWith('SESSION.') ? sessionKey : `SESSION.${props.sessionModal?.label}`
    })
    props.updateSessionModal(null)
  }

  return (
    <Modal
      isOpen={Boolean(props.sessionModal)}
      toggle={closeModal}
    >
      <ModalHeader className='modal-header clearfix'>
        <div className='float-left'>
          Session Override
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
      <ModalBody style={{ display: 'flex', gap: '12px' }}>
        <Input
          style={{ flex: '1 0 0' }}
          disabled={!sessionOverride}
          value={sessionKey}
          placeholder='Enable session override to edit'
          onChange={event => setSessionKey(event.target.value)}
        />
        <Label
            style={{
              display: 'flex',
              flexDirection: 'row-reverse',
              marginBottom: '0.25rem'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Enabled
            </span>
            &nbsp;
            <Input
              checked={sessionOverride}
              onChange={event => {
                setSessionOverride(event.target.checked)
                if (event.target.checked && !sessionKey) {
                  setSessionKey(`SESSION.${props.sessionModal?.label}`)
                }
              }}
              style={{
                margin: 'unset',
                position: 'unset'
              }}
            type='checkbox'
          />
        </Label>
      </ModalBody>
    </Modal>
  )
}

export default SessionModal