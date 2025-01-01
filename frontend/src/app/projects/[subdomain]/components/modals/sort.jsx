// React imports
import React, { useState } from 'react'

// Redux
import {
  useDispatch,
  useSelector
} from 'react-redux'
import {
	closeSortModal,
	updateSorts
} from '../../../../../lib/data/dataSlice'

// Library imports
import {
  faPlus,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Select from 'react-select'
import {
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalFooter,
  ModalBody,
	Nav,
  NavItem,
  NavLink,
	TabContent,
	TabPane
} from 'reactstrap'
import { toast } from 'react-toastify'

// SCSS module
// import styles from './sort.module.scss'

const SortModal = props => {
	// Redux
	const state = useSelector(state => state.data.api[props.subdomain]?.[props.query_id])
	const dispatch = useDispatch()

	// State
	const [tab, setTab] = useState('static')
	const [selectedColumn, setSelectedColumn] = useState(null)
	const [ascOrder, setAscOrder] = useState(true)
	const [selectedDynamicColumn, setSelectedDynamicColumn] = useState(null)

	if (state?.base?.value) {
		const tablesInUse = {}
		state.nodes.forEach(element => {
			const elementID = element.id
			if(tablesInUse[elementID.split('-')[elementID.split('-').length - 1].split('.')[0]]) {
				if(!tablesInUse[elementID.split('-')[elementID.split('-').length - 1].split('.')[0]].includes(elementID)) {
					tablesInUse[elementID.split('-')[elementID.split('-').length - 1].split('.')[0]].push(elementID)
				}
			} else {
				tablesInUse[elementID.split('-')[elementID.split('-').length - 1].split('.')[0]] = [elementID]
			}
		})

		// Clears data and closes modal
		const closeModal = () => {
			setSelectedColumn(null)
			setAscOrder(true)
			dispatch(closeSortModal({
				mode: props.mode,
				query_id: props.query_id,
				subdomain: props.subdomain
			}))
		}

		// Toggles sorting order
		const changeOrder = () => {
			setAscOrder(!ascOrder)
		}

		// Adds the item to the sorting list
		const addToList = () => {
			// console.log(`Adding Sort: ${selectedColumn.id}, asc: ${ascOrder}`)
			let flag = true
			state.sorts.forEach(sort => {
				if(sort.column.id === selectedColumn.id) {
					flag = false
				}
			})
			if(flag) {
				dispatch(updateSorts({
					mode: props.mode,
					query_id: props.query_id,
					subdomain: props.subdomain,
					sorts: [
						...state.sorts,
						{
							column: selectedColumn,
							order: ascOrder
						}
					]
				}))
				setSelectedColumn(null)
				setAscOrder(true)
			} else {
				toast.warning(`Column already exists!`)
				console.warn('Column already exists. Cannot add duplicate.')
			}
		}

		// Adds the item to the sorting list
		const addToDynamicList = () => {
			// console.log(`Adding Sort: ${selectedColumn.id}, asc: ${ascOrder}`)
			let flag = true
			if (state?.sorts_dynamic) {
				state.sorts_dynamic.forEach(sort => {
					if(sort.id === selectedDynamicColumn.id) {
						flag = false
					}
				})
			}
			if(flag) {
				dispatch(updateSorts({
					mode: props.mode,
					query_id: props.query_id,
					subdomain: props.subdomain,
					sorts_dynamic: [
						...state.sorts_dynamic,
						selectedDynamicColumn
					]
				}))
				setSelectedDynamicColumn(null)
				setAscOrder(true)
			} else {
				toast.warning(`Column already exists!`)
				console.warn('Column already exists. Cannot add duplicate.')
			}
		}

		const removeFromList = column => {
			// console.log('Deleting Sort', column)
			let breakIndex
			for (let i = 0; i < state.sorts.length; i++) {
				if(state.sorts[i].column.id === column.id) {
					breakIndex = i
					break
				}
			}
			dispatch(updateSorts({
				mode: props.mode,
				query_id: props.query_id,
				subdomain: props.subdomain,
				sorts: state.sorts.slice(0, breakIndex).concat(state.sorts.slice(breakIndex + 1, state.sorts.length))
			}))
		}

		const removeDynamicFromList = column => {
			// console.log('Deleting Sort', column)
			let breakIndex
			for (let i = 0; i < state.sorts_dynamic.length; i++) {
				if(state.sorts_dynamic[i].id === column.id) {
					breakIndex = i
					break
				}
			}
			dispatch(updateSorts({
				mode: props.mode,
				query_id: props.query_id,
				subdomain: props.subdomain,
				sorts_dynamic: state.sorts_dynamic.slice(0, breakIndex).concat(state.sorts_dynamic.slice(breakIndex + 1, state.sorts_dynamic.length))
			}))
		}

		// Renders sort selector
		const renderSorts = () => {
			return(
				<div className='query-modal-sort-content mt-3'>
					<div className='query-modal-sort-columns mr-3'>
						<Select
							classNamePrefix='react-select'
							// defaultMenuIsOpen={true}
							hideSelectedOptions
							onChange={value => setSelectedColumn(value)}
							options={state.nodes.slice(0,1)} // only show sort options for base table
							placeholder='Select Column'
							value={selectedColumn}
						/>
					</div>
					<div className='query-modal-sort-order mr-3'>
						<Button
							color={ascOrder ? 'falcon-info' : 'falcon-primary'}
							onClick={changeOrder}
						>
							{ascOrder ? 'ASC' : 'DESC'}
						</Button>
					</div>
					<div>
						<Button
							className='mr-1'
							color='falcon-success'
							disabled={!selectedColumn}
							onClick={addToList}
							size=''
						>
							<FontAwesomeIcon icon={faPlus} />
						</Button>
					</div>
				</div>
			)
		}

		// Renders sort selector
		const renderDynamicSorts = () => {
			return(
				<div className='query-modal-sort-content mt-3'>
					<div className='query-modal-sort-columns mr-3'>
						<Select
							classNamePrefix='react-select'
							// defaultMenuIsOpen={true}
							hideSelectedOptions
							onChange={value => setSelectedDynamicColumn(value)}
							options={state.nodes.slice(0,1)} // only show sort options for base table
							placeholder='Select Column'
							value={selectedDynamicColumn}
						/>
					</div>
					<div>
						<Button
							className='mr-1'
							color='falcon-success'
							disabled={!selectedDynamicColumn}
							onClick={addToDynamicList}
							size=''
						>
							<FontAwesomeIcon icon={faPlus} />
						</Button>
					</div>
				</div>
			)
		}

		// Renders sorts list
		const renderSortsList = () => {
			const localSortsList = []
			state.sorts.forEach(element => {
				localSortsList.push(
					<div
						className='query-modal-sort-list-container-item'
						key={element.column.id}
					>
						<div className='query-modal-sort-list-container-item-content'>
							<div className='query-modal-sort-columns'>
								{element.column.label}
							</div>
							<div>
								<Badge>{element.order ? 'ASC' : 'DESC'}</Badge>
							</div>
						</div>
						<Button
							color='falcon-danger'
							onClick={() => removeFromList(element.column)}
						>
							<FontAwesomeIcon icon={faTimes} />
						</Button>
					</div>
				)
			})
			return(
				<div className='query-modal-sort-list mt-3'>
					<div className='query-modal-sort-list-container'>
						{localSortsList}
					</div>
				</div>
			)
		}

		// Renders sorts list
		const renderDynamicSortsList = () => {
			const localSortsList = []
			if (state?.sorts_dynamic) {
				state.sorts_dynamic.forEach(element => {
					localSortsList.push(
						<div
							className='query-modal-sort-list-container-item'
							key={element.id}
						>
							<div className='query-modal-sort-list-container-item-content'>
								<div className='query-modal-sort-columns'>
									{element.label}
								</div>
							</div>
							<Button
								color='falcon-danger'
								onClick={() => removeDynamicFromList(element)}
							>
								<FontAwesomeIcon icon={faTimes} />
							</Button>
						</div>
					)
				})
			}
			return(
				<div className='query-modal-sort-list mt-3'>
					<div className='query-modal-sort-list-container'>
						{localSortsList}
					</div>
				</div>
			)
		}

		return(
			<Modal
				className='query-modal-sort'
				isOpen={state.sortModal}
				toggle={closeModal}
			>
				<ModalHeader className='modal-header clearfix'>
					<div className='float-left'>
						Sort Columns
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
				<ModalBody className='query-modal-sort-body'>
					<Nav tabs>
            <NavItem
              className='query-right-nav cursor-pointer'
              id='column'
            >
              <NavLink
								className={tab !== 'static' ? 'active' : ''}
								onClick={() => setTab('static')}
							>
                Sorting
              </NavLink>
            </NavItem>
            <NavItem
              className='query-right-nav cursor-pointer'
              id='return'
            >
              <NavLink
                className={tab !== 'dynamic' ? 'active' : ''}
								onClick={() => setTab('dynamic')}
              >
                Dynamic Sorting
              </NavLink>
            </NavItem>
          </Nav>
					<TabContent activeTab={tab}>
						<TabPane tabId='static' >
							{renderSorts()}
							{renderSortsList()}
						</TabPane>
						<TabPane tabId='dynamic' >
							{renderDynamicSorts()}
							{renderDynamicSortsList()}
						</TabPane>
					</TabContent>
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

export default SortModal