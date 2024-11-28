// Redux
import { createSlice } from '@reduxjs/toolkit'
import  utils from '../../utils'
const blank = {
  api: {
    ///// LHS (Editor) /////
    name: '',
    database: {},

    method: {},
    route: '/',

    // Step 2
    appAuth: {},
    tables: [],
    operators: {},
    base: {},

    // Step 3
    joins: [],
    agg_paths: {},
    joinKeys: {},
    joinModal: false,
    joinTree: [],
    expandedKeys: [],
    checkedKeys: {
      checked: [],
      halfChecked: []
    },

    // Step 4
    nodes: [],
    columns: [], // dimensions
    columnModal: null,
    columnMode: 'column',
    joinConditions: {},
    conflictColumns: {},
    returnColumns: [],
    multipleRowsHash: {},
    temporary: {
      columns: {
        columnModal: null,
        data: []
      },
      joinConditions: {
        columnModal: null,
        filters: '{}',
      },
      conflictColumns: {
        columnModal: null,
        data: {
          columns: [],
          constraint: null
        }
      },
      returnColumns: {
        columnModal: null,
        data: []
      },
      multipleRowsHash: {
        columnModal: null,
        data: false
      }
    },

    // Step 5
    filters: '{}',
    filtersCount: 0,
    filterFields: null,
    filterModal: false,
    joinGraphs: [],

    pagination: {
      label: 'False',
      value: false
    },
    authenticationEnabled: true,
    authentication: {
      label: 'Disabled',
      value: false,
    },
    authorisation: [],
    authorisationModal: null,

    // Step 6
    sorts: [],
    sorts_dynamic: [],
    sortModal: false,

    // Step 7
    offset: 0,
    offset_dynamic: true,
    limit: 100,
    limit_dynamic: true,
    
    autoGenerateModal: false,
    autoGenerateModalStep: 1 ,
    autoGenerate: {
      methods: [],
      tables: [],
    },
    /////// LHS END ////////

    ///// RHS (Viewer) /////
    resultMode: 'sql',
    queryParams: {},
    request: {},
    request_detailed: {},
    response: {},
    response_detailed: {},
    text: '',
    /////// RHS END ////////

    //////// WIZARD  ////////
    wizardModal: true
    /////// WIZARD END //////
  }
}

