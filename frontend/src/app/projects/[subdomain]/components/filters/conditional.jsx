// React imports
import React from 'react'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import Creatable from 'react-select/creatable'
import {
  Button,
  // Input,
  // Label,
  Modal,
  ModalHeader,
  ModalBody
} from 'reactstrap/lib'

const ConditionalRules = props => {
  const closeModal = () => props.updateConditionalRulesModal(null)

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

  const rules = getChildren(props.conditionalRulesModal, [])
  const options = []
  
  rules.forEach(rule => {
    if (props.rules[rule].value.field && props.rules[rule].value.field.label !== 'EXISTS') {
      options.push({
        label: props.rules[rule]?.value?.value ? props.rules[rule]?.value?.value : `QUERY.${props.rules[rule].value.field.label}`,
        value: props.rules[rule]?.value?.value ? props.rules[rule]?.value?.value : `QUERY.${props.rules[rule].value.field.label}`
      })
    }
  })
  
  if (props.sessionKeys && Object.keys(props.sessionKeys).length > 0) {
    Object.values(props.sessionKeys).forEach(sessionKey => {
      if (sessionKey.param_key) {
        options.push({
          label: `SESSION.${sessionKey.param_key}`,
          value: `SESSION.${sessionKey.param_key}`
        })
      }
    })
  }
  // const options = rules.map(rule => ({
  //   label: props.rules[rule]?.value?.value ? props.rules[rule]?.value?.value : `QUERY.${props.rules[rule].value.field.label}`,
  //   value: props.rules[rule]?.value?.value ? props.rules[rule]?.value?.value : `QUERY.${props.rules[rule].value.field.label}`
  // }))

  // const renderRules = () => {
  //   const result = []
  //   rules.forEach((rule) => {
  //     result.push(
  //       <Label
  //         style={{
  //           display: 'flex',
  //           flexDirection: 'row'
  //         }}
  //       >
  //         <Input
  //           checked={props.rules[rule].config.isDisabledRule}
  //           onChange={event => props.toggleDisableRule(rule, !props.rules[rule].config.isDisabledRule)}
  //           style={{
  //             margin: 'unset',
  //             position: 'unset'
  //           }}
  //           type='checkbox'
  //         />
  //         &nbsp;
  //         <span>
  //           {props.rules[rule].value.field.label}
  //         </span>
  //       </Label>
  //     )
  //   })
  //   return result
  // }

  return (
    <Modal
      isOpen={Boolean(props.conditionalRulesModal)}
      toggle={closeModal}
    >
      <ModalHeader className='clearfix'>
        <div className='float-left'>
          Conditional Rules
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
        {/* {renderRules()} */}
        <Creatable
          isClearable
          isValidNewOption={(inputValue) => {
            if (!inputValue || inputValue.trim() === '') return false
            return true
          }}
          formatCreateLabel={(inputValue) => {
            if (inputValue.startsWith('QUERY.') || inputValue.startsWith('SESSION.')) {
              return `Create "${inputValue}"`
            }
            return `Create "QUERY.${inputValue}"`
          }}
          options={options}
          placeholder='Select a rule'
          value={props.groups[props.conditionalRulesModal]?.conditionalRules}
          onChange={value => {
            if (value && !value.__isNew__) {
              props.modifyConditionalRules(props.conditionalRulesModal, value)
            } else if (value && value.__isNew__) {
              const inputValue = value.value
              const formattedValue = inputValue.startsWith('QUERY.') || inputValue.startsWith('SESSION.') 
                ? inputValue 
                : `QUERY.${inputValue}`
              props.modifyConditionalRules(props.conditionalRulesModal, {
                label: formattedValue,
                value: formattedValue
              })
            } else {
              props.modifyConditionalRules(props.conditionalRulesModal, value)
            }
          }}
        />
      </ModalBody>
    </Modal>
  )
}

export default ConditionalRules