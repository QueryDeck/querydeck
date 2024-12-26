// React imports
import React from 'react'

// Library imports
import { Card } from 'reactstrap'

// Components - Steps
// import Database from '../../steps/database'
import Base from '../../steps/base'
import Method from '../../steps/method'
import Route from '../../steps/route'
import Join from '../../steps/join'
import Columns from '../../steps/columns'
import Filter from '../../steps/filter'
import Sort from '../../steps/sort'
// import Pagination from '../../steps/pagination'
import Offset from '../../steps/offset'
import Limit from '../../steps/limit'
import Authentication from '../../steps/authentication'
import Authorisation from '../../steps/authorisation'

// Components - Modals
import JoinModal from '../../modals/join'
import ColumnModal from '../../modals/column'
import FilterModal from '../../modals/filter'
import SortModal from '../../modals/sort'
import AuthorisationModal from '../../modals/authorisation'

const Left = props => {
  // const renderDatabase = () => (
	// 	<Database
	// 		key='db-step'
	// 		mode={props.mode}
	// 		query_id={props.query_id}
	// 		subdomain={props.subdomain}
	// 	/>
	// )

  const renderBase = () => (
    <Base
      key='base-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderMethod = () => (
    <Method
      key='method-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderRoute = () => (
    <Route
      key='route-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderJoin = () => (
    <Join
      key='join-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderColumns = () => (
    <Columns
      key='columns-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderFilter = () => (
    <Filter
      key='filter-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderSort = () => (
    <Sort
      key='sort-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  // const renderPagination = () => (
  //   <Pagination
  //     key='pagination-step'
  //     mode={props.mode}
  //     query_id={props.query_id}
  //     subdomain={props.subdomain}
  //   />
  // )

  const renderOffset = () => (
    <Offset
      key='offset-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderLimit = () => (
    <Limit
      key='limit-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderAuthentication= () => (
    <Authentication
      key='authentication-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderAuthorisation= () => (
    <Authorisation
      key='authorisation-step'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )


  const renderJoinModal = () => (
    <JoinModal
      catchError={props.catchError}
      // getAggregatePaths={props.getAggregatePaths}
      key='join-modal'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderColumnModal = () => (
    <ColumnModal
      key='column-modal'
      mode={props.mode}
      query_id={props.query_id}
      searchNodes={props.searchNodes}
      subdomain={props.subdomain}
    />
  )

  const renderFilterModal = () => (
    <FilterModal
      key='filter-modal'
      mode={props.mode}
      catchError={props.catchError}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderSortModal = () => (
    <SortModal
      key='sort-modal'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )

  const renderAuthorisationModal = () => (
    <AuthorisationModal
      key='authorisation-modal'
      mode={props.mode}
      query_id={props.query_id}
      subdomain={props.subdomain}
    />
  )



  if(props.dragging) {
		return (
			<Card
        style={{
          opacity: 0.5,
          width: props.width
        }}
      />
		)
  } else  {
		return (
			<Card
        className='query-left'
        id='tour_api-left'
        style={{ width: props.width }}
      >
				<div className='query-left-builder'>
					{/* {renderDatabase()} */}
					{renderBase()}
          {renderMethod()}
          {renderRoute()}
          {renderJoin()}
          {renderColumns()}
          {renderFilter()}
          {renderSort()}
          {/* {renderPagination()} */}
          {renderOffset()}
          {renderLimit()}
          {renderAuthentication()}
          {renderAuthorisation()}
				</div>
        {renderJoinModal()}
        {renderFilterModal()}
        {renderSortModal()}
        {renderColumnModal()}
        {renderAuthorisationModal()}
        {/* {renderAutoGenerateModal()} */}
			</Card>
		)
  }
}

export default Left