const initialState = {
  // apps: {
  //   list_filtered: [],
  //   list: [],
  //   new: {},
  //   search: '',
  //   sort: ['creation-newest']
  // },
  // databases: {
  //   [subdomain]: {
  //     list_filtered: [],
  //     list: [],
  //     new: {},
  //     search: '',
  //     sort: ['creation-newest']
  //   }
  // },
  api: {},
  // apps: {},
  // charts: {},
  databases: {},
  deployments: {}
  // forms: {},
  // tables: {}
}

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setAPIlist (state, action) {
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          list: action.payload.list.sort((a, b) => a.name.localeCompare(b.name)),
          list_filtered: action.payload.list.sort((a, b) => a.name.localeCompare(b.name)),
          search: '',
          select_delete: '',
          select_preview: null,
          sort: {
            field: 'Name',
            order: true // True: Ascending | False: Descending
          }
        }
      }
    },
    updateAPIlist (state, action) {
      const list = []
      const list_filtered = []
      state.api[action.payload.subdomain].list.forEach(item => {
        if (item.query_id === action.payload.query_id) {
          list.push({
            ...item,
            data: action.payload.data
          })
        } else {
          list.push(item)
        }
      })
      state.api[action.payload.subdomain].list_filtered.forEach(item => {
        if (item.query_id === action.payload.query_id) {
          list_filtered.push({
            ...item,
            data: action.payload.data
          })
        } else {
          list_filtered.push(item)
        }
      })
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          list,
          list_filtered,
          select_preview: {
            ...state.api[action.payload.subdomain].select_preview,
            data: action.payload.data
          }
        }
      }
    },
    filterAPIlist (state, action) {
        const lowerCaseVal = action.payload.search.toLowerCase()
        const list_filtered = state.api[action.payload.subdomain].list.filter(item => (
          item.name.toLowerCase().includes(lowerCaseVal) ||
          item.apiRoute.toLowerCase().includes(lowerCaseVal) ||
          item.schema.toLowerCase().includes(lowerCaseVal) ||
          item.table.toLowerCase().includes(lowerCaseVal)
        ))
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          list_filtered,
          search: action.payload.search,
        }
      }
    },
    sortAPIlist (state, action) {
      let list = state.api[action.payload.subdomain].list
      let list_filtered = state.api[action.payload.subdomain].list_filtered
      let sort = state.api[action.payload.subdomain].sort
      if(sort.field === 'Creation') {
        if(sort.order) {
          sort.order = !sort.order
          list.sort((a, b) => a.created_at > b.created_at)
          list_filtered.sort((a, b) => a.created_at > b.created_at)
        } else {
          list.sort((a, b) => a.name.localeCompare(b.name))
          list_filtered.sort((a, b) => a.name.localeCompare(b.name))
          sort = {
            field: 'Name',
            order: true
          }
        }
      } else if(sort.field === 'Name') {
        if(sort.order) {
          list.sort((a, b) => b.name.localeCompare(a.name))
          list_filtered.sort((a, b) => b.name.localeCompare(a.name))
          sort.order = !sort.order
        } else {
          list.sort((a, b) => a.created_at < b.created_at)
          list_filtered.sort((a, b) => a.created_at < b.created_at)
          sort = {
            field: 'Creation',
            order: true
          }
        }
      }
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          list,
          list_filtered,
          sort
        }
      }
    },
    selectDeleteAPIlist (state, action) {
      switch (typeof(action.payload.select_delete)) {
        case 'object': {
          // Query => Model opened
          state.api = {
            ...state.api,
            [action.payload.subdomain]: {
              ...state.api[action.payload.subdomain],
              select_delete: action.payload.select_delete,
            }
          }
          break
        }
        case 'string': {
          // Query ID => Modal closed after deletion
          if (action.payload.select_delete.length) {
            const list = state.api[action.payload.subdomain].list
            const list_filtered = state.api[action.payload.subdomain].list_filtered
            const listIndex = Object.keys(list).map(element => list[element].query_id).indexOf(action.payload.select_delete)
            const filteredIndex = Object.keys(list_filtered).map(element => list_filtered[element].query_id).indexOf(action.payload.select_delete)
            state.api = {
              ...state.api,
              [action.payload.subdomain]: {
                ...state.api[action.payload.subdomain],
                list: list.slice(0, listIndex).concat(list.slice(listIndex + 1, list.length)),
                list_filtered: list_filtered.slice(0, filteredIndex).concat(list_filtered.slice(filteredIndex + 1, list_filtered.length)),
                select_delete: action.payload.select_delete,
              }
            }
          } else {
            // Empty => Modal being closed without deletion
            state.api = {
              ...state.api,
              [action.payload.subdomain]: {
                ...state.api[action.payload.subdomain],
                select_delete: action.payload.select_delete,
              }
            }
          }
          break
        }
        default:
          console.error('Invalid payload', action.payload.select_delete)
          break
      }
    },
    selectPreviewAPIlist (state, action) {
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          select_preview: action.payload.select_preview,
        }
      }
    },
    setDatabasesList (state, action) {
      state.databases = {
        ...state.databases,
        [action.payload.subdomain]: {
          ...state.databases[action.payload.subdomain],
          list_filtered: action.payload.databases,
          list: action.payload.databases,
        }
      }
    },
    setAppAuth (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            appAuth: action.payload.appAuth,
            authentication: action.payload.authentication ? action.payload.authentication : state[action.payload.mode][action.payload.subdomain][action.payload.query_id].authentication
          }
        }
      }
    },
    setTablesList (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          select_preview: null,
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            tables: action.payload.tables,
            operators: action.payload.operators
          }
        }
      }
    },
    setNew (state, action) {
      if (state.databases[action.payload.subdomain]) {
        state[action.payload.mode] = {
          ...state[action.payload.mode],
          [action.payload.subdomain]: {
            ...state[action.payload.mode][action.payload.subdomain],
            new: {
              ...blank[action.payload.mode],
              database: {
                label: state.databases[action.payload.subdomain].list[0].dbalias,
                value: state.databases[action.payload.subdomain].list[0].db_id
              }
            }
          }
        }
      } else {
        state[action.payload.mode] = {
          ...state[action.payload.mode],
          [action.payload.subdomain]: {
            ...state[action.payload.mode][action.payload.subdomain],
            new: blank[action.payload.mode]
          }
        }
      }
    },
    setSaved (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: blank[action.payload.mode]
        }
      }
    },
    setDatabase (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...blank[action.payload.mode],
            database: action.payload.database,
            resultMode: 'sql'
          }
        }
      }
    },
    restoreAPI (state, action) {
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          [action.payload.query_id]: {
            ...blank.api,
            database: state.api[action.payload.subdomain][action.payload.query_id].database,
            appAuth: state.api[action.payload.subdomain][action.payload.query_id].appAuth,
            tables: state.api[action.payload.subdomain][action.payload.query_id].tables,
            operators: state.api[action.payload.subdomain][action.payload.query_id].operators,
            ...action.payload.state
          }
        }
      }
    },
    restoreNodes (state, action) {
      const agg_paths = {}
      state[action.payload.mode][action.payload.subdomain][action.payload.query_id].checkedKeys.checked.forEach(element => {
        agg_paths[element] = true
      })

      const baseData = action.payload.data[state[action.payload.mode][action.payload.subdomain][action.payload.query_id].base?.value]
      const nodes = [{
        label: baseData.text,
        id: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].base?.value,
        options: baseData.nodes.map(child => ({
          id: child.id,
          label: child.text,
          optionType: child.optionType ? child.optionType : 'text',
          primary: child.primary,
          forceRequired: child.required,
          required: child.required,
          tableLabel: action.payload.text,
          unique: child.unique,
          uniqueColumns: child.unique_cols,
          value: child.id
        }))
      }]
      const joins = state[action.payload.mode][action.payload.subdomain][action.payload.query_id].checkedKeys.checked.map(element => {
        return ({
          tableID: element,
          tableName: action.payload.data[element]?.text?.split('.')[1],
          tableNodes: []
        })
      })

      const joinNodes = []
      const nodesHash = {}

      baseData.nodes.forEach(node => {
        if(node.nodes) {
          node.nodes.forEach(element => {
            let tableNode = {
              ...element,
              key: node.text
            }
            joinNodes.push(tableNode)
          })
        }
      })
      joinNodes.forEach(childNode => {
        if(!nodesHash[childNode.text]) {
          nodesHash[childNode.text] = 1
        } else {
          nodesHash[childNode.text] = 2
        }
      })

      const joinTree = joinNodes.map(childNode => ({
        title: `${childNode.text}🔗${childNode.join_path_short}${nodesHash[childNode.text] === 2 ? '✅' : ''}`,
        titleOnly: childNode.text,
        join_path: childNode.join_path,
        key: childNode.id,
        onExpand: childNode.onExpand,
        isLeaf: !childNode.childNodes,
        // joinNode: action.payload.mode === 'queries' || (
        //   action.payload.mode === 'api' &&
        //   state.api[action.payload.subdomain][action.payload.query_id].method.value === 'select'
        // ),
        showAgg: false,
        disableCheckbox: false
      }))

      joins.forEach(element => {
        const data = action.payload.data[element.tableID]
        const nodesList = []
        let subsequentColumns = {
          label: action.payload.data[element]?.text?.split('.')[1],
          id: element.tableID,
          options: []
        }

        const newNode = {
          label: data.text,
          id: element.tableID,
          options: data.nodes.map(child => ({
            id: child.id,
            label: child.text,
            optionType: child.optionType ? child.optionType : 'text',
            primary: child.primary,
            forceRequired: child.required,
            required: child.required,
            tableLabel: action.payload.text,
            unique: child.unique,
            uniqueColumns: child.unique_cols,
            value: child.id
          }))
        }
        nodes.push(newNode)

        data.nodes.forEach(child => {
          subsequentColumns.options.push({
            id: child.id,
            label: child.text,
            optionType: child.optionType ? child.optionType : 'text',
            primary: child.primary,
            forceRequired: child.required,
            required: child.required,
            tableID: child.tableID,
            tableLabel: action.payload.data[element]?.text,
            unique: child.unique,
            uniqueColumns: child.unique_cols,
            value: child.id,
          })
        })

        subsequentColumns.options = subsequentColumns.options.sort((a, b) => a.label.localeCompare(b.label))
        nodesList.push(subsequentColumns)

        data.nodes.forEach(node => {
          if(node.nodes) {
            node.nodes.forEach(child => {
              let tableNode = {
                ...child,
                key: node.text
              }
              element.tableNodes.push(tableNode)
            })
          }
        })
      })


      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            agg_paths,
            joins,
            joinTree,
            nodes
          }
        }
      }
    },
    restoreFilters (state, action) {
      const joinConditions = JSON.parse(JSON.stringify(state[action.payload.mode][action.payload.subdomain][action.payload.query_id].joinConditions))
      state[action.payload.mode][action.payload.subdomain][action.payload.query_id].checkedKeys.checked.forEach(element => {
        joinConditions[element] = {
          ...joinConditions[element],
          filterFields: [{
            label: action.payload.joinConditions[element].table,
            options: action.payload.joinConditions[element].columns,
          }]
        }
      })
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            filterFields: action.payload.filterFields,
            joinConditions
          }
        }
      }
    },
    setBase(state, action) {
      const primaryKeyCols = state[action.payload.mode][action.payload.subdomain][action.payload.query_id].tables.find((item) => item.id === action.payload.base.value)?.p_key || [];
      const hasSingleId = state[action.payload.mode][action.payload.subdomain][action.payload.query_id].tables.find((item) => item.id === action.payload.base.value)?.has_single_id || false;

      
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...blank[action.payload.mode],
            appAuth: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].appAuth,
            authentication: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].authentication,
            base: { ...action.payload.base,  primaryKeyCols, hasSingleId },
            database: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].database,
            method: {},
            name: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].name,
            route: `/${action.payload.base.label}`,
            tables: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].tables,
            operators: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].operators
          }
        }
      }
    },
    setMethod (state, action) {
      const base = JSON.parse(JSON.stringify(state.api[action.payload.subdomain][action.payload.query_id].base)); 
      let formattedRoute = JSON.parse(JSON.stringify(state.api[action.payload.subdomain][action.payload.query_id].route));
      let method = JSON.parse(JSON.stringify(state.api[action.payload.subdomain][action.payload.query_id].method));
      if ((action.payload.method?.value === 'select_id' || action.payload.method?.value === 'update' || action.payload.method?.value === 'delete') && !formattedRoute.includes(`:${base.primaryKeyCols[0]}`)){
        formattedRoute = `${formattedRoute}${formattedRoute.slice(-1) === '/'? '': '/' }:${base.primaryKeyCols[0]}`;
      } else {
        if(
          (method?.value === 'select_id' || method?.value === 'update' || method?.value === 'delete') &&
          (action.payload.method.value === 'select' || action.payload.method.value === 'insert')
        ){ // if previous method is 'put' then on check for '/:uid'
          formattedRoute = utils.removeRouteQueryParam(formattedRoute)
        }
        if(formattedRoute.length === 0 ){
          formattedRoute = '/';
        }
      }
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          [action.payload.query_id]: {
            ...blank[action.payload.mode],
            appAuth: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].appAuth,
            authentication: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].authentication,
            base: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].base,
            database: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].database,
            name: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].name,
            method: action.payload.method,
            route: formattedRoute,
            tables: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].tables,
            operators: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].operators,
          }
        }
      }
    },
    setRoute(state, action) {
      const base = JSON.parse(JSON.stringify(state.api[action.payload.subdomain][action.payload.query_id].base));
      const method = JSON.parse(JSON.stringify(state.api[action.payload.subdomain][action.payload.query_id].method));
      let formattedRoute = action.payload.route
      let paramLabel = '';
      if (method?.value === 'select_id' || method?.value === 'update' || method?.value === 'delete') {
        formattedRoute = utils.removeRouteQueryParam(formattedRoute)
        paramLabel = ':' + base.primaryKeyCols[0];
        if (formattedRoute.length > 0) {
          paramLabel = '/' + paramLabel;
        }
      }
      formattedRoute = formattedRoute.replace(/[^a-z0-9/_-]/gi, '')

      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          [action.payload.query_id]: {
            ...state.api[action.payload.subdomain][action.payload.query_id],
            route: (formattedRoute[0] === '/' ? formattedRoute : `/${formattedRoute}`) + paramLabel
          }
        }
      }
    },
    setNodes (state, action) {
      // Joins
      const joinNodes = []
      action.payload.nodes.nodes.forEach(node => {
        if(node.nodes) {
          node.nodes.forEach(element => {
            let tableNode = {
              ...element,
              key: node.text
            }
            joinNodes.push(tableNode)
          })
        }
      })

      // Join Tree
      const nodesHash = {}
      joinNodes.forEach(childNode => {
        if(!nodesHash[childNode.text]) {
          nodesHash[childNode.text] = 1
        } else {
          nodesHash[childNode.text] = 2
        }
      })
      const joinTree = joinNodes.map(childNode => ({
        title: `${childNode.text}🔗${childNode.join_path_short}${nodesHash[childNode.text] === 2 ? '✅' : ''}`,
        titleOnly: childNode.text,
        join_path: childNode.join_path,
        key: childNode.id,
        onExpand: childNode.onExpand,
        isLeaf: !childNode.childNodes,
        // joinNode: action.payload.mode === 'queries' || (
        //   action.payload.mode === 'api' &&
        //   state.api[action.payload.subdomain][action.payload.query_id].method.value === 'select'
        // ),
        showAgg: false,
        disableCheckbox: false
      }))

      // Nodes
      const node = {
        label: action.payload.nodes.text,
        id: action.payload.node,
        options: []
      }
      action.payload.nodes.nodes.forEach(element => {
        node.options.push({
          id: element.id,
          label: element.text,
          optionType: element.optionType ? element.optionType : 'text',
          primary: element.primary,
          forceRequired: element.required,
          required: element.required,
          tableID: action.payload.node,
          tableLabel: action.payload.nodes.text,
          unique: element.unique,
          uniqueColumns: element.unique_cols,
          value: element.id
        })
      })
      // Adding columns by default, for API
      node.options.sort((a, b) => a.label.localeCompare(b.label))
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            nodes: action.payload.node.includes('.') ? [...state.api[action.payload.mode][action.payload.subdomain][action.payload.query_id].nodes, node] : [node],
            joinTree: action.payload.node.includes('.') ? [...state.api[action.payload.mode][action.payload.subdomain][action.payload.query_id].joinTree, ...joinTree] : joinTree,
            columns: action.payload.node.includes('.') ? [...state.api[action.payload.mode][action.payload.subdomain][action.payload.query_id].columns, ...node.options] : node.options,
            returnColumns: action.payload.node.includes('.') ? [...state.api[action.payload.mode][action.payload.subdomain][action.payload.query_id].returnColumns, ...node.options] : node.options,
          }
        }
      }
    },
    closeJoinModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            joinModal: false
          }
        }
      }
    },
    openJoinModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            joinModal: true
          }
        }
      }
    },
    updateExpandedKeys (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            expandedKeys: action.payload.expandedKeys
          }
        }
      }
    },
    // updateJoinKeys (state, action) {
    //   state[action.payload.mode] = {
    //     ...state[action.payload.mode],
    //     [action.payload.subdomain]: {
    //       ...state[action.payload.mode][action.payload.subdomain],
    //       [action.payload.query_id]: {
    //         ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
    //         joinKeys: action.payload.joinKeys
    //       }
    //     }
    //   }
    // },
    updateJoinTree (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            joinTree: action.payload.joinTree
          }
        }
      }
    },
    updateJoins (state, action) {
      const node = {
        label: action.payload.text,
        id: action.payload.node,
        options: []
      }
      action.payload.nodes.forEach(element => {
        node.options.push({
          id: element.id,
          label: element.text,
          optionType: element.optionType ? element.optionType : 'text',
          primary: element.primary,
          forceRequired: element.required,
          required: element.required,
          tableLabel: action.payload.text,
          unique: element.unique,
          uniqueColumns: element.unique_cols,
          value: element.id
        })
      })
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            agg_paths: action.payload.agg_paths,
            checkedKeys: action.payload.checkedKeys,
            columns: action.payload.columns,
            conflictColumns: action.payload.conflictColumns,
            joinKeys: action.payload.joinKeys,
            joins: action.payload.joins,
            nodes: action.payload.nodes.length ? [...state[action.payload.mode][action.payload.subdomain][action.payload.query_id].nodes, node] : state[action.payload.mode][action.payload.subdomain][action.payload.query_id].nodes.filter(element => element.id !== action.payload.node),
            returnColumns: action.payload.returnColumns,
            sorts: action.payload.sorts
          }
        }
      }
    },
    closeColumnModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            columnModal: null,
            temporary: {
              columns: {
                columnModal: null,
                data: []
              },
              joinConditions: {
                columnModal: null,
                filters: '{}',
              },
              conflictColumns: {
                columnModal: null,
                data: {
                  columns: [],
                  constraint: null
                }
              },
              returnColumns: {
                columnModal: null,
                data: []
              },
              multipleRowsHash: {
                columnModal: null,
                data: false
              }
            }
          }
        }
      }
    },
    openColumnModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            columnModal: action.payload.columnModal
          }
        }
      }
    },
    updateTemporary (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            temporary: action.payload.temporary
          }
        }
      }
    },
    saveTemporary (state, action) {
      const columnsList = state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.columns.data
      const filteredColumns = state[action.payload.mode][action.payload.subdomain][action.payload.query_id].columns.filter(element => element.tableID !== state[action.payload.mode][action.payload.subdomain][action.payload.query_id].columnModal)

      const multipleRowsHash = JSON.parse(JSON.stringify(state[action.payload.mode][action.payload.subdomain][action.payload.query_id].multipleRowsHash))
      if (state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.multipleRowsHash.data) {
        multipleRowsHash[state[action.payload.mode][action.payload.subdomain][action.payload.query_id].columnModal] = true
      } else {
        delete multipleRowsHash[state[action.payload.mode][action.payload.subdomain][action.payload.query_id].columnModal]
      }
      
      const returnColumnsList = state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.returnColumns.data
      const filteredReturnColumns = state[action.payload.mode][action.payload.subdomain][action.payload.query_id].returnColumns.filter(element => element.tableID !== state[action.payload.mode][action.payload.subdomain][action.payload.query_id].columnModal)

      const updatedData = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            columnModal: null,
            temporary: {
              columns: {
                columnModal: null,
                data: []
              },
              joinConditions: {
                columnModal: null,
                filters: '{}',
              },
              conflictColumns: {
                columnModal: null,
                data: {
                  columns: [],
                  constraint: null
                }
              },
              returnColumns: {
                columnModal: null,
                data: []
              },
              multipleRowsHash: {
                columnModal: null,
                data: false
              }
            }
          }
        }
      }
      if (state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.columns.columnModal) {
        updatedData[action.payload.subdomain][action.payload.query_id].columns = [...filteredColumns, ...columnsList]
      }
      if (state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.joinConditions.columnModal) {
        updatedData[action.payload.subdomain][action.payload.query_id].joinConditions = {
          ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id].joinConditions,
          [state[action.payload.mode][action.payload.subdomain][action.payload.query_id].columnModal]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id].joinConditions[state[action.payload.mode][action.payload.subdomain][action.payload.query_id].columnModal],
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.joinConditions
          }
        }
      }
      if (state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.conflictColumns.columnModal) {
        updatedData[action.payload.subdomain][action.payload.query_id].conflictColumns = {
          ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id].conflictColumns,
          [state[action.payload.mode][action.payload.subdomain][action.payload.query_id].columnModal]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.conflictColumns.data,
            constraint: state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.conflictColumns.data.constraint ? state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.conflictColumns.data.constraint.value : null
          }
        }
      }
      if (state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.returnColumns.columnModal) {
        updatedData[action.payload.subdomain][action.payload.query_id].returnColumns = [...filteredReturnColumns, ...returnColumnsList]
      }
      if (state[action.payload.mode][action.payload.subdomain][action.payload.query_id].temporary.multipleRowsHash.columnModal) {
        updatedData[action.payload.subdomain][action.payload.query_id].multipleRowsHash = multipleRowsHash
      }
      state[action.payload.mode] = updatedData
    },
    updateColumnMode (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            columnMode: action.payload.columnMode
          }
        }
      }
    },
    updateColumns (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            columns: action.payload.columns,
            multipleRowsHash: action.payload.multipleRowsHash
          }
        }
      }
    },
    updateJoinOptions (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            agg_paths: action.payload.agg_paths,
            joinKeys: action.payload.joinKeys
          }
        }
      }
    },
    updateJoinConditions (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            joinConditions: action.payload.joinConditions
          }
        }
      }
    },
    updateConflictColumns (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            conflictColumns: action.payload.conflictColumns
          }
        }
      }
    },
    updateReturnColumns (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            returnColumns: action.payload.returnColumns
          }
        }
      }
    },
    closeFilterModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            filterModal: false
          }
        }
      }
    },
    openFilterModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            filterModal: true
          }
        }
      }
    },
    setFilterNodes (state, action) {
      const primaryKey = action.payload.filterFields[0].options.filter(column => column.primary)[0]
      const filters = state[action.payload.mode][action.payload.subdomain][action.payload.query_id].filters
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            filterFields: action.payload.filterFields,
            filters: filters.length <= 2 ? JSON.stringify({
              condition: 'AND',
              id: 'root',
              rules: (
                state[action.payload.mode][action.payload.subdomain][action.payload.query_id].method?.value === 'select_id' ||
                state[action.payload.mode][action.payload.subdomain][action.payload.query_id].method?.value === 'update' ||
                state[action.payload.mode][action.payload.subdomain][action.payload.query_id].method?.value === 'delete'
              ) ? [{
                fieldName: primaryKey.value,
                id: 'root_base',
                input: 'text',
                operator: 'equal',
                method: 'dynamic',
                type: 'text',
                value: `URLParam.${primaryKey.label}`,
                input_key: `URLParam.${primaryKey.label}`
              }] : [],
              not: false
            }) : filters
          }
        }
      }
    },
    setJoinGraphs (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            joinGraphs: action.payload.joinGraphs
          }
        }
      }
    },
    updateFilters (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            filters: action.payload.filters,
          }
        }
      }
    },
    closeSortModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            sortModal: false
          }
        }
      }
    },
    openSortModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            sortModal: true
          }
        }
      }
    },
    updateSorts (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            sorts: action.payload.sorts || state[action.payload.mode][action.payload.subdomain][action.payload.query_id].sorts,
            sorts_dynamic: action.payload.sorts_dynamic || state[action.payload.mode][action.payload.subdomain][action.payload.query_id].sorts_dynamic
          }
        }
      }
    },
    setPagination (state, action) {
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          [action.payload.query_id]: {
            ...state.api[action.payload.subdomain][action.payload.query_id],
            pagination: action.payload.pagination
          }
        }
      }
    },
    setAuthentication (state, action) {
      state.api = {
        ...state.api,
        [action.payload.subdomain]: {
          ...state.api[action.payload.subdomain],
          [action.payload.query_id]: {
            ...state.api[action.payload.subdomain][action.payload.query_id],
            authentication: action.payload.authentication
          }
        }
      }
    },
    closeAuthorisationModal(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            authorisationModal: null
          }
        }
      }
    },
    openAuthorisationModal(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            authorisationModal: action.payload.authorisationModal
          }
        }
      }
    },

    setOffset(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            offset: action.payload.offset
          }
        }
      }
    },
    toggleDynamicOffset(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            offset_dynamic: !state[action.payload.mode][action.payload.subdomain][action.payload.query_id].offset_dynamic
          }
        }
      }
    },
    setLimit(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            limit: action.payload.limit
          }
        }
      }
    },
    toggleDynamicLimit(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            limit_dynamic: !state[action.payload.mode][action.payload.subdomain][action.payload.query_id].limit_dynamic
          }
        }
      }
    },
    setResultMode (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            resultMode: action.payload.resultMode
          }
        }
      }
    },
    setResult (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          select_preview: null,
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            authenticationEnabled: action.payload.authenticationEnabled,
            authorisation: action.payload.authorisation,
            filtersCount: action.payload.filtersCount,
            name: action.payload.name,
            queryParams: action.payload.queryParams,
            request: action.payload.request,
            request_detailed: action.payload.request_detailed,
            response: action.payload.response,
            response_detailed: action.payload.response_detailed,
            text: action.payload.text
          }
        }
      }
    },
    openAutoGenerateModal(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            autoGenerateModal: action.payload.autoGenerateModal
          }
        }
      }
    },

    closeAutoGenerateModal(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            autoGenerateModal: blank.api.autoGenerateModal,
            autoGenerateModalStep: blank.api.autoGenerateModalStep,
            autoGenerate: blank.api.autoGenerate,
            
          }
        }
      }
    },
    updateAutoGenerateMethod(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            autoGenerate:      {
              ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id]?.autoGenerate,
              methods:  action.payload.methods,
            },  
          }
        }
      }
    },
    updateAutoGenerateTable(state, action) {

      action.payload.tables.sort((a,b)=>{
       return  a.label.localeCompare(b.label)
      });
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            autoGenerate:      {
              ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id]?.autoGenerate,
              tables:  action.payload.tables,
            },  
          }
        }
      }
    },


    
    updateAutoGenerateModalStep(state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          [action.payload.query_id]: {
            ...state[action.payload.mode][action.payload.subdomain][action.payload.query_id],
            autoGenerateModalStep:  action.payload.autoGenerateModalStep,
          }
        }
      }
    },
    closeWizardModal (state, action) {
      state[action.payload.mode] = {
        ...state[action.payload.mode],
        [action.payload.subdomain]: {
          ...state[action.payload.mode][action.payload.subdomain],
          new: {
            ...state[action.payload.mode][action.payload.subdomain].new,
            wizardModal: false
          }
        }
      }
    },
    updateDeploymentDiff (state, action) {
      state.deployments = {
        ...state.deployments,
        [action.payload.subdomain]: action.payload.diff
      }
    }
  }
})

export const {
  setAPIlist,
  updateAPIlist,
  sortAPIlist,
  filterAPIlist,
  selectDeleteAPIlist,
  selectPreviewAPIlist,
  setDatabasesList,
  setAppAuth,
  setTablesList,
  setNew,
  setSaved,
  restoreAPI,
  restoreNodes,
  restoreFilters,
  setDatabase,
  setBase,
  setRoute,
  setMethod,
  setNodes,
  closeJoinModal,
  openJoinModal,
  updateCheckedKeys,
  updateExpandedKeys,
  updateJoinKeys,
  updateJoinTree,
  updateJoins,
  closeColumnModal,
  openColumnModal,
  updateTemporary,
  saveTemporary,
  updateColumnMode,
  updateColumns,
  updateJoinOptions,
  updateJoinConditions,
  updateConflictColumns,
  updateReturnColumns,
  closeFilterModal,
  openFilterModal,
  setFilterNodes,
  setJoinGraphs,
  updateFilters,
  closeSortModal,
  openSortModal,
  updateSorts,
  toggleDynamicSorts,
  setPagination,
  setAuthentication,
  closeAuthorisationModal,
  openAuthorisationModal,
  setOffset,
  toggleDynamicOffset,
  setLimit,
  toggleDynamicLimit,
  setResultMode,
  setResult,
  closeWizardModal,
  openAutoGenerateModal,
  closeAutoGenerateModal,
  updateAutoGenerateMethod,
  updateAutoGenerateModalStep,
  updateAutoGenerateTable,

  updateDeploymentDiff
} = dataSlice.actions

export default dataSlice.reducer