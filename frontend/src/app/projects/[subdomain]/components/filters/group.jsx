// React imports
import React from 'react'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCog,
  faPlus,
  faTrash
} from '@fortawesome/free-solid-svg-icons'
import Button from 'reactstrap/lib/Button'
import ButtonGroup from 'reactstrap/lib/ButtonGroup'

import Rule from './rule'

const Group = props => {
  const {
    groupId,
    isConjunctionOr,
    isDisabledAddGroup,
    isDisabledAddRule,
    isDisabledConjunction,
    isDisabledDeleteGroup,
    isDisabledGroup,
    isDisabledNot,
    isDisabledConditionalRules,
    isNot,
    isRoot,
    isHiddenAddGroup,
    isHiddenAddRule,
    isHiddenConjunction,
    isHiddenDeleteGroup,
    isHiddenNot,
    isHiddenConditionalRules,
    parentId
  } = props.groupConfig

  const {
    addGroup,
    addRule,
    deleteGroup,
    toggleConjunction,
    toggleNot
  } = props.groupFunctions

  const renderLeftToolbar = () => {
    const toolbar = []
    if (!isHiddenNot) {
      toolbar.push(
        <Button
          color={`falcon-${isNot ? 'danger' : 'primary'}`}
          disabled={isDisabledGroup || isDisabledNot}
          key='not'
          onClick={() => toggleNot(groupId)}
          size='sm'
        >
          NOT
        </Button>
      )
    }
    if (!isHiddenConjunction && props.groupRules.length > 1) {
      toolbar.push(
        <Button
          color={`falcon-${!isConjunctionOr ? 'success' : 'danger'}`}
          disabled={isDisabledGroup || isDisabledConjunction}
          key='and'
          onClick={isConjunctionOr ? () => toggleConjunction(groupId) : null}
          size='sm'
        >
          AND
        </Button>
      )
    }
    if (!isHiddenConjunction && props.groupRules.length > 1) {
      toolbar.push(
        <Button
          color={`falcon-${isConjunctionOr ? 'success' : 'danger'}`}
          disabled={isDisabledGroup || isDisabledConjunction}
          key='or'
          onClick={!isConjunctionOr ? () => toggleConjunction(groupId) : null}
          size='sm'
        >
          OR
        </Button>
      )
    }
    return (
      <ButtonGroup>
        {toolbar}
      </ButtonGroup>
    )
  }

  const validRuleIds = Object.keys(props.rules).filter(ruleId => (props.rules[ruleId].value.operator?.disable_value || props.rules[ruleId].value.value) && props.rules[ruleId].value.operator)

  const renderRightToolbar = () => {
    const toolbar = []
    if (!isHiddenConditionalRules) {
      toolbar.push(
        <Button
          color='falcon-primary'
          disabled={isDisabledGroup || isDisabledConditionalRules || !props.groups[groupId]?.rules?.length || !validRuleIds.length}
          key='conditional rules'
          onClick={() => props.updateConditionalRulesModal(groupId)}
          size='sm'
        >
          <FontAwesomeIcon icon={faCog} /> Conditional {props.groups[groupId]?.conditionalRules?.value ? `on ${props.groups[groupId]?.conditionalRules?.value}` : 'Rules'}
        </Button>
      )
    }
    if (!isHiddenAddRule) {
      toolbar.push(
        <Button
          color='falcon-primary'
          disabled={isDisabledGroup || isDisabledAddRule}
          key='add rule'
          onClick={() => addRule(groupId)}
          size='sm'
        >
          <FontAwesomeIcon icon={faPlus} /> Rule
        </Button>
      )
    }
    if (!isHiddenAddGroup) {
      toolbar.push(
        <Button
          color='falcon-primary'
          disabled={isDisabledGroup || isDisabledAddGroup}
          key='add group'
          onClick={() => addGroup(groupId)}
          size='sm'
        >
          <FontAwesomeIcon icon={faPlus} /> Group
        </Button>
      )
    }
    if (!isHiddenDeleteGroup) {
      toolbar.push(
        <Button
          color='falcon-danger'
          disabled={isDisabledGroup || isRoot || isDisabledDeleteGroup}
          key='delete group'
          onClick={parentId ? () => deleteGroup(groupId, parentId) : null}
          size='sm'
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      )
    }
    return (
      <ButtonGroup>
        {toolbar}
      </ButtonGroup>
    )
  }

  const renderChildren = () => {
    if (props.groupRules.length) {
      const children = []
      props.groupRules.forEach(child => {
        if (props.groups[child]) {
          children.push(
            <div
              className='filters-group-child'
              key={child}
            >
              {props.groupRules.length > 1 ?
                <>
                  <div className='filters-group-child-tree' />
                  <div className='filters-group-child-node' />
                </> : ''
              }
              <Group
                data={props.data}
                groupConfig={{
                  ...props.groups[child].config,
                  groupId: child,
                  parentId: groupId
                }}
                groupFunctions={props.groupFunctions}
                groupRules={props.groups[child].rules}
                groups={props.groups}
                ruleFunctions={props.ruleFunctions}
                rules={props.rules}
                updateConditionalRulesModal={props.updateConditionalRulesModal}
              />
            </div>
          )
        } else if (props.rules[child]) {
          children.push(
            <div
              className='filters-group-child'
              key={child}
            >
              {props.groupRules.length > 1 ?
                <>
                  <div className='filters-group-child-tree' />
                  <div className='filters-group-child-node' />
                </> : ''
              }
              <Rule
                data={props.data}
                groupConfig={{
                  groupId,
                  parentId
                }}
                groupFunctions={{
                  deleteGroup
                }}
                ruleConfig={{
                  ...props.rules[child].config,
                  isDisabledRule: isDisabledGroup || props.rules[child].config.isDisabledRule,
                  ruleId: child,
                  parentId: groupId
                }}
                ruleFunctions={props.ruleFunctions}
                ruleValue={props.rules[child].value}
              />
            </div>
          )
        }
      })
      return children
    }
    return null
  }

  return (
    <div className='filters-group'>
      <div className='filters-group-toolbar'>
        {renderLeftToolbar()}
        {renderRightToolbar()}
      </div>
      {renderChildren()}
    </div>
  )
}

export default Group