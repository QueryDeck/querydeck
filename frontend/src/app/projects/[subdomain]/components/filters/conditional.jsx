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
        label: `QUERY.${props.rules[rule].value.field.label}`,
        value: `QUERY.${props.rules[rule].value.field.label}`
      })
    }
  })
  // const options = rules.map(rule => ({
  //   label: `QUERY.${props.rules[rule].value.field.label}`,
  //   value: `QUERY.${props.rules[rule].value.field.label}`
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
          isValidNewOption={value => value.includes('QUERY.')}
          options={options}
          placeholder='Select a rule'
          value={props.groups[props.conditionalRulesModal]?.conditionalRules}
          onChange={value => props.modifyConditionalRules(props.conditionalRulesModal, value)}
        />
      </ModalBody>
    </Modal>
  )
}

export default ConditionalRules