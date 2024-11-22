// React imports
import React, {
  useEffect,
  useState
} from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
  saveTemporary,
  updateColumnMode,
  // updateConflictColumns,
  updateTemporary
} from '../../../../../../lib/data/dataSlice'

// Library imports
import {
  faMinus,
  faPlus,
  faSave,
  // faTable,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Button,
  ModalBody,
  ModalFooter,
  Nav,
  NavItem,
  NavLink
} from 'reactstrap'
import { toast } from 'react-toastify'

// Components
import CustomSelect from '../../../../../../components/common/CustomSelect'

const ConflictSection = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const [column, setColumn] = useState(null)
  const constraint = state?.temporary.conflictColumns.data.constraint
  const setConstraint = (columns, constraint) => dispatch(updateTemporary({
    temporary: {
      ...state.temporary,
      conflictColumns: {
        columnModal: state.columnModal,
        data: {
          columns,
          constraint
        }
      }
    },
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))
  const [constraintsList, setConstraintsList] = useState([])
  const columnsList = state?.temporary.conflictColumns.data.columns
  const setColumnsList = data => dispatch(updateTemporary({
    temporary: {
      ...state.temporary,
      conflictColumns: {
        columnModal: state.columnModal,
        data: {
          ...state.temporary.conflictColumns.data,
          columns: data
        }
      }
    },
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))

  useEffect(() => {
    const tableColumns = state.nodes.filter(element => element.id === state.columnModal)
    const constraintsHash = {}
    tableColumns[0].options.forEach(column => {
      column.uniqueColumns.forEach(element => {
        constraintsHash[element.label] = true
      })
    })
    const constraints = Object.keys(constraintsHash).map(element => ({
      label: element,
      value: element
    }))
    
    if (state?.conflictColumns[state.columnModal]?.constraint) {
      if (!state?.temporary.conflictColumns.columnModal) {
        setConstraint(state?.conflictColumns[state.columnModal]?.columns ? state?.conflictColumns[state.columnModal]?.columns : [], {
          label: state?.conflictColumns[state.columnModal]?.constraint,
          value: state?.conflictColumns[state.columnModal]?.constraint
        })
      }
    } else {
      if (!state?.temporary.conflictColumns.columnModal) {
        setColumnsList(state?.conflictColumns[state.columnModal]?.columns ? state?.conflictColumns[state.columnModal]?.columns : [])
      }
    }
    setConstraintsList(constraints)
  }, [])

  const clearFields = () => {
    setColumn(null)
  }

  const saveColumns = () => {
    if (constraint) {
      // dispatch(updateConflictColumns({
      //   conflictColumns: {
      //     ...state.conflictColumns,
      //     [state.columnModal]: {
      //       columns: columnsList,
      //       constraint: constraint.value
      //     }
      //   },
      //   mode: props.mode,
      //   query_id: props.query_id,
      //   subdomain: props.subdomain
      // }))
      dispatch(saveTemporary({
        mode: props.mode,
        subdomain: props.subdomain,
        query_id: props.query_id
      }))
      props.closeModal()
    } else {
      toast.warning(`Select a constraint to save columns`)
    }
  }

  const addColumn = columnObject => {
    // console.log('Adding Column', columnObject)
    let modifiedColumnObject = columnObject
    let flag = true
    let err
    columnsList.forEach(column => {
      if(column.id === modifiedColumnObject.id) {
        flag = false
        err = 'Column already exists'
      }
    })
    if(flag) {
      if (columnObject.tableID) {
        setColumnsList(columnsList.concat(columnObject))
      } else {
        const filteredColumns = state.nodes.filter(element => element.id === state.columnModal)
        setColumnsList(columnsList.concat({
          ...columnObject,
          tableID: filteredColumns[0].id,
          tableLabel: filteredColumns[0].label
        }))
      }
    } else {
      toast.warning(`${err}!`)
      console.warn(`${err}. Cannot add duplicate.`)
    }
  }

  const addAllColumns = filteredColumns => {
    // console.log(`Adding all columns from table ${filteredColumns[0].label} with id ${filteredColumns[0].id}`, filteredColumns[0].options)
    const columnsHash = {}
    columnsList.forEach(element => {
      columnsHash[element.id] = true
    })
    const updatedColumns = []
    filteredColumns[0].options.forEach(element => {
      if(!columnsHash[element.id]) {
        if (element.tableID) {
          updatedColumns.push(element)
        } else {
          updatedColumns.push({
            ...element,
            tableID: filteredColumns[0].id,
            tableLabel: filteredColumns[0].label
          })
        }
      }
    })
    setColumnsList(columnsList.concat(updatedColumns))
  }

  const deleteColumn = columnIndex => {
    // console.log('Deleting Column', columnIndex)
    setColumnsList(columnsList.slice(0, columnIndex).concat(columnsList.slice(columnIndex + 1, columnsList.length)))
  }

  const deleteAllColumns = filteredColumns => {
    // console.log(`Removing all columns from table ${filteredColumns[0].label} with id ${filteredColumns[0].id}`)
    const updatedColumns = columnsList.filter(element => {
      // if(state?.method?.value === 'insert' && element.tableID === filteredColumns[0].id){
      //   return element.forceRequired
      // } else {
        return element.tableID !== filteredColumns[0].id  
      // }
    })
    setColumnsList(updatedColumns)
  }

  // Adds the selected column to list
  const addColumnToList = value => {
    addColumn(value)
    clearFields()
  }

  // Removes clicked column from list
  const removeColumnFromList = column => {
    let columnIndex
    for (let i = 0; i < columnsList.length; i++) {
      if(columnsList[i].id === column.id) {
        columnIndex = i
        break
      }
    }
    deleteColumn(columnIndex)
  }

  // Renders column selector
  const renderToolbar = () => {
    return(
      <>
        <div className='query-modal-columns-conflict-content mt-3'>
          <div className='query-modal-columns-conflict-columns'>
            <CustomSelect
              // defaultMenuIsOpen={true}
              noOptionsMessage={() => 'No constraints match the search term'}
              onChange={value => setConstraint(columnsList, value)}
              options={constraintsList}
              placeholder='Select Constraint'
              value={constraint}
            />
          </div>
        </div>
        <div className='query-modal-columns-conflict-content mt-3'>
          <div className='query-modal-columns-conflict-columns'>
            <CustomSelect
              // defaultMenuIsOpen={true}
              isDisabled={!constraint}
              noOptionsMessage={() => 'No columns match the search term'}
              // onChange={value => setColumn(value)}
              onChange={value => addColumnToList(value)}
              options={state.nodes.filter(element => element.id === state.columnModal)}
              placeholder='Select Column'
              value={column}
            />
          </div>
          {/* <div>
            <Button
              color='falcon-success'
              disabled={!column}
              onClick={addColumnToList}
              size=''
            >
              <FontAwesomeIcon icon={faPlus} />
            </Button>
          </div> */}
          {
            props.mode === 'api'
          ?
            <>
              <div className='ml-3'>
                <Button
                  color='falcon-primary'
                  disabled={!constraint}
                  onClick={() => addAllColumns(state.nodes.filter(element => element.id === state.columnModal))}
                  size=''
                >
                  Select All <FontAwesomeIcon icon={faPlus} />
                </Button>
              </div>
              <div className='ml-3'>
                <Button
                  color='falcon-danger'
                  disabled={!constraint}
                  onClick={() => deleteAllColumns(state.nodes.filter(element => element.id === state.columnModal))}
                  size=''
                >
                  Unselect All <FontAwesomeIcon icon={faMinus} />
                </Button>
              </div>
            </>
          :
            ''
          }
        </div>
      </>
    )
  }

  // Renders columns list
  const renderColumnsList = () => {
    const list = []
    columnsList.forEach((element) => {
      list.push(
        <div
          className='query-modal-columns-conflict-list-container-item'
          key={`${element.id}-${element.option}`}
        >
          <div className='query-modal-columns-conflict-list-container-item-content mr-3'>
            <div className='query-modal-columns-conflict-columns'>
              <div className='fake-input'>
                {element.label}
              </div>
            </div>
          </div>
          <Button
            color='falcon-danger'
            onClick={() => removeColumnFromList(element)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>
      )
    })
    return(
      <div className='query-modal-columns-conflict-list mt-3'>
        <div className='query-modal-columns-conflict-list-container'>
          {list}
        </div>
      </div>
    )
  }

  const renderTabs = () => (
    <Nav tabs>
      <NavItem
        className='query-right-nav cursor-pointer'
        id='column'
      >
        <NavLink
          className={state?.columnMode !== 'column' ? 'active' : ''}
          onClick={(() => dispatch(updateColumnMode({
            columnMode: 'column',
            mode: props.mode,
            query_id: props.query_id,
            subdomain: props.subdomain
          })))}
        >
          Columns
        </NavLink>
      </NavItem>
      <NavItem
        className='query-right-nav cursor-pointer'
        id='conflict'
      >
        <NavLink className={state?.columnMode !== 'conflict' ? 'active' : ''}>
          Conflicting Columns
        </NavLink>
      </NavItem>
      <NavItem
        className='query-right-nav cursor-pointer'
        id='return'
      >
        <NavLink
          className={state?.columnMode !== 'return' ? 'active' : ''}
          onClick={(() => dispatch(updateColumnMode({
            columnMode: 'return',
            mode: props.mode,
            query_id: props.query_id,
            subdomain: props.subdomain
          })))}
        >
          Returned Columns
        </NavLink>
      </NavItem>
    </Nav>
  )

  return(
    <>
      <ModalBody className='query-modal-columns-body'>
        {renderTabs()}
        {renderToolbar()}
        {renderColumnsList()}
      </ModalBody>
      <ModalFooter>
        <div className='query-modal-columns-conflict-footer'>
          <Button
            block
            color='falcon-danger'
            onClick={props.closeModal}
          >
            Close &nbsp;
            <FontAwesomeIcon icon={faTimes} />
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            block
            color='falcon-success'
            disabled={!constraint}
            onClick={saveColumns}
          >
            Save &nbsp;
            <FontAwesomeIcon icon={faSave} />
          </Button>
        </div>
      </ModalFooter>
    </>
  )
}

export default ConflictSection