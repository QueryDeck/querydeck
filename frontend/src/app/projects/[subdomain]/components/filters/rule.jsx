// React imports
import React from 'react'

// Library imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import Badge from 'reactstrap/lib/Badge'
import Button from 'reactstrap/lib/Button'
import Input from 'reactstrap/lib/Input'
import Select from 'react-select'

const Rule = props => {
  const {
    existsFields,
    fields,
    joinedGraphs,
    operators,
    methods,
    sessionKeys
  } = props.data

  const {
    isDisabledField,
    isDisabledOperator,
    isDisabledValue,
    isDisabledMethod,
    isDisabledDeleteRule,
    isDisabledRule,
    isHiddenValue,
    isHiddenMethod,
    isHiddenDeleteRule,
    parentId,
    ruleId
  } = props.ruleConfig

  const {
    formatGroup,
    updateField,
    updateOperator,
    updateValue,
    updateMethod,
    deleteRule
  } = props.ruleFunctions

  const {
    field,
    operator,
    value,
    method
  } = props.ruleValue

  const renderField = () => {
    return (
      <div
        className={field?.value?.includes('exists') ? 'filters-rule-exists-field' : 'filters-rule-field'}
        key='field'
      >
        <Select
          autoFocus
          classNamePrefix='react-select'
          hideSelectedOptions
          isDisabled={isDisabledRule || isDisabledField}
          noOptionsMessage={() => 'No columns match the search term'}
          onChange={option => updateField(ruleId, {
              ...option,
            default_type: option.type
          })}
          options={existsFields[`${formatGroup(parentId)}@group`] || fields}
          placeholder='Select Column'
          value={field}
        />
      </div>
    )
  }

  const renderOperator = () => {
    if (field) {
      return (
        <div
          className={field?.value?.includes('exists') ? 'filters-rule-exists-operator' : 'filters-rule-operator'}
          key='operator'
        >
          <Select
            classNamePrefix='react-select'
            hideSelectedOptions
            formatOptionLabel={option => option.path ? (
              <div className='filters-rule-exists-operator-option'>
                <div className='filters-rule-exists-operator-option-table'>
                  <Badge>
                    {option.label}
                  </Badge>
                </div>
                <div className='filters-rule-exists-operator-option-join'>
                  {option.path}
                </div>
              </div>
            ) : option.label}
            isDisabled={isDisabledRule || isDisabledOperator}
            noOptionsMessage={() => 'No operators match the search term'}
            onChange={option => updateOperator(ruleId, option)}
            options={[{
              label: field.value.includes('exists') ? 'Joins' : 'Operators',
              options: {
                ...operators,
                exists: { operators: joinedGraphs[`${formatGroup(parentId)}@group`] || joinedGraphs.base },
                not_exists: { operators: joinedGraphs[`${formatGroup(parentId)}@group`] || joinedGraphs.base }
              }[field.type].operators
            }]}
            placeholder={`Select ${field.value.includes('exists') ? 'Join' : 'Operator'}`}
            value={operator}
          />
        </div>
      )
    }
  }
  
  const renderValue = () => {
    if (!isHiddenValue && operator && !operator?.disable_value) {
      return (
        <div
          className='filters-rule-value'
          key='value'
        >
          <Input
            disabled={isDisabledRule || isDisabledValue}
            placeholder={`Enter ${method?.value !== 'static' ? 'text' : field.type}`}
            onChange={event => updateValue(ruleId, event.target.value)}
            type={method?.value !== 'static' ? 'text' : (field.type === 'datetime' ? 'datetime-local' : field.type)}
            value={value}
            />
        </div>
      )
    }
  }

  const renderMethod = () => {
    if (!isHiddenMethod && operator && !operator?.disable_value) {
      return (
        <div
          className='filters-rule-method'
          key='method'
        >
          <Select
            classNamePrefix='react-select'
            hideSelectedOptions
            isDisabled={isDisabledRule || isDisabledMethod}
            noOptionsMessage={() => 'No types match the search term'}
            onChange={option => updateMethod(ruleId, option)}
            options={Object.keys(sessionKeys).length && field.session_key ? methods.concat({
              label: 'Session',
              value: 'session'
            }) : methods}
            placeholder='Select Type'
            value={method}
          />
        </div>
      )
    }
  }

  const renderDeleteRule = () => {
    if (!isHiddenDeleteRule) {
      return (
        <div
          className='filters-rule-delete'
          key='delete rule'
        >
          <Button
            color='falcon-danger'
            disabled={isDisabledRule || isDisabledDeleteRule}
            key='delete rule'
            onClick={() => ruleId.endsWith('@exist') ? props.groupFunctions.deleteGroup(props.groupConfig.groupId, props.groupConfig.parentId) : deleteRule(ruleId, parentId)}
            size='sm'
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      )
    }
  }

  return (
    <div className='filters-rule'>
      {renderField()}
      {renderOperator()}
      {renderValue()}
      {renderMethod()}
      {renderDeleteRule()}
    </div>
  )
}

export default Rule