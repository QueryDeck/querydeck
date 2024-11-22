// React imports
import React, {
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef
} from 'react'

// Reducers
import filtersReducer from './reducer'

// For unique ids for groups/rules
import { v4 as uuidv4 } from 'uuid'

// Components
import Group from './group'

// API
import api from '../../../../../api'

// Controllers
let joinedGraphsController
let joinedFieldsController

const Filters = React.forwardRef((props, ref) => {
  const {
    catchError,
    config = {
      groups: {
        root: {},
        vanilla: {}
      },
      rules: {
        root_base: {},
        base: {},
        vanilla: {}
      }
    },
    db_id,
    fields,
    filters,
    joinGraphs,
    mode,
    operators,
    sessionKeys,
    subdomain
  } = props

  useImperativeHandle(ref, () => ({
    getFilters() {
      return getFilters()
    }
  }))

  const existsOperators = {
    label: 'EXISTS clause',
    options: [
      {
        label: 'EXISTS',
        value: 'exists',
        type: 'exists'
      },
      {
        label: 'NOT EXISTS',
        value: 'not_exists',
        type: 'not_exists'
      }
    ]
  }

  const methods = [{
    label: 'Types',
    options: [
      {
        label: 'Static',
        value: 'static'
      },
      {
        label: 'Dynamic',
        value: 'dynamic'
      }
    ]
  }]

  const joinedGraphs = useRef({})
  const existsFields = useRef({})

  const defaultConfig = {
    groups: {
      root: {
        isConjunctionOr: false,
        isDisabledDeleteGroup: true,
        isHiddenDeleteGroup: true,
        isNot: false,
        isRoot: true
      },
      vanilla: {
        isConjunctionOr: false,
        isNot: false
      }
    },
    rules: {
      root_base: {
        isDisabledMethod: true,
        isHiddenMethod: true
      },
      base: {
        isDisabledMethod: true,
        isHiddenMethod: true
      },
      vanilla: {
        isDisabledMethod: true,
        isHiddenMethod: true
      }
    }
  }

  switch (mode) {
    case 'api-select-filters': {
      defaultConfig.groups = {
        ...defaultConfig.groups,
        root: {
          ...defaultConfig.groups.root,
          isDisabledNot: true,
          isHiddenNot: true
        },
        vanilla: {
          ...defaultConfig.groups.vanilla,
          isDisabledNot: true,
          isHiddenNot: true
        },
        clause: {
          ...defaultConfig.groups.vanilla,
          isDisabledAddGroup: true,
          isDisabledAddRule: true,
          isDisabledConjunction: true,
          isDisabledNot: true,
          isHiddenConjunction: true,
          isHiddenAddGroup: true,
          isHiddenAddRule: true,
          isHiddenDeleteGroup: true,
          isHiddenNot: true,
        },
        clause_vanilla: {
          ...defaultConfig.groups.vanilla,
          isDisabledDeleteGroup: true,
          isDisabledNot: true,
          isHiddenDeleteGroup: true,
          isHiddenNot: true,
        }
      }
      defaultConfig.rules = {
        ...defaultConfig.rules,
        root_base: {
          ...defaultConfig.rules.root_base,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        base: {
          ...defaultConfig.rules.base,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        vanilla: {
          ...defaultConfig.rules.vanilla,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        clause_exist: {
          ...defaultConfig.rules.vanilla,
          isDisabledField: true,
        },
      }
      break
    }
    case 'api-select-filters-disabled': {
      defaultConfig.groups = {
        ...defaultConfig.groups,
        root: {
          ...defaultConfig.groups.root,
          isDisabledGroup: true,
          isDisabledNot: true,
          isHiddenNot: true
        },
        vanilla: {
          ...defaultConfig.groups.vanilla,
          isDisabledNot: true,
          isHiddenNot: true
        },
        clause: {
          ...defaultConfig.groups.vanilla,
          isDisabledAddGroup: true,
          isDisabledAddRule: true,
          isDisabledConjunction: true,
          isDisabledGroup: true,
          isDisabledNot: true,
          isHiddenConjunction: true,
          isHiddenAddGroup: true,
          isHiddenAddRule: true,
          isHiddenDeleteGroup: true,
          isHiddenNot: true,
        },
        clause_vanilla: {
          ...defaultConfig.groups.vanilla,
          isDisabledDeleteGroup: true,
          isDisabledGroup: true,
          isDisabledNot: true,
          isHiddenDeleteGroup: true,
          isHiddenNot: true,
        }
      }
      defaultConfig.rules = {
        ...defaultConfig.rules,
        root_base: {
          ...defaultConfig.rules.root_base,
          isDisabledRule: true,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        base: {
          ...defaultConfig.rules.base,
          isDisabledRule: true,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        vanilla: {
          ...defaultConfig.rules.vanilla,
          isDisabledRule: true,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        clause_exist: {
          ...defaultConfig.rules.vanilla,
          isDisabledRule: true,
          isDisabledField: true,
        },
      }
      break
    }
    case 'api-select-join-conditions': {
      defaultConfig.groups = {
        ...defaultConfig.groups,
        root: {
          ...defaultConfig.groups.root,
          isDisabledAddRule: true,
          isDisabledConjunction: true,
          isDisabledNot: true,
          isHiddenAddRule: true,
          isHiddenNot: true
        },
        vanilla: {
          ...defaultConfig.groups.vanilla,
          isDisabledNot: true,
          isHiddenNot: true
        }
      }
      defaultConfig.rules = {
        ...defaultConfig.rules,
        root_base: {
          ...defaultConfig.rules.root_base,
          isDisabledRule: true,
          isHiddenDeleteRule: true
        },
        base: {
          ...defaultConfig.rules.base,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        vanilla: {
          ...defaultConfig.rules.vanilla,
          isDisabledMethod: false,
          isHiddenMethod: false
        }
      }
      break
    }
    case 'api-select-id-filters': {
      defaultConfig.groups = {
        ...defaultConfig.groups,
        root: {
          ...defaultConfig.groups.root,
          isDisabledAddRule: true,
          isDisabledConjunction: true,
          isDisabledNot: true,
          isHiddenAddRule: true,
          isHiddenNot: true
        },
        vanilla: {
          ...defaultConfig.groups.vanilla,
          isDisabledNot: true,
          isHiddenNot: true
        },
        clause: {
          ...defaultConfig.groups.vanilla,
          isDisabledAddGroup: true,
          isDisabledAddRule: true,
          isDisabledConjunction: true,
          isDisabledNot: true,
          isHiddenConjunction: true,
          isHiddenAddGroup: true,
          isHiddenAddRule: true,
          isHiddenDeleteGroup: true,
          isHiddenNot: true,
        },
        clause_vanilla: {
          ...defaultConfig.groups.vanilla,
          isDisabledDeleteGroup: true,
          isDisabledNot: true,
          isHiddenDeleteGroup: true,
          isHiddenNot: true,
        }
      }
      defaultConfig.rules = {
        ...defaultConfig.rules,
        root_base: {
          ...defaultConfig.rules.root_base,
          isDisabledRule: true,
          isHiddenDeleteRule: true,
          isHiddenMethod: false
        },
        base: {
          ...defaultConfig.rules.base,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        vanilla: {
          ...defaultConfig.rules.vanilla,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        clause_exist: {
          ...defaultConfig.rules.vanilla,
          isDisabledField: true,
        },
      }
      break
    }
    case 'api-update-filters':
    case 'api-delete-filters': {
      defaultConfig.groups = {
        ...defaultConfig.groups,
        root: {
          ...defaultConfig.groups.root,
          isDisabledAddRule: true,
          isDisabledConjunction: true,
          isDisabledNot: true,
          isHiddenAddRule: true,
          isHiddenNot: true
        },
        vanilla: {
          ...defaultConfig.groups.vanilla,
          isDisabledNot: true,
          isHiddenNot: true
        }
      }
      defaultConfig.rules = {
        ...defaultConfig.rules,
        root_base: {
          ...defaultConfig.rules.root_base,
          isDisabledRule: true,
          isHiddenDeleteRule: true,
          isHiddenMethod: false
        },
        base: {
          ...defaultConfig.rules.base,
          isDisabledMethod: false,
          isHiddenMethod: false
        },
        vanilla: {
          ...defaultConfig.rules.vanilla,
          isDisabledMethod: false,
          isHiddenMethod: false
        }
      }
      break
    }
    default:
      break
  }

  useEffect(() => {
    joinedGraphsController = new AbortController()
    joinedFieldsController = new AbortController()

    setFilters()

    return () => {
      joinedGraphsController.abort()
      joinedFieldsController.abort()
    }
  }, [])

  // const initialState = {
  //   "groups": {
  //     "root": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isDisabledDeleteGroup": true,
  //         "isHiddenDeleteGroup": true,
  //         "isNot": false,
  //         "isRoot": true,
  //         "isDisabledNot": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root-d10c799b"
  //       ]
  //     },
  //     "root-d10c799b": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isNot": false,
  //         "isDisabledNot": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root-d10c799b-170eb06a.clause"
  //       ]
  //     },
  //     "root-d10c799b-170eb06a.clause": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isNot": false,
  //         "isDisabledAddGroup": true,
  //         "isDisabledAddRule": true,
  //         "isDisabledConjunction": true,
  //         "isDisabledNot": true,
  //         "isHiddenConjunction": true,
  //         "isHiddenAddGroup": true,
  //         "isHiddenAddRule": true,
  //         "isHiddenDeleteGroup": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root-d10c799b-170eb06a.clause@exist",
  //         "root-d10c799b-170eb06a.clause@group"
  //       ]
  //     },
  //     "root-d10c799b-170eb06a.clause@group": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isNot": false,
  //         "isDisabledDeleteGroup": true,
  //         "isDisabledNot": true,
  //         "isHiddenDeleteGroup": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root-d10c799b-170eb06a.clause@group_d1dac2ca",
  //         "root-d10c799b-170eb06a.clause@group-d253848e"
  //       ]
  //     },
  //     "root-d10c799b-170eb06a.clause@group-d253848e": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isNot": false,
  //         "isDisabledNot": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root-d10c799b-170eb06a.clause@group-d253848e_base"
  //       ]
  //     }
  //   },
  //   "rules": {
  //     "root-d10c799b-170eb06a.clause@exist": {
  //       "config": {
  //         "isDisabledMethod": true,
  //         "isHiddenMethod": true,
  //         "isDisabledField": true
  //       },
  //       "value": {
  //         "field": {
  //           "label": "EXISTS",
  //           "value": "exists",
  //           "type": "exists",
  //           "default_type": "exists"
  //         },
  //         "operator": {
  //           "display_text": "public.language (language_id)",
  //           "degree": 1,
  //           "label": "public.language",
  //           "value": "15575122.5-15575188.1",
  //           "path": "public.film.language_id - public.language.language_id",
  //           "disable_value": true
  //         },
  //         "value": "",
  //         "method": {
  //           "label": "Static",
  //           "value": "static"
  //         }
  //       }
  //     },
  //     "root-d10c799b-170eb06a.clause@group_d1dac2ca": {
  //       "config": {
  //         "isDisabledMethod": false,
  //         "isHiddenMethod": false,
  //         "isDisabledValue": false
  //       },
  //       "value": {
  //         "field": {
  //           "label": "language_id",
  //           "display_name": "language_id",
  //           "primary": false,
  //           "type": "number",
  //           "id": "public.film.language_id",
  //           "columnID": "15575122.5",
  //           "value": "public.film.language_id",
  //           "default_type": "number"
  //         },
  //         "operator": {
  //           "label": "=",
  //           "value": "equal"
  //         },
  //         "value": "4",
  //         "method": {
  //           "label": "Static",
  //           "value": "static"
  //         }
  //       }
  //     },
  //     "root-d10c799b-170eb06a.clause@group-d253848e_base": {
  //       "config": {
  //         "isDisabledMethod": false,
  //         "isHiddenMethod": false,
  //         "isDisabledValue": false
  //       },
  //       "value": {
  //         "field": {
  //           "label": "rating",
  //           "display_name": "rating",
  //           "primary": false,
  //           "type": "text",
  //           "id": "public.film.rating",
  //           "columnID": "15575122.10",
  //           "value": "public.film.rating",
  //           "default_type": "text"
  //         },
  //         "operator": {
  //           "label": "=",
  //           "value": "equal"
  //         },
  //         "value": "hi",
  //         "method": {
  //           "label": "Static",
  //           "value": "static"
  //         }
  //       }
  //     }
  //   }
  // }

  const initialState = {
    groups: {
      root: {
        config: {
          ...defaultConfig.groups.root,
          ...config?.groups?.root
        },
        rules: ['root_base']
      }
    },
    rules: {
      root_base: {
        config: {
          ...defaultConfig.rules.root_base,
          ...config?.rules?.root_base
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

  // const initialState = {
  //   "groups": {
  //     "root": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isDisabledDeleteGroup": true,
  //         "isHiddenDeleteGroup": true,
  //         "isNot": false,
  //         "isRoot": true,
  //         "isDisabledNot": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root_862592d5",
  //         "root-62d9a524"
  //       ]
  //     },
  //     "root-62d9a524": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isNot": false,
  //         "isDisabledNot": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root-62d9a524_13c78183",
  //         "root-62d9a524-dbb2343b.clause"
  //       ]
  //     },
  //     "root-62d9a524-dbb2343b.clause": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isNot": false,
  //         "isDisabledAddGroup": true,
  //         "isDisabledAddRule": true,
  //         "isDisabledConjunction": true,
  //         "isDisabledNot": true,
  //         "isHiddenConjunction": true,
  //         "isHiddenAddGroup": true,
  //         "isHiddenAddRule": true,
  //         "isHiddenDeleteGroup": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root-62d9a524-dbb2343b.clause@exist",
  //         "root-62d9a524-dbb2343b.clause@group"
  //       ]
  //     },
  //     "root-62d9a524-dbb2343b.clause@group": {
  //       "config": {
  //         "isConjunctionOr": false,
  //         "isNot": false,
  //         "isDisabledDeleteGroup": true,
  //         "isDisabledNot": true,
  //         "isHiddenDeleteGroup": true,
  //         "isHiddenNot": true
  //       },
  //       "rules": [
  //         "root-62d9a524-dbb2343b.clause@group_9d0513e8"
  //       ]
  //     }
  //   },
  //   "rules": {
  //     "root_862592d5": {
  //       "value": {
  //         "field": {
  //           "label": "language_id",
  //           "display_name": "language_id",
  //           "primary": false,
  //           "type": "number",
  //           "id": "public.film.language_id",
  //           "columnID": "15575122.5",
  //           "value": "public.film.language_id",
  //           "default_type": "number"
  //         },
  //         "operator": {
  //           "label": "<=",
  //           "value": "less_or_equal"
  //         },
  //         "value": 4,
  //         "method": {
  //           "label": "Static",
  //           "value": "static"
  //         }
  //       },
  //       "config": {
  //         "isDisabledMethod": false,
  //         "isHiddenMethod": false,
  //         "isDisabledValue": false
  //       }
  //     },
  //     "root-62d9a524_13c78183": {
  //       "config": {
  //         "isDisabledMethod": false,
  //         "isHiddenMethod": false,
  //         "isDisabledValue": false
  //       },
  //       "value": {
  //         "field": {
  //           "label": "film_id",
  //           "display_name": "film_id",
  //           "primary": true,
  //           "type": "number",
  //           "id": "public.film.film_id",
  //           "columnID": "15575122.1",
  //           "value": "public.film.film_id",
  //           "default_type": "number"
  //         },
  //         "operator": {
  //           "label": "IS NOT NULL",
  //           "value": "is_not_empty",
  //           "disable_value": true
  //         },
  //         "value": "",
  //         "method": {
  //           "label": "Static",
  //           "value": "static"
  //         }
  //       }
  //     },
  //     "root-62d9a524-dbb2343b.clause@exist": {
  //       "config": {
  //         "isDisabledMethod": true,
  //         "isHiddenMethod": true,
  //         "isDisabledField": true
  //       },
  //       "value": {
  //         "field": {
  //           "label": "EXISTS",
  //           "value": "exists",
  //           "type": "exists",
  //           "default_type": "exists"
  //         },
  //         "operator": {
  //           "display_text": "public.inventory (film_id)",
  //           "degree": 1,
  //           "label": "public.inventory",
  //           "value": "15575122.1-15575181.2",
  //           "path": "public.inventory.film_id - public.film.film_id",
  //           "disable_value": true
  //         },
  //         "value": "",
  //         "method": {
  //           "label": "Static",
  //           "value": "static"
  //         }
  //       }
  //     },
  //     "root-62d9a524-dbb2343b.clause@group_9d0513e8": {
  //       "config": {
  //         "isDisabledMethod": false,
  //         "isHiddenMethod": false,
  //         "isDisabledValue": false
  //       },
  //       "value": {
  //         "field": {
  //           "label": "inventory_id",
  //           "display_name": "inventory_id",
  //           "primary": true,
  //           "type": "number",
  //           "id": "public.inventory.inventory_id",
  //           "columnID": "15575181.1",
  //           "value": "public.inventory.inventory_id",
  //           "default_type": "number"
  //         },
  //         "operator": {
  //           "label": "=",
  //           "value": "equal"
  //         },
  //         "value": "777",
  //         "method": {
  //           "label": "Static",
  //           "value": "static"
  //         }
  //       }
  //     }
  //   }
  // }

  const [state, dispatch] = useReducer(filtersReducer, initialState)

  // Group 
  const addGroup = group => {
    dispatch({
      type: 'ADD_GROUP',
      config,
      defaultConfig,
      group
    })
  }

  const addRule = group => {
    dispatch({
      type: 'ADD_RULE',
      config,
      defaultConfig,
      group
    })
  }

  const deleteGroup = (group, parentGroup) => {
    dispatch({
      type: 'DELETE_GROUP',
      group,
      parentGroup
    })
  }

  const toggleConjunction = group => {
    dispatch({
      type: 'TOGGLE_CONJUNCTION',
      group
    })
  }

  const toggleNot = group => {
    dispatch({
      type: 'TOGGLE_NOT',
      group
    })
  }

  // Rule
  const updateField = (rule, field) => {
    dispatch({
      type: 'UPDATE_FIELD',
      field,
      rule
    })
  }

  // formats exists clause groups
  const formatGroup = group => {
    const subGroupsList = group.split('@')
    const formattedGroup = subGroupsList.slice(0, subGroupsList.length - 1).join('@')
    if (formattedGroup.length) {
      return formattedGroup
    } else {
      return 'root'
    }
  }

  const updateOperator = (rule, operator) => {
    const existRule = {
      ...state.rules[rule].value,
      operator
    }
    const group = rule.split('_')[0]
    const clause = `${group}-${uuidv4().slice(0,8)}.clause`
    const joinRule = operator.path
    if (existRule.field.value.includes('exists') && joinRule) {
      if (rule.endsWith('@exist')) {
        const data = {
          config,
          defaultConfig,
          existRule,
          clause: rule.split('@exist')[0],
          joinRule
        }
        getExistsFields(`${rule.split('@exist')[0]}@group`, operator.value, 'update', data)
      } else {
        const data = {
          delete: {
            group,
            rule
          },
          add: {
            clause,
            config,
            defaultConfig,
            existRule,
            group,
            joinRule
          }
        }
        getExistsFields(`${clause}@group`, operator.value, 'add', data)
      }
    } else {
      dispatch({
        type: 'UPDATE_OPERATOR',
        operator,
        rule
      })
    }
  }

  const updateValue = (rule, value) => {
    dispatch({
      type: 'UPDATE_VALUE',
      rule,
      value
    })
  }

  const updateMethod = (rule, method) => {
    dispatch({
      type: 'UPDATE_METHOD',
      method,
      mode,
      sessionKeys,
      rule
    })
  }

  const deleteRule = (rule, group) => {
    dispatch({
      type: 'DELETE_RULE',
      group,
      rule
    })
  }

  const getExistsFields = async (clause, joinPath, mode, data) => {
    let flag = 2

    let localGraphs = []
    try {
      const response = await api.get('/apps/editor/join-graph', {
        params: {
          subdomain,
          id: joinPath.split('-')[joinPath.split('-').length - 1].split('.')[0],
          db_id
        },
        signal: joinedGraphsController.signal
      })
      flag -= 1
      localGraphs = response.data.data
    } catch (error) {
      catchError(error)
    }

    let localFields = {}
    try {
      const response = await api.post('/apps/editor/controllers/where-cols', {
        agg_paths: [],
        c: [{ id: `${joinPath}$1` }],
        db_id,
        subdomain
      }, {
        signal: joinedFieldsController.signal
      })
      flag -= 1
      localFields = response.data.data
      
    } catch (error) {
      catchError(error)
    }

    if (!flag) {
      joinedGraphs.current[clause] = localGraphs
      existsFields.current[clause] = [{
        label: localFields.table,
        options: localFields.columns
      }].concat(existsOperators)
      if (mode === 'update') {
        dispatch({
          type: 'UPDATE_EXIST_GROUP',
          ...data
        })
      } else if (mode === 'add') {
        dispatch({
          type: 'DELETE_RULE',
          ...data.delete
        })
        dispatch({
          type: 'ADD_EXIST_GROUP',
          ...data.add
        })
      }
    }
  }

  // convert filters to state
  const setFilters = () => {
    // number of exists clauses in the filter
    let existsClauseCount = JSON.stringify(filters).split('exists_where').length - 1

    // get hash maps of all options
    const fieldsMap = {
      base: {}
    }
    const operatorsMap = {}
    const methodsMap = {}
    const existsMap = {}
    const joinGraphMap = {}

    fields.forEach(table => {
      table.options.forEach(column => {
        fieldsMap.base[column.value] = {
          ...column,
          default_type: column.type
        }
      })
    })
    Object.values(operators).forEach(operator => {
      operator.operators.forEach(element => {
        operatorsMap[element.value] = element
      })
    })
    methods.forEach(method => {
      method.options.concat({
        label: 'Session',
        value: 'session'
      }).forEach(element => {
        methodsMap[element.value] = element
      })
    })
    existsOperators.options.forEach(option => {
      existsMap[option.value] = {
        ...option,
        default_type: option.type
      }
    })
    joinGraphs.forEach(option => {
      joinGraphMap[option.value] = option
    })

    const loadExistsFields = async (clause, joinPath, rules) => {
      let flag = 2

      let localGraphs = []
      try {
        const response = await api.get('/apps/editor/join-graph', {
          params: {
            subdomain,
            id: joinPath.split('-')[joinPath.split('-').length - 1].split('.')[0],
            db_id
          },
          signal: joinedGraphsController.signal
        })
        flag -= 1
        localGraphs = response.data.data
      } catch (error) {
        catchError(error)
      }

      let localFields = {}
      try {
        const response = await api.post('/apps/editor/controllers/where-cols', {
          agg_paths: [],
          c: [{ id: `${joinPath}$1` }],
          db_id,
          subdomain
        }, {
          signal: joinedFieldsController.signal
        })
        flag -= 1
        localFields = response.data.data
        
      } catch (error) {
        catchError(error)
      }

      if (!flag) {
        // adds an object to map inner fields
        if (!fieldsMap[clause]) {
          fieldsMap[clause] = {}
        }
        // adds default type to exists clause group fields
        localFields.columns.forEach(column => {
          fieldsMap[clause][column.value] = {
            ...column,
            default_type: column.type
          }
        })
        // appends exists graphs
        joinedGraphs.current[clause] = localGraphs
        localGraphs.forEach(option => {
          joinGraphMap[option.value] = option
        })
        // appends exists operators to fields
        existsFields.current[clause] = [{
          label: localFields.table,
          options: localFields.columns
        }].concat(existsOperators)

        existsClauseCount -= 1
        // checks if all exists clauses are added
        if (!existsClauseCount) {
          setTimeout(() => {
            // sets filters if all clauses have been added
            setFilters()
          }, 10)
        }

        // resolves filters once exists clause group is added
        resolveFilters(rules)
      }
    }

    // resolves filters to state
    const resolveFilters = filters => {
      let rulesList = filters.exists_where ? filters.exists_where.rules : filters.rules
      rulesList.forEach(rule => {
        // checks for normal groups
        if (rule.rules) {
          // gets parent id of the rule
          const parentGroupId = rule.id.split('-').slice(0, rule.id.split('-').length - 1).join('-')
          // adds the group id to parent group rules array
          groups[parentGroupId].rules.push(rule.id)
          // adds a group to the state with empty rules
          groups[rule.id] = {
            config: {
              ...defaultConfig.groups.vanilla,
              ...config?.groups?.vanilla,
              isConjunctionOr: rule.condition === 'OR',
              isNot: rule.not
            },
            rules: []
          }
          // recurses over rules to add rules to the newly added group
          resolveFilters(rule)
        // checks for exists clause
        } else if (rule.exists_where) {
          // gets parent id of the rule
          const parentGroupId = rule.id.split('-').slice(0, rule.id.split('-').length - 1).join('-')
          // adds the group id to parent group rules array
          groups[parentGroupId].rules.push(rule.id)
          // adds an exists clause to the state with exists clause rules
          groups[rule.id] = {
            config: {
              ...defaultConfig.groups.clause,
              ...config?.groups?.clause
            },
            rules: [
              `${rule.id}@exist`,
              `${rule.id}@group`
            ]
          }
          // adds exists rule in the clause
          rules[`${rule.id}@exist`] = {
            config: {
              ...defaultConfig.rules.clause_exist,
              ...config?.rules?.clause_exist
            },
            value: {
              field: existsMap[rule.operator],
              operator: joinGraphMap[rule.exists_path],
              value: '',
              method: methodsMap.static
            }
          }
          // adds exists sub rules in the clause
          groups[`${rule.id}@group`] = {
            config: {
              ...defaultConfig.groups.clause_vanilla,
              ...config?.groups?.clause_vanilla,
              isConjunctionOr: rule.exists_where.condition === 'OR',
              isNot: rule.exists_where.not
            },
            rules: []
          }

          // loads up exists clause group fields in case there is an exists clause
          loadExistsFields(`${rule.id}@group`, rule.exists_path, rule.exists_where)
        } else {
          // parent group id of rule
          const ruleGroupId = rule.id.split('_')[0]
          // adds rule id to parent group rules array
          groups[ruleGroupId].rules.push(rule.id)
          // gets a field map key to map fields for exist clauses
          const mapKey = formatGroup(ruleGroupId).includes('clause') ? `${formatGroup(ruleGroupId)}@group` : 'base'
          // adds the rule to rules state
          rules[rule.id] = {
            value: {
              // modifies field type depending on field and method
              field: {
                ...fieldsMap[mapKey][rule.fieldName],
                input: (
                  methodsMap[rule.method].value === 'dynamic' ||
                  methodsMap[rule.method].value === 'session'
                ) || (
                  rule.id === 'root_base' &&
                  mode === 'api-select-join-conditions'
                ) ? 'text' : fieldsMap[mapKey][rule.fieldName].input,
                type: (
                  methodsMap[rule.method].value === 'dynamic' ||
                  methodsMap[rule.method].value === 'session'
                ) || (
                  rule.id === 'root_base' &&
                  mode === 'api-select-join-conditions'
                )  ? 'text' : fieldsMap[mapKey][rule.fieldName].type,
              },
              operator: operatorsMap[rule.operator],
              value: rule.value,
              method: methodsMap[rule.method]
            }
          }

          // sets the base or vanilla rule config depending on rule
          if (rule.id.includes('_base')) {
            if (rule.id === 'root_base') {
              rules[rule.id].config = {
                ...defaultConfig.rules.root_base,
                ...config?.rules?.root_base,
                isDisabledValue: methodsMap[rule.method].value === 'session'
              }
            } else {
              rules[rule.id].config = {
                ...defaultConfig.rules.base,
                ...config?.rules?.base,
                isDisabledValue: methodsMap[rule.method].value === 'session'
              }
            }
          } else {
            rules[rule.id].config = {
              ...defaultConfig.rules.vanilla,
              ...config?.rules?.vanilla,
              isDisabledValue: methodsMap[rule.method].value === 'session'
            }
          }
        }
      })
    }

    // initial state config
    const groups = {
      root : {
        config: {
          ...defaultConfig.groups.root,
          ...config?.groups?.root,
          isConjunctionOr: filters.condition === 'OR',
          isNot: filters.not,
        },
        rules: []
      }
    }
    const rules = {}

    // recurses over filters to load up state
    resolveFilters(filters)

    const setFilters = () => {
      dispatch({
        type: 'SET_FILTERS',
        groups,
        rules
      })
    }

    if (!existsClauseCount) {
      setFilters()
    }
  }

  // convert state to filters
  const getFilters = () => {
    // returns a list of (nested) groups in which rule exists - level by level
    const resolveGroups = ruleId => (
      ruleId
      .split('-')
      .map((element, index) => (ruleId
        .split('-')
        .slice(0, index + 1)
        .join('-')
        .split('_')[0]
        .split('@exist')[0])
      )
    )

    // searches for rules inside exists_where
    const searchRule = (groupIds, filterRule, subRule) => {
      // console.log('Searching rule', groupIds, subRule)
      const groupId = groupIds[0]
      let ruleIndex = null
      let clauseIndex = null

      // checks if the rule is to be placed in the existing structure or if something needs to be added
      subRule.forEach((rule, index) => {
        if (rule.id === groupId) {
          // adds group if rule index matches index
          ruleIndex = index
        } else if (rule.id === formatGroup(groupId)) {
          // adds clause if clause index matches index
          clauseIndex = index
        }
      })

      if (ruleIndex) {
        // add to existing group
        if (groupIds.length <= 1) {
          // adds rule to a terminal group
          subRule[ruleIndex].rules.push(filterRule)
        }
      } else if (clauseIndex) {
        // add to existing clause
        if (groupIds.length > 1) {
          // recurses over to search the rule inside the exists_where rules
          searchRule(groupIds.slice(1, groupIds.length), filterRule, subRule[clauseIndex].exists_where.rules)
        } else {
          // adds the rule to a terminal exists clause group
          subRule[clauseIndex].exists_where.rules.push(filterRule)
        }
      } else {
        if (groupIds.length > 1) {
          let flag = true
          subRule.forEach((element, index) => {
            if (element?.exists_where?.id === groupId) {
              // searches for the group id matching with exists_where and recurses within its rules
              flag = false
              searchRule(groupIds.slice(1, groupIds.length), filterRule, subRule[index].exists_where.rules)
            }
          })
          if (flag) {
            // console.log('groupIds', groupIds)
            // console.log('subRule', subRule)
            if (filterRule.exists_where) {
              // if filter rule is an exists clause
              // console.log('filterRule if', filterRule)
              if (groupId === filterRule.id) {
                // appends the filter rule if group id matches filter rule (exists clause) id
                subRule.push(filterRule)
              } else {
                // checks for existing matching sub rule
                let ruleIndex = null
                subRule.forEach((element, index) => {
                  if (element.id === groupId) {
                    ruleIndex = index
                  }
                })
                // if (subRule.filter(element => element.id === groupId).length) {
                if (ruleIndex) {
                  // recurses inside the sub rule
                  // console.log('Found')
                  searchRule(groupIds.slice(1, groupIds.length), filterRule, subRule[ruleIndex].rules)
                } else {
                  // adds a group when there are no sub rules and recurses over
                  // console.log('Not found FR', filterRule.id)
                  // console.log('Not found SR', subRule)
                  const groupParent = filterRule.id.split('-').slice(0, filterRule.id.split('-').length - 1).join('-')
                  if (groupParent.endsWith('@group')) {
                    // console.log('Not found if')
                    subRule.forEach(element => {
                      if (element.exists_where.id === groupParent) {
                        element.exists_where.rules.push(filterRule)
                      }
                    })
                  } else {
                    // console.log('Not found else')
                    subRule.push({
                      condition: state.groups[groupId].config.isConjunctionOr ? 'OR' : 'AND',
                      id: groupId,
                      rules: [],
                      not: state.groups[groupId].config.isNot
                    })
                    searchRule(groupIds.slice(1, groupIds.length), filterRule, subRule[subRule.length - 1].rules)
                  }
                }
              }
            } else {
              // if filter rule is an exists group
              // console.log('filterRule', filterRule)
              // console.log('subRule', subRule)
              // console.log('groupIds', groupIds)
              let flag = true
              subRule.forEach((element, index) => {
                if (element.exists_where?.id === filterRule.id.split('_')[0]) {
                  // rule lies directly under the exists clause
                  flag = false
                  subRule[index].exists_where.rules.push(filterRule)
                }
              })
              if (flag) {
                // rule lies nested under group/s inside exists group
                // console.log('Something else')

                if (false) {
                  // append rule to the group
                } else {
                  // create a new group and append
                  searchRule(groupIds.slice(1, groupIds.length), filterRule, subRule)
                }

                // // checks for existing matching sub rule
                // let ruleIndex = null
                // subRule.forEach((element, index) => {
                //   console.log('Element', element)
                //   if (element.id === groupId) {
                //     ruleIndex = index
                //   }
                // })
                // if (ruleIndex) {} else {

                // }
                // console.log('RuleIndex', ruleIndex)

                // subRule[index].exists_where.rules.push({
                //   condition: state.groups[groupId].config.isConjunctionOr ? 'OR' : 'AND',
                //   id: groupId,
                //   rules: [filterRule],
                //   not: state.groups[groupId].config.isNot
                // })
              }
            }
          }
        } else {
          if (groupId === filterRule.id) {
            // group id matches filter rule id and rule is appended normally
            subRule.push(filterRule)
          } else if (groupId === filterRule.id.split('_')[0]) {
            // group id matches filter group id
            let flag = true
            subRule.forEach(element => {
              if (element?.exists_where?.id === groupId) {
                // group id matches with rule's exists_where id and is pushed into its rules
                flag = false
                element.exists_where.rules.push(filterRule)
              }
            })
            if (flag) {
              // appends a new group with the filter rule
              subRule.push({
                condition: state.groups[groupId].config.isConjunctionOr ? 'OR' : 'AND',
                id: groupId,
                rules: [filterRule],
                not: state.groups[groupId].config.isNot
              })
            }
          }
        }
      }
    }

    // recurses over rules to place them in nested groups as per query builder structure
    const resolveRules = (groupIds, filterRule, subRule) => {
      const groupId = groupIds[0]
      let ruleIndex = null
      // checks if the rule is to be placed in the existing structure or if something needs to be added
      subRule.forEach((rule, index) => {
        if (rule.id === groupId) {
          ruleIndex = index
        }
      })

      if (ruleIndex !== null) {
        if (groupIds.length > 1) {
          // recurses in case of nested rules
          resolveRules(groupIds.slice(1, groupIds.length), filterRule, subRule[ruleIndex].rules)
        } else {
          // adds a rule to the subrule
          subRule[ruleIndex].rules.push(filterRule)
        }
      } else {
        // filters rules having clauses
        if (filterRule.id.includes('.clause')) {
          // gets group id
          let filterGroupId = filterRule.id.split('_')[0]
          if (filterGroupId.endsWith('.clause')) {
            filterGroupId = filterGroupId.split('-').slice(0, filterGroupId.split('-').length - 1).join('-')
          }
          // adds root rule
          if (filterGroupId === 'root') {
            subRule.push(filterRule)
          } else {
            // resolve sub groups of the rule
            const resolvedGroups = resolveGroups(filterRule.id)
            // searches rule and recursively updates rules array
            searchRule(resolvedGroups.slice(1, resolvedGroups.length), filterRule, subRule)
          }
        } else {
          if (groupIds.length > 1) {
            // adds a group and recurses in the group rules
            subRule.push({
              condition: state.groups[groupId].config.isConjunctionOr ? 'OR' : 'AND',
              id: groupId,
              rules: [],
              not: state.groups[groupId].config.isNot
            })
            resolveRules(groupIds.slice(1, groupIds.length), filterRule, subRule[subRule.length - 1].rules)
          } else {
            // adds a group along with rule to the subgroup
            subRule.push({
              condition: state.groups[groupId].config.isConjunctionOr ? 'OR' : 'AND',
              id: groupId,
              rules: [filterRule],
              not: state.groups[groupId].config.isNot
            })
          }
        }
      }
    }

    // generates different sets of filters depending on exists clause
    const generateFilter = ruleId => {
      const rule = state.rules[ruleId].value
      if (ruleId.endsWith('@exist')) {
        return ({
          fieldName: 'fieldName',
          id: formatGroup(ruleId),
          type: 'text',
          input: 'text',
          operator: rule.field.value,
          exists_path: rule.operator.value,
          exists_where: {
            condition: state.groups[`${formatGroup(ruleId)}@group`].config.isConjunctionOr ? 'OR' : 'AND',
            id: `${formatGroup(ruleId)}@group`,
            rules: [],
            not: state.groups[`${formatGroup(ruleId)}@group`].config.isNot
          }
        })
      } else {
        return ({
          fieldName: rule.field.value,
          id: ruleId,
          input: rule.field.type,
          operator: rule.operator.value,
          method: rule.method.value,
          type: rule.field.type,
          value: rule.operator.disable_value ? null : (rule.field.type === 'number' ? Number(rule.value) : rule.value)
        })
      }
    }

    // rules array in the final object
    const rules = []
    // array of valid rules - having values/operator with value disabled
    const validRuleIds = Object.keys(state.rules).filter(ruleId => state.rules[ruleId].value.operator?.disable_value || state.rules[ruleId].value.value)

    // iterates over valid rules to add filters
    validRuleIds.forEach(ruleId => {
      const rule = state.rules[ruleId].value
      const filterRule = generateFilter(ruleId)

      // adds an input_key, required by backend to process dynamic rules
      if (rule.method.value === 'dynamic' || rule.method.value === 'session') {
        filterRule.input_key = rule.value
      }

      // group id of the rule being iterated
      const ruleGroupId = ruleId.split('_')[0]
      // list of (nested) groups of the iterated rule
      const ruleGroupIds = resolveGroups(ruleId)
      if (ruleGroupId === 'root') {
        // adds the rule to the rules array in case group id is 'root'
        rules.push(filterRule)
      } else {
        // recurses over the function to resolve rules whose group id is not 'root'
        resolveRules(ruleGroupIds.slice(1, ruleGroupIds.length), filterRule, rules)
      }
    })

    // returns the object as per query builder format
    return ({
      condition: state.groups.root.config.isConjunctionOr ? 'OR' : 'AND',
      id: 'root',
      rules,
      not: state.groups.root.config.isNot
    })
  }

  console.log('----------------------------')
  console.log('State', state)
  console.log('Filters', getFilters())
  console.log('----------------------------')

  return (
    <div className='filters'>
      <Group
        data={{
          existsFields: existsFields.current,
          fields: (mode === 'api-select-filters' || mode === 'api-select-id-filters') ? fields.concat(existsOperators) : fields,
          joinedGraphs: {
            base: joinGraphs,
            ...joinedGraphs.current
          },
          operators,
          methods,
          sessionKeys
        }}
        groupConfig={{
          ...state.groups.root.config,
          groupId: 'root',
          parentId: null
        }}
        groupFunctions={{
          addGroup,
          addRule,
          deleteGroup,
          toggleConjunction,
          toggleNot
        }}
        groupRules={state.groups.root.rules}
        groups={state.groups}
        ruleFunctions={{
          formatGroup,
          updateField,
          updateOperator,
          updateValue,
          updateMethod,
          deleteRule
        }}
        rules={state.rules}
      />
    </div>
  )
})

export default Filters