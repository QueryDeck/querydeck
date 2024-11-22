// React imports
import React, {
  useEffect,
  useRef
} from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  closeJoinModal,
  updateExpandedKeys,
  updateJoinConditions,
  // updateJoinKeys,
  updateJoinTree,
  updateJoins
} from '../../../../../lib/data/dataSlice'

// Library imports
import {
  faSquare,
  faCheckSquare
} from '@fortawesome/free-regular-svg-icons'
import {
  faMinus,
  faPlus,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from 'reactstrap'

// Custom libraries
import Tree from '@ag_meq/rtc'
import '@ag_meq/rtc/assets/index.css'

// API
import api from '../../../../../api'

// Controllers
let filtersController
let joinsController
let nodesController

const JoinModal = props => {
  // Redux
  const state = useSelector(state => state.data.api[props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const loadingRef = useRef({
    filters: false,
    nodes: false
  })

  useEffect(() => {
    filtersController = new AbortController()
    joinsController = new AbortController()
    nodesController = new AbortController()

    return () => {
      filtersController.abort()
      joinsController.abort()
      nodesController.abort()
    }
  }, [])

  const getJoinsTree = (generatedNodes, currentKey, lastLevel) => {
    let currentLevel = currentKey.split('-').length / 2
    const updateTree = data => {
      if(lastLevel < 1 || currentLevel > lastLevel) {
        console.warn('You\'ve reached the last lastLevel. This shouldn\'t get logged.')
        return
      }

      // Get Keys Array
      const keys = currentKey.split('-')
      const keysArray = []
      for (let i = 0; i < keys.length; i++) {
        if(i % 2 === 1) {
          keysArray.push(keys.slice(0, i + 1).join('-'))
        }
      }

      const positionArray = []
      let node = data

      // Gets address of tree branch to be updated
      for (let i = 0; i < keysArray.length; i++) {
        const nodePosition = node.map(e => e.key).indexOf(keysArray[i])
        positionArray.push(nodePosition)
        if(i < currentLevel) {
          node = node[nodePosition].children
        } else {
          node = generatedNodes
        }
      }

      // Update Tree function
      const recursiveUpdate = (node, step, currentLevel) => {
        if(step <= currentLevel) {
          if(step === currentLevel) {
            node.children = generatedNodes
          } else {
            if(node[positionArray[step]].children) {
              return recursiveUpdate(node[positionArray[step]].children, step + 1, currentLevel)
            } else {
              return recursiveUpdate(node[positionArray[step]], step + 1, currentLevel)
            }
          }
        }
      }

      node = data
      recursiveUpdate(node, 0, currentLevel)

      // Update tree data with added childNodes
      dispatch(updateJoinTree({
        joinTree: node,
        mode: props.mode,
        query_id: props.query_id,
        subdomain: props.subdomain
      }))
    }
    const joinTree = JSON.parse(JSON.stringify(state.joinTree))
    updateTree(joinTree)
  }

  const generateTreeNodes = async(node) => {
    try {
      const response = await api.get(node.onExpand, {
        signal: nodesController.signal
      })
      const data = response.data.data
      let generatedNodes = []
      const nodesHash = {}
      data.forEach(node => {
        if(node.nodes) {
          node.nodes.forEach(childNode => {
            if(!nodesHash[childNode.text]) {
              nodesHash[childNode.text] = 1
            } else {
              nodesHash[childNode.text] = 2
            }
          })
        }
      })
      data.forEach(node => {
        if(node.nodes) {
          node.nodes.forEach(childNode => {
            generatedNodes.push({
              title: `${childNode.text}🔗${childNode.join_path_short}${nodesHash[childNode.text] === 2 ? '✅' : ''}`,
              titleOnly: childNode.text,
              key: childNode.id,
              onExpand: childNode.onExpand,
              isLeaf: !childNode.childNodes,
              join_path: childNode.join_path,
              // joinNode: props.mode === 'queries' || (
              //   props.mode === 'api' &&
              //   state.method.value === 'select'
              // ),
              disableCheckbox: false
            })
          })
        }
      })
      const sortedNodes = generatedNodes.sort((a, b) => a.title.localeCompare(b.title))
      getJoinsTree(sortedNodes, node.props.eventKey, 8)
    } catch (error) {
      props.catchError(error)
    }
  }

  const getSubsequentJoins = async (checkedKeys, checkedNode) => {
    const agg_paths = JSON.parse(JSON.stringify(state.agg_paths))
    const joinKeys = JSON.parse(JSON.stringify(state.joinKeys))
    if(state.joins.length < checkedKeys.checked.length) {
      // Adding Join
      console.info(`Adding Join: ${checkedNode.key}`)
      let tableSet = {
        tableNodes: []
      }
      tableSet.tableID = checkedNode.key
      tableSet.tableName = checkedNode.titleOnly.split('.').splice(1, checkedNode.titleOnly.split('.').length - 1).join('')
      try {
        const response = await api.get(checkedNode.onExpand, {
          signal: joinsController.signal
        })
        const data = response.data.data
        const nodesList = [...state.nodes]
        let subsequentColumns = {
          label: checkedNode.titleOnly.split('.')[1],
          id: checkedNode.key,
          options: []
        }
        data.forEach(element => {
          subsequentColumns.options.push({
            id: element.id,
            label: element.text,
            optionType: element.optionType ? element.optionType : 'text',
            primary: element.primary,
            forceRequired: element.required,
            required: element.required,
            tableID: checkedNode.key,
            tableLabel: checkedNode.titleOnly,
            unique: element.unique,
            uniqueColumns: element.unique_cols,
            value: element.id,
          })
        })
        subsequentColumns.options = subsequentColumns.options.sort((a, b) => a.label.localeCompare(b.label))
        nodesList.push(subsequentColumns)
        data.forEach(node => {
          if(node.nodes) {
            node.nodes.forEach(element => {
              let tableNode = {
                ...element,
                key: node.text
              }
              tableSet.tableNodes.push(tableNode)
            })
          }
        })
        const joins = [...state.joins]
        const columns = [...state.columns];
        const returnColumns = [...state.returnColumns]
        joins.push(tableSet)
        if (props.mode === 'api') {
          subsequentColumns.options.forEach((column)=>{
            columns.push(column)
            returnColumns.push(column)
          })
        }

        delete joinKeys[checkedNode.key]

        dispatch(updateJoins({
          agg_paths: {
            ...agg_paths,
            [checkedNode.key]: true
          },
          checkedKeys,
          columns,
          conflictColumns: state.conflictColumns,
          joinKeys,
          joins,
          mode: props.mode,
          node: checkedNode.key,
          nodes: data,
          query_id: props.query_id,
          returnColumns,
          sorts: state.sorts,
          subdomain: props.subdomain,
          text: checkedNode.titleOnly
        }))
        getJoinConditionColumns(checkedNode.key, checkedNode.join_path.split(' = ')[0], checkedNode.join_path.split(' = ')[1])
      } catch (error) {
        props.catchError(error)
      }
    } else if(state.joins.length > checkedKeys.checked.length) {
      // Removing Join
      console.info(`Deleting Join: ${checkedNode.key}`)

      let joinDeletionIndex
      state.joins.forEach((join, index) => {
        if(join.tableID === checkedNode.key) {
          joinDeletionIndex = index
        }
      })
      const joins = state.joins.slice(0, joinDeletionIndex).concat(state.joins.slice(joinDeletionIndex + 1, state.joins.length))

      let updatedConflictColumns = JSON.parse(JSON.stringify(state.conflictColumns))
      delete updatedConflictColumns[checkedNode.key]

      delete agg_paths[checkedNode.key]
      delete joinKeys[checkedNode.key]

      dispatch(updateJoins({
        agg_paths,
        checkedKeys,
        columns: state.columns.filter(element => !element.id.includes(`${checkedNode.key}$`)),
        conflictColumns: updatedConflictColumns,
        joinKeys,
        joins,
        mode: props.mode,
        node: checkedNode.key,
        nodes: [],
        query_id: props.query_id,
        returnColumns: state.returnColumns.filter(element => !element.id.includes(`${checkedNode.key}$`)),
        sorts: state.sorts.filter(element => !element.column.id.includes(`${checkedNode.key}$`)),
        subdomain: props.subdomain,
        text: checkedNode.titleOnly
      }))

      const updatedJoinConditions = JSON.parse(JSON.stringify(state.joinConditions))
      delete updatedJoinConditions[checkedNode.key]
      dispatch(updateJoinConditions({
        joinConditions: updatedJoinConditions,
        query_id: props.query_id,
        mode: props.mode,
        subdomain: props.subdomain,
      }))
    } else {
      // Big Problem
      console.error('❗❗❗ Big Problem - Previous Joins = Current Joins')
    }
  }

  useEffect(() => {
    loadingRef.current.nodes = false
  }, [state?.joins?.length])

  useEffect(() => {
    loadingRef.current.filters = false
  }, [state?.joinConditions])

  const onCheck = (checkedKeys, event) => {
    getSubsequentJoins(checkedKeys, event.node)
    loadingRef.current = {
      filters: true,
      nodes: true
    }
  }

  const onExpand = expandedKeys => {
    dispatch(updateExpandedKeys({
      expandedKeys,
      mode: props.mode,
      query_id: props.query_id,
      subdomain: props.subdomain
    }))
  }

  // const onJoin = joinedKeys => {
  //   dispatch(updateJoinKeys({
  //     joinKeys: joinedKeys,
  //     mode: props.mode,
  //     query_id: props.query_id,
  //     subdomain: props.subdomain
  //   }))
  // }

  const onLoadData = node => {
    return new Promise(resolve => {
      if(node.props.eventKey.includes('-') && !node.props.eventKey.includes('$')) {
        generateTreeNodes(node)
        resolve()
      } else {
        resolve()
      }
    })
  }

  const getJoinConditionColumns = async(table, LHS, RHS) => {
    try {
      const response = await api.post('/apps/editor/controllers/where-cols', {
        agg_paths: Object.keys(state.agg_paths),
        c: [{ id: `${table}$1` }],
        db_id: state.database.value,
        onlyRequestedColumns: true,
        subdomain: props.subdomain
    }, {
      signal: filtersController.signal
    })
    const data = response.data.data
    dispatch(updateJoinConditions({
      joinConditions: {
        ...state.joinConditions,
        [table]: {
          filterFields: [{
            label: data.table,
            options: data.columns
          }],
          filters: JSON.stringify({
            condition: 'AND',
            id: 'root',
            rules: [{
              fieldName: LHS,
              id: 'root_base',
              input: 'text',
              operator: 'equal',
              method: 'static',
              type: 'text',
              value: RHS,
            }],
            not: false
          })
        }
      },
      query_id: props.query_id,
      mode: props.mode,
      subdomain: props.subdomain,
    }))
    } catch (error) {
      props.catchError(error)
    }
  }

  const closeModal = () => dispatch(closeJoinModal({
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))

  // Renders switcher expandable node icon
  const switcherIcon = obj => {
    if (obj.isLeaf) {
      return (
        <i>
          <svg
            viewBox="0 0 1024 1024"
            width="1em"
            height="1em"
            fill="currentColor"
            className='query-modal-join-switcher-leaf'
          />
        </i>
      )
    } else if(state.expandedKeys.includes(obj.data.key)) {
      return <FontAwesomeIcon icon={faMinus} className='query-modal-join-switcher-node' />
    } else {
      return <FontAwesomeIcon icon={faPlus} className='query-modal-join-switcher-node' />
    }
  }

  // Renders checkable node icon
  const nodeIcon = node => {
    if(node.data.showAgg) {
      return <div className='hide'></div>
    } else if(state.checkedKeys.checked && state.checkedKeys.checked.includes(node.data.key)) {
      return <FontAwesomeIcon icon={faCheckSquare} />
    } else {
      return <FontAwesomeIcon icon={faSquare} />
    }
  }

  if (state?.method?.value) {
    return(
      <Modal
        className='query-modal-join'
        isOpen={state.joinModal}
        toggle={closeModal}
      >
        <ModalHeader className='modal-header clearfix'>
          <div className='float-left'>
            Join Tables
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
        <ModalBody className='query-modal-join-body'>
          <Tree
            className='query-modal-join-tree'
            checkable={true}
            checkedKeys={state.checkedKeys}
            checkStrictly={true}
            defaultExpandParent={false}
            disabled={Object.keys(loadingRef.current).filter(element => loadingRef.current[element]).length}
            expandedKeys={state.expandedKeys}
            icon={nodeIcon}
            // joinedKeys={state.joinKeys}
            loadData={onLoadData}
            multiple={true}
            onCheck={onCheck}
            onExpand={onExpand}
            // onJoin={onJoin}
            selectable={false}
            switcherIcon={switcherIcon}
            treeData={state.joinTree}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            block
            color='falcon-danger'
            onClick={closeModal}
          >
            Close
            &nbsp;
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </ModalFooter>
      </Modal>
    )
  }
  return null
}

export default JoinModal