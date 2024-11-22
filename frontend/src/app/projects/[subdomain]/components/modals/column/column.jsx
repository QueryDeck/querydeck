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
  // updateColumns,
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
  Input,
  Label,
  ModalBody,
  ModalFooter,
  Nav,
  NavItem,
  NavLink
} from 'reactstrap'
import { toast } from 'react-toastify'

// Components
import CustomSelect from '../../../../../../components/common/CustomSelect'

const ColumnSection = props => {
  // Redux
  const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
  const dispatch = useDispatch()

  const [column, setColumn] = useState(null)
  // const [alias, setAlias] = useState('')

  const columnsList = state?.temporary.columns.data
  const setColumnsList = data => dispatch(updateTemporary({
    temporary: {
      ...state.temporary,
      columns: {
        columnModal: state.columnModal,
        data
      }
    },
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))
  // const multipleInserts = Boolean(state?.temporary.multipleRowsHash.data)
  const setMultipleInserts = data => dispatch(updateTemporary({
    temporary: {
      ...state.temporary,
      multipleRowsHash: {
        columnModal: state.columnModal,
        data
      }
    },
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))

  const setColumnsAndMultipleInserts = (columns, multipleRowsHash) => dispatch(updateTemporary({
    temporary: {
      ...state.temporary,
      columns: {
        columnModal: state.columnModal,
        data: columns
      },
      multipleRowsHash: {
        columnModal: state.columnModal,
        data: multipleRowsHash
      }
    },
    mode: props.mode,
    query_id: props.query_id,
    subdomain: props.subdomain
  }))

  useEffect(() => {
    if(!state?.temporary.columns.columnModal && !state?.temporary.multipleRowsHash.columnModal) {
      setColumnsAndMultipleInserts(state?.columns.filter(element => element.tableID === state.columnModal), state?.multipleRowsHash[state.columnModal])
    } else if (!state?.temporary.columns.columnModal && state?.temporary.multipleRowsHash.columnModal) {
      setColumnsList(state?.columns.filter(element => element.tableID === state.columnModal))
    } else if (!state?.temporary.multipleRowsHash.columnModal && state?.temporary.columns.columnModal) {
      setMultipleInserts(state?.multipleRowsHash[state.columnModal])
    }
  }, [])

  const clearFields = () => {
    setColumn(null)
    // setAlias('')
  }

  // const toggleRequired = () => {}

  const saveColumns = () => {
    // const multipleRowsHash = JSON.parse(JSON.stringify(state.multipleRowsHash))
    // if (multipleInserts) {
    //   multipleRowsHash[state.columnModal] = true
    // } else {
    //   delete multipleRowsHash[state.columnModal]
    // }
    // const filteredColumns = state.columns.filter(element => element.tableID !== state.columnModal)
    // dispatch(updateColumns({
    //   columns: [...filteredColumns, ...columnsList],
    //   mode: props.mode,
    //   multipleRowsHash: state.method.value === 'insert' ? multipleRowsHash : {},
    //   query_id: props.query_id,
    //   subdomain: props.subdomain
    // }))
    if (state?.temporary?.columns?.data.length) {
      dispatch(saveTemporary({
        mode: props.mode,
        subdomain: props.subdomain,
        query_id: props.query_id
      }))
      props.closeModal()
    } else {
      toast.warn('At least one column needs to be selected')
    }
  }

  const addColumn = columnObject => {
    // console.log('Adding Column', columnObject)
    let modifiedColumnObject = columnObject
    if(!modifiedColumnObject.alias && modifiedColumnObject.enumLabel) {
      modifiedColumnObject.alias = modifiedColumnObject.enumLabel
    }
    let flag = true
    let err
    if(modifiedColumnObject.alias) {
      for(let i = 0; i < state.nodes.length; i++) {
        if(flag) {
          for(let j = 0; j < state.nodes[i].options.length; j++) {
            if(state.nodes[i].options[j].label === modifiedColumnObject.alias) {
              flag = false
              err = 'Column names cannot be set as aliases'
              break
            }
          }
        } else {
          break
        }
      }
    }
    columnsList.forEach(column => {
      if(column.id === modifiedColumnObject.id) {
        flag = false
        err = 'Column already exists'
      }
      if(
        column.alias &&
        modifiedColumnObject.alias &&
        column.alias === modifiedColumnObject.alias
      ) {
        flag = false
        err = 'Aliases should be distinct'
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
      if(state?.method?.value === 'insert' && element.tableID === filteredColumns[0].id){
        return element.forceRequired
      } else {
        return element.tableID !== filteredColumns[0].id  
      }
    })
    setColumnsList(updatedColumns)
  }

  // Adds the selected column to list
  const addColumnToList = value => {
    addColumn(value)
    // addColumn(alias.length ? {
    //   ...value,
    //   alias: alias === 'tp' ? '_tp' : alias
    // } : value)
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

  const toggleRequired = column => {
    const columns = []
    columnsList.forEach(element => {
      if(element.id === column.id) {
        columns.push(column)
      } else {
        columns.push(element)
      }
    })
    setColumnsList(columns)
  }

  // Renders column selector
  const renderToolbar = () => {
    return(
      <div className='query-modal-columns-vanilla-content mt-3'>
        <div className='query-modal-columns-vanilla-columns'>
          <CustomSelect
            // defaultMenuIsOpen={true}
            noOptionsMessage={() => 'No columns match the search term'}
            // onChange={value => setColumn(value)}
            onChange={value => addColumnToList(value)}
            options={state.nodes.filter(element => element.id === state.columnModal)}
            placeholder='Select Column'
            value={column}
          />
        </div>
        {/* {
          state?.method?.value === 'insert'
          ?
          <div className='ml-3 pt-2'>
            <Label
              style={{
                display: 'flex',
                flexDirection: 'row-reverse'
              }}
            >
              <span>
                Insert into multiple rows
              </span>
              &nbsp;
              <Input
                checked={multipleInserts ? multipleInserts : ''}
                onChange={event => setMultipleInserts(event.target.checked)}
                style={{
                  margin: 'unset',
                  position: 'unset'
                }}
                type='checkbox'
              />
            </Label>
          </div>
          :
          null
          // <div className='query-modal-columns-vanilla-alias mr-3'>
          //   <Input
          //     onChange={event => setAlias(event.target.value.replace(/^\s+|\s+$/g, '').replace(/\./gm, '_'))}
          //     placeholder='Alias (optional)'
          //     style={{ height: '98%' }}
          //     value={alias}
          //   />
          // </div>
        } */}
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
                onClick={() => addAllColumns(state.nodes.filter(element => element.id === state.columnModal))}
                size=''
              >
                Select All <FontAwesomeIcon icon={faPlus} />
              </Button>
            </div>
            <div className='ml-3'>
              <Button
                color='falcon-danger'
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
    )
  }

  // Renders columns list
  const renderColumnsList = () => {
    const list = []
    columnsList.forEach((element) => {
      list.push(
        <div
          className='query-modal-columns-vanilla-list-container-item'
          key={`${element.id}-${element.option}`}
        >
          <div className='query-modal-columns-vanilla-list-container-item-content'>
            <div className='query-modal-columns-vanilla-columns'>
              <div className='fake-input'>
                {element.label}
              </div>
            </div>
            {element.alias ?
              <div className='query-modal-columns-vanilla-alias ml-3'>
                <div className='fake-input'>
                  <strong>AS</strong> {element.alias}
                </div>
              </div>
              : ''
            }
          </div>
          {
            state?.method?.value === 'insert'
            ?
            <div className='ml-2 pt-2'>
              <Label
                style={{
                  display: 'flex',
                  flexDirection: 'row-reverse'
                }}
              >
                <span>
                  Required
                </span>
                &nbsp;
                <Input
                  checked={element.required ? element.required : ''}
                  disabled={element.forceRequired}
                  onChange={event => toggleRequired({
                      ...element,
                      required: event.target.checked
                    }
                  )}
                  style={{
                    margin: 'unset',
                    position: 'unset'
                  }}
                  type='checkbox'
                />
              </Label>
            </div>
            :
            null
          }
          <Button
            className='ml-3'
            color={state?.method?.value === 'insert' && element.forceRequired ? 'falcon-default' : 'falcon-danger'}
            disabled={state?.method?.value === 'insert' && element.forceRequired}
            onClick={() => removeColumnFromList(element)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>
      )
    })
    return(
      <div className='query-modal-columns-vanilla-list mt-3'>
        <div className='query-modal-columns-vanilla-list-container'>
          {list}
        </div>
      </div>
    )
  }

  const renderTabs = () => {
    switch (state?.method?.value) {
      case 'select':
      case 'select_id':
        if (state?.columnModal?.includes('.')) {
          return (
            <Nav tabs>
              <NavItem
                className='query-right-nav cursor-pointer'
                id='column'
              >
                <NavLink className={state?.columnMode !== 'column' ? 'active' : ''}>
                  Columns
                </NavLink>
              </NavItem>
              <NavItem
                className='query-right-nav cursor-pointer'
                id='filter'
              >
                <NavLink
                  className={state?.columnMode !== 'filter' ? 'active' : ''}
                  onClick={(() => dispatch(updateColumnMode({
                    columnMode: 'filter',
                    mode: props.mode,
                    query_id: props.query_id,
                    subdomain: props.subdomain
                  })))}
                >
                  Join Conditions
                </NavLink>
              </NavItem>
            </Nav>
          )
        }
        return null
      case 'insert':
        return (
          <Nav tabs>
            <NavItem
              className='query-right-nav cursor-pointer'
              id='column'
            >
              <NavLink className={state?.columnMode !== 'column' ? 'active' : ''}>
                Columns
              </NavLink>
            </NavItem>
            <NavItem
              className='query-right-nav cursor-pointer'
              id='conflict'
            >
              <NavLink
                className={state?.columnMode !== 'conflict' ? 'active' : ''}
                onClick={(() => dispatch(updateColumnMode({
                  columnMode: 'conflict',
                  mode: props.mode,
                  query_id: props.query_id,
                  subdomain: props.subdomain
                })))}
              >
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
      case 'update':
        return (
          <Nav tabs>
            <NavItem
              className='query-right-nav cursor-pointer'
              id='column'
            >
              <NavLink className={state?.columnMode !== 'column' ? 'active' : ''}>
                Columns
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
      default:
        console.error('Unknown Method', state.method)
        break
    }
  }

  return(
    <>
      <ModalBody className='query-modal-columns-body'>
        {renderTabs()}
        {renderToolbar()}
        {renderColumnsList()}
      </ModalBody>
      <ModalFooter>
        <div className='query-modal-columns-vanilla-footer'>
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

export default ColumnSection