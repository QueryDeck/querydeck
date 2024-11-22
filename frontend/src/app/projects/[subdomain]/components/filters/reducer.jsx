// For unique ids for groups/rules
import { v4 as uuidv4 } from 'uuid'

// Reducer exclusively for custom filters module
const filtersReducer = (state, action) => {
  switch (action.type) {
    // Set filters
    case 'SET_FILTERS': {
      return {
        ...state,
        groups: action.groups,
        rules: action.rules
      }
    }
    // Add group
    case 'ADD_GROUP': {
      const groupId = `${action.group}-${uuidv4().slice(0,8)}`
      const ruleId = `${groupId}_base`
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.group]: {
            ...state.groups[action.group],
            rules: [...state.groups[action.group].rules, groupId]
          },
          [groupId]: {
            config: {
              ...action.defaultConfig.groups.vanilla,
              ...action.config?.groups?.vanilla
            },
            rules: [`${groupId}_base`]
          }
        },
        rules: {
          ...state.rules,
          [ruleId]: {
            config: {
              ...action.defaultConfig.rules.base,
              ...action.config?.rules?.base
            },
            value: {
              field: null,
              operator: null,
              value: '',
              method: {
                label: 'Static',
                value: 'static'
              }
            }
          }
        }
      }
    }
    // Add exist group
    case 'ADD_EXIST_GROUP': {
      // const clauseId = `${action.group}-${uuidv4().slice(0,8)}.clause`
      const clauseId = action.clause
      const existRuleId = `${clauseId}@exist`
      const existGroupId = `${clauseId}@group`
      const existSubRuleId = `${existGroupId}_${uuidv4().slice(0,8)}`

      return {
        ...state,
        groups: {
          ...state.groups,
          [action.group]: {
            ...state.groups[action.group],
            rules: [...state.groups[action.group].rules, clauseId]
          },
          [clauseId]: {
            config: {
              ...action.defaultConfig.groups.clause,
              ...action.config?.groups?.clause
            },
            rules: [
              existRuleId,
              existGroupId
            ]
          },
          [existGroupId]: {
            config: {
              ...action.defaultConfig.groups.clause_vanilla,
              ...action.config?.groups?.clause_vanilla
            },
            rules: [existSubRuleId]
          }
        },
        rules: {
          ...state.rules,
          [existRuleId]: {
            config: {
              ...action.defaultConfig.rules.clause_exist,
              ...action.config?.rules?.clause_exist
            },
            value: {
              ...action.existRule,
              method: {
                label: 'Static',
                value: 'static'
              }
            }
          },
          [existSubRuleId]: {
            config: {
              ...action.defaultConfig.rules.vanilla,
              ...action.config?.rules?.vanilla
            },
            value: {
              field: null,
              operator: null,
              value: '',
              method: {
                label: 'Static',
                value: 'static'
              }
            }
          }
        }
      }
    }
    // Update exist group
    case 'UPDATE_EXIST_GROUP': {
      const clauseId = action.clause
      const existRuleId = `${clauseId}@exist`
      const existGroupId = `${clauseId}@group`
      const existSubRuleId = `${existGroupId}_${uuidv4().slice(0,8)}`

      Object.keys(state.groups).forEach(group => {
        if (group.includes(existGroupId)) {
          delete state.groups[group]
        }
      })
      Object.keys(state.rules).forEach(rule => {
        if (rule.includes(existGroupId)) {
          delete state.rules[rule]
        }
      })

      return {
        ...state,
        groups: {
          ...state.groups,
          [clauseId]: {
            ...state.groups[clauseId],
            rules: [
              existRuleId,
              existGroupId
            ]
          },
          [existGroupId]: {
            config: {
              ...action.defaultConfig.groups.clause_vanilla,
              ...action.config?.groups?.clause_vanilla
            },
            rules: [existSubRuleId]
          }
        },
        rules: {
          ...state.rules,
          [existRuleId]: {
            config: {
              ...action.defaultConfig.rules.clause_exist,
              ...action.config?.rules?.clause_exist
            },
            value: {
              ...action.existRule,
              method: {
                label: 'Static',
                value: 'static'
              }
            }
          },
          [existSubRuleId]: {
            config: {
              ...action.defaultConfig.rules.vanilla,
              ...action.config?.rules?.vanilla
            },
            value: {
              field: null,
              operator: null,
              value: '',
              method: {
                label: 'Static',
                value: 'static'
              }
            }
          }
        }
      }
    }
    // Add rule
    case 'ADD_RULE': {
      const ruleId = `${action.group}_${uuidv4().slice(0,8)}`
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.group]: {
            ...state.groups[action.group],
            rules: [...state.groups[action.group].rules, ruleId]
          }
        },
        rules: {
          ...state.rules,
          [ruleId]: {
            config: {
              ...action.defaultConfig.rules.vanilla,
              ...action.config?.rules?.vanilla
            },
            value: {
              field: null,
              operator: null,
              value: '',
              method: {
                label: 'Static',
                value: 'static'
              }
            }
          }
        }
      }
    }
    // Delete group
    case 'DELETE_GROUP': {
      Object.keys(state.groups).forEach(group => {
        if (group.includes(action.group)) {
          delete state.groups[group]
        }
      })
      Object.keys(state.rules).forEach(rule => {
        if (rule.includes(action.group)) {
          delete state.rules[rule]
        }
      })
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.parentGroup]: {
            ...state.groups[action.parentGroup],
            rules: state.groups[action.parentGroup].rules.filter(element => element !== action.group)
          }
        }
      }
    }
    // Toggle conjunction
    case 'TOGGLE_CONJUNCTION': {
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.group]: {
            ...state.groups[action.group],
            config: {
              ...state.groups[action.group].config,
              isConjunctionOr: !state.groups[action.group].config.isConjunctionOr
            }
          }
        }
      }
    }
    // Toggle not
    case 'TOGGLE_NOT': {
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.group]: {
            ...state.groups[action.group],
            config: {
              ...state.groups[action.group].config,
              isNot: !state.groups[action.group].config.isNot
            }
          }
        }
      }
    }
    // Update rule field
    case 'UPDATE_FIELD': {
      return {
        ...state,
        rules: {
          ...state.rules,
          [action.rule]: {
            ...state.rules[action.rule],
            value: {
              ...state.rules[action.rule].value,
              field: action.field,
              operator: null,
              value: '',
              method: {
                label: 'Static',
                value: 'static'
              }
            }
          }
        }
      }
    }
    // Update rule operator
    case 'UPDATE_OPERATOR': {
      return {
        ...state,
        rules: {
          ...state.rules,
          [action.rule]: {
            ...state.rules[action.rule],
            config: {
              ...state.rules[action.rule].config,
              isDisabledValue: false
            },
            value: {
              ...state.rules[action.rule].value,
              operator: action.operator
            }
          }
        }
      }
    }
    // Update rule value
    case 'UPDATE_VALUE': {
      return {
        ...state,
        rules: {
          ...state.rules,
          [action.rule]: {
            ...state.rules[action.rule],
            value: {
              ...state.rules[action.rule].value,
              value: action.value
            }
          }
        }
      }
    }
    // Update rule method
    case 'UPDATE_METHOD': {
      const updatedState = {
        ...state,
        rules: {
          ...state.rules,
          [action.rule]: {
            ...state.rules[action.rule],
            config: {
              ...state.rules[action.rule].config,
              isDisabledValue: false
            },
            value: {
              ...state.rules[action.rule].value,
              value: '',
              method: action.method
            }
          }
        }
      }
      switch (action.mode) {
        case 'api-select-filters':
        case 'api-select-id-filters':
        case 'api-select-join-conditions':
        case 'api-update-filters':
        case 'api-delete-filters': {
          if (action.method.value === 'dynamic') {
            updatedState.rules[action.rule].value.field.input = 'text'
            updatedState.rules[action.rule].value.field.type = 'text'
            updatedState.rules[action.rule].value.value = `QUERY.${updatedState.rules[action.rule].value.field.value.split('.')[updatedState.rules[action.rule].value.field.value.split('.').length - 1]}`
          } else if (action.method.value === 'session') {
            updatedState.rules[action.rule].value.field.input = 'text'
            updatedState.rules[action.rule].value.field.type = 'text'
            updatedState.rules[action.rule].config.isDisabledValue = true
            updatedState.rules[action.rule].value.value = `SESSION.${action.sessionKeys[updatedState.rules[action.rule].value.field.session_key].param_key}`
          } else if (action.method.value === 'static') {
            updatedState.rules[action.rule].value.field.input = updatedState.rules[action.rule].value.field.default_type
            updatedState.rules[action.rule].value.field.type = updatedState.rules[action.rule].value.field.default_type
          }
          break
        }
        default:
          break
      }
      return updatedState
    }
    // Delete rule
    case 'DELETE_RULE': {
      delete state.rules[action.rule]
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.group]: {
            ...state.groups[action.group],
            rules: state.groups[action.group].rules.filter(element => element !== action.rule)
          }
        }
      }
    }
    default:
      throw new Error(`Unknown action type in filtersReducer: ${action.type}`)
  }
}

export default filtersReducer