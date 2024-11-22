// React imports
import React, {
	// useEffect,
	useRef,
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
	updateJoinOptions,
	updateJoinConditions,
	// updateTemporary
} from '../../../../../../lib/data/dataSlice'

// Library imports
import {
	faTimes,
	faSave
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
  NavLink,
	Spinner
} from 'reactstrap'

// Components
import Filters from '../../filters'

// Components
import CustomSelect from '../../../../../../components/common/CustomSelect'

const FilterSection = props => {
	// Redux
	const state = useSelector(state => state.data[props.mode][props.subdomain]?.[props.query_id])
	const dispatch = useDispatch()

	const filtersRef = useRef({})

	const [localAggPaths, setLocalAggPaths] = useState({})
	const [localJoinKeys, setLocalJoinKeys] = useState({})

	// const conditions = state?.temporary.joinConditions
	// const updateConditions = () => dispatch(updateTemporary({
  //   temporary: {
  //     ...state.temporary,
  //     joinConditions: {
	// 			columnModal: state.columnModal,
	// 			filters: JSON.stringify(filtersRef.current.getFilters())
  //     }
  //   },
  //   mode: props.mode,
  //   query_id: props.query_id,
  //   subdomain: props.subdomain
  // }))

	// useEffect(() => {
  //   if (state?.joinConditions[state?.columnModal]) {
	// 		setLocalAggPaths(state?.agg_paths)
	// 		setLocalJoinKeys(state?.joinKeys)
  //     // updateConfig({
  //     //   ...BasicConfig,
  //     //   fields: state?.joinConditions[state?.columnModal].fields
  //     // })
  //   }
  // }, [state?.filterNodes.length, state?.filterModal])

	// useEffect(() => {
	// 	updateConditions()
	// }, [JSON.stringify(JSON.stringify(filtersRef.current.getFilters()))])

	const updateLocalJoinOptions = (agg, join) => {
		let agg_paths = JSON.parse(JSON.stringify(state.agg_paths))
		let joinKeys = JSON.parse(JSON.stringify(state.joinKeys))
		if (agg) {
			agg_paths[state.columnModal] = true
			delete joinKeys[state.columnModal]
		} else if (join) {
			delete agg_paths[state.columnModal]
			joinKeys[state.columnModal] = join
		} else {
			delete agg_paths[state.columnModal]
			joinKeys[state.columnModal] = 'inner'
		}
		setLocalAggPaths(agg_paths)
		setLocalJoinKeys(joinKeys)
	}

	const saveQueryChange = () => {
		dispatch(updateJoinConditions({
      joinConditions: {
        ...state.joinConditions,
        [state.columnModal]: {
					...state.joinConditions[state.columnModal],
          filters: JSON.stringify(filtersRef.current.getFilters()),
        }
      },
      query_id: props.query_id,
      mode: props.mode,
      subdomain: props.subdomain,
    }))
		dispatch(saveTemporary({
			mode: props.mode,
			subdomain: props.subdomain,
			query_id: props.query_id
		}))
		dispatch(updateJoinOptions({
			agg_paths: localAggPaths,
			joinKeys: localJoinKeys,
			mode: props.mode,
			query_id: props.query_id,
			subdomain: props.subdomain
		}))
    props.closeModal()
	}

	const renderJoinOptions = () => (
		<div style={{
			display: 'none',
			padding: '20px 0',
			visibility: 'hidden'
		}}>
			<div style={{
				flex: '1 0 0',
				marginRight: '20px'
			}}>
				<CustomSelect
					isDisabled={localAggPaths[state.columnModal]}
					noOptionsMessage={() => 'No options match the search term'}
					onChange={value => updateLocalJoinOptions(null, value.value)}
					options={['inner', 'left', 'right'].map(element => ({ label: `${element.toUpperCase()} JOIN`, value: element }))}
					placeholder='Select Join Type'
					value={localJoinKeys[state.columnModal] ? {
						label: `${localJoinKeys[state.columnModal].toUpperCase()} JOIN`, 
						value: localJoinKeys[state.columnModal]
					} : null}
				/>
			</div>
			<div className='ml-3 mr-3 pt-2'>
				<Label style={{ display: 'flex' }}>
					<span>
						Aggregate
					</span>
					<Input
						checked={localAggPaths[state.columnModal] ? localAggPaths[state.columnModal] : ''}
						type='checkbox'
						onChange={event => updateLocalJoinOptions(event.target.checked, null)}
					/>
				</Label>
			</div>
		</div>
	)

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
				id='filter'
			>
				<NavLink className={state?.columnMode !== 'filter' ? 'active' : ''}>
					Join Conditions
				</NavLink>
			</NavItem>
		</Nav>
	)


	return(
		<>
			<ModalBody className='query-modal-filter-body'>
				{renderTabs()}
				<div className='query-modal-filter-body-container'>
					{renderJoinOptions()}
					{
						state?.joinConditions[state?.columnModal]?.filterFields &&
						state?.joinConditions[state?.columnModal]?.filters &&
						state?.operators &&
						state?.appAuth ?
						<div style={{ paddingTop: '16px' }}>
							<Filters
								ref={filtersRef}
								fields={state?.joinConditions[state?.columnModal]?.filterFields}
								filters={JSON.parse(state?.joinConditions[state?.columnModal]?.filters)}
								joinGraphs={state?.joinGraphs}
								mode='api-select-join-conditions'
								operators={state?.operators}
								sessionKeys={(state?.authentication?.value && state?.appAuth?.session_key_values) ? state?.appAuth?.session_key_values : {}}
							/>
						</div>
						:
						<div className='loading-div'>
							<Spinner
								className='loading-spinner'
								color="primary"
								type="grow"
							/>
						</div>
					}
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='query-modal-filter-footer'>
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
						onClick={saveQueryChange}
					>
						Save &nbsp;
						<FontAwesomeIcon icon={faSave} />
					</Button>
				</div>
			</ModalFooter>
		</>
	)
}

export default FilterSection