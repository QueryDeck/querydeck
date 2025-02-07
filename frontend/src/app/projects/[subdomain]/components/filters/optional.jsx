// React imports
import React from 'react'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import {
  Button,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody
} from 'reactstrap/lib'

const OptionalRules = props => {
  const closeModal = () => props.updateOptionalRulesModal(null)

  const getChildren = (groupId, rules) => {
    props.groups[groupId] && props.groups[groupId].rules.forEach(rule => {
      if (props.rules[rule]) {
        rules.push(rule)
      } else {
        getChildren(rule, rules)
      }
    })
    return rules
  }

  const rules = getChildren(props.optionalRulesModal, [])

  const renderRules = () => {
    const result = []
    rules.forEach((rule) => {
      result.push(
        <Label
          style={{
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <Input
            checked={props.rules[rule].config.isDisabledRule}
            onChange={event => props.toggleDisableRule(rule, !props.rules[rule].config.isDisabledRule)}
            style={{
              margin: 'unset',
              position: 'unset'
            }}
            type='checkbox'
          />
          &nbsp;
          <span>
            {props.rules[rule].value.field.label}
          </span>
        </Label>
      )
    })
    return result
  }

  return (
    <Modal
      isOpen={Boolean(props.optionalRulesModal)}
      toggle={closeModal}
    >
      <ModalHeader className='clearfix'>
        <div className='float-left'>
            Disable Rules
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
        {renderRules()}
      </ModalBody>
    </Modal>
  )
}

export default OptionalRules