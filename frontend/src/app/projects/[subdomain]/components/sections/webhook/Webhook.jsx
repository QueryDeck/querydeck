// React imports
import React, { useEffect, useState ,useRef } from 'react'
import { Helmet } from "react-helmet";
import Menu from "../../../../../../components/interface/menu/Menu";
import Header from "../engine/header";
// Redux
import {
  useDispatch,
} from 'react-redux'
import {
  filterAPIlist,
} from '../../../../../../lib/data/dataSlice'

// SCSS module
// import styles from './webhook.module.scss'


// Library imports
import {
  faPlus,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Button,
  Card,
  Input,
  Spinner,
  Badge,
} from 'reactstrap'
// API
// import api from '../../../../../../api'

// Components
import CreateWebhook from './modals/CreateWebhook'

// Controllers
let loadDatabaseController

const Webhook = props => {
  const [modalState, setModalState] = useState(false);
  const [state] = useState({
    api: null,
    sort: {
      field: 'Creation',
      order: true,
    },
    filter: '',
    // Add any other required fields that are used in this file
  });

  const toggleModalState = () => {
    setModalState(!modalState);
    // toggleModalState();
  };

  // useEffect(() => {
  //   const apiData = state.api[props.subdomain];
  //   setState(prevState => ({
  //     ...prevState,
  //     api: apiData,
  //     sort: apiData.sort,
  //     filter: apiData.filter,
  //   }));
  // }, [props.subdomain]);
  const [tooltipState, setTooltipState] = useState({});
  const dispatch = useDispatch()
  // const [dbData, setDbData] = useState(null)
  // const history = useHistory()
  const timeoutIDs = useRef([]);

  useEffect(() => {
    loadDatabaseController = new AbortController()

    return () => {
      loadDatabaseController.abort()
    }
  }, [])

  // const loadDatabaseFromApi = async (query_id) => {
  //   let data;
  //   try {
  //     if (!dbData) {
  //       const response = await api.get('/apps/editor/controllers/saved-query-db', {
  //         params: {
  //           apiMode: true,
  //           query_id
  //         },
  //       })
  //       data = response.data.data
  //       setDbData(data)
  //     } else {
  //       data = dbData;
  //     }
  //     return data;
  //   } catch (error) {
  //     props.catchError(error)
  //   }
  // }

  // const renderSortIcon = () => {
  //   if (state.sort.field === 'Creation') {
  //     return state.sort.order ? faSortNumericDown : faSortNumericUp;
  //   } else if (state.sort.field === 'Name') {
  //     return state.sort.order ? faSortAlphaDown : faSortAlphaUp;
  //   }
  // }

  // // Define the missing functions
  // const cycleField = () => {
  //   // Logic to cycle through fields for sorting
  //   // Example: dispatch an action to change the sort field
  // };

  // const toggleOrder = () => {
  //   // Logic to toggle the sort order
  //   // Example: dispatch an action to change the sort order
  // };

  // const renderOrderIcon = () => {
  //   // Logic to render the appropriate sort icon
  //   return renderSortIcon();
  // };

  const updateFilter = (event) => {
    // Logic to update the filter based on input
    dispatch(filterAPIlist({
      search: event.target.value,
      subdomain: props.subdomain
    }));
  };

  // const toggleModal = (modalType, state) => {
  //   // Logic to toggle modal visibility
  //   // Example: setState to show/hide the modal
  // };

  // Renders list toolbar
  const renderToolbar = () => {
    return (
      <div className="enums-list-toolbar" key="toolbar" >
        <div>
          {/* <ButtonGroup>
            <Button color="falcon-primary" onClick={cycleField}>
              {state.sort.field}
            </Button>
            <Button color="falcon-primary" onClick={toggleOrder}>
              {renderOrderIcon()}
            </Button>
          </ButtonGroup> */}
        </div>
        <div className="clearfix" style={{display:'flex',  width:'100%' , paddingRight:'2px'}}>
          <Input
            className="float-left enums-list-search mr-3"
            autoFocus
            onChange={updateFilter}
            placeholder={"Search "}
            type="search"
            value={state.filterText}
            style={{width: '100%'}}
          />
          <Button
            color="falcon-primary"
            onClick={toggleModalState}
            onMouseEnter={() => showTooltip("create")}
            onMouseLeave={() => hideTooltip("create")}
          >
            {tooltipState["create"] ? <span>Add New </span> : ""}{" "}
            <FontAwesomeIcon icon={faPlus} />
         
          </Button>
        </div>
      </div>
    );
  };

  const renderEmpty = () => {
    return (
      <div className="empty-state">
        No data available.
      </div>
    );
  };
 

    // Shows delete tooltip
    const showTooltip = (field) => {
      timeoutIDs.current.push(
        setTimeout(() => {
        setTooltipState({
           ...tooltipState,
            field :true,
          });
        }, 150)
      );
    };
  
    // Hides delete tooltip
    const hideTooltip = (field) => {
      // timeoutIDs.current.forEach((id) => {
      //   clearTimeout(id);
      // });
      // timeoutIDs.current = [];
      // dispatch({
      //   type: "HIDE_TOOLTIP",
      //   field,
      // });
    };

  const handleEditClick = (rowObj) => toggleModalState("editModalState", true, rowObj);
  const handleDeleteClick = (rowObj) =>  { 

  };
  const handleMouseEnter = (id) => showTooltip(id);
  const handleMouseLeave = (id) => hideTooltip(id);

  const createRowElement = (rowObj) => {
    return (
      <div
        className="enums-list-enum"
        key={rowObj.column_id}
        title={rowObj.column_name}
      >
        <div className="enums-list-enum-name">
          <div className="enums-list-enum-name-text">
            {getModifiedTitle(rowObj)}
            {/* <Badge>{rowObj.param_key}</Badge> */}
          </div>
          <div className="enums-list-enum-name-creation">
            {/* <Badge>{ rowObj.httpHandler}</Badge> */}
            <Badge>{ rowObj.endpoint}</Badge>
          </div>
        </div>
     <div className="enums-list-enum-action">
          <Button
            color="falcon-danger"
            onClick={() => handleEditClick(rowObj)}
            onMouseEnter={() => handleMouseEnter(rowObj.id)}
            onMouseLeave={() => handleMouseLeave(rowObj.id)}
          >
            {tooltipState[rowObj.id] ? <span>Edit </span> : ""}{" "}
            <FontAwesomeIcon icon={faEdit} />
          </Button>{" "}
          &nbsp;
          <Button
            color="falcon-danger"
            onClick={() => handleDeleteClick(rowObj)}
            onMouseEnter={() => handleMouseEnter(rowObj.id)}
            onMouseLeave={() => handleMouseLeave(rowObj.id)}
          >
            {tooltipState[rowObj.id] ? <span>Delete</span> : ""}{" "}
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>  
      </div>
    );
  };

  const renderList = () => {
 
    const tableData = [
      { id: 1, name: 'Element 1', column_id: 'col1', param_key: 'key1', created_at: 1622548800, column_name: 'Column Name 1', label: 'Label 1', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 2, name: 'Element 2', column_id: 'col2', param_key: 'key2', created_at: 1622635200, column_name: 'Column Name 2', label: 'Label 2', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 3, name: 'Element 3', column_id: 'col3', param_key: 'key3', created_at: 1622721600, column_name: 'Column Name 3', label: 'Label 3', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 4, name: 'Element 4', column_id: 'col4', param_key: 'key4', created_at: 1622808000, column_name: 'Column Name 4', label: 'Label 4', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 5, name: 'Element 5', column_id: 'col5', param_key: 'key5', created_at: 1622894400, column_name: 'Column Name 5', label: 'Label 5', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 6, name: 'Element 6', column_id: 'col6', param_key: 'key6', created_at: 1622980800, column_name: 'Column Name 6', label: 'Label 6', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 3, name: 'Element 3', column_id: 'col3', param_key: 'key3', created_at: 1622721600, column_name: 'Column Name 3', label: 'Label 3', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 4, name: 'Element 4', column_id: 'col4', param_key: 'key4', created_at: 1622808000, column_name: 'Column Name 4', label: 'Label 4', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 5, name: 'Element 5', column_id: 'col5', param_key: 'key5', created_at: 1622894400, column_name: 'Column Name 5', label: 'Label 5', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
      { id: 6, name: 'Element 6', column_id: 'col6', param_key: 'key6', created_at: 1622980800, column_name: 'Column Name 6', label: 'Label 6', endpoint: '/film/some_endpoint' , httpHandler: 'https://api.slack.com/messaging/webhooks'  },
    
    
    ];
    let sessionKeyValuesBody = [];
    sessionKeyValuesBody.push(renderToolbar());
    const sessionKeyValuesElemList = [];
    if (tableData && tableData.length) { 
      tableData.forEach((item) => {
        sessionKeyValuesElemList.push(createRowElement(item));
      });
      sessionKeyValuesBody.push(
        <div key="saved">
          {sessionKeyValuesElemList}
        </div>
      );
    } else {
      sessionKeyValuesBody.push(renderEmpty());
    }
    return sessionKeyValuesBody;
  };

  if (false) {
    return (
      <Card style={{ width: props.width }}>
        <div className='loading-div'>
          <Spinner
            className='loading-spinner'
            color="primary"
            type="grow"
          />
        </div>
      </Card>
    )
  } else {
    return (

      <div>
      <Helmet>
        <title>Webhooks | QueryDeck</title>
      </Helmet>
      <Header mode="api" section="Webhooks" subdomain={props.subdomain} />
      <div className="list-deck">
        <Menu appid={props.subdomain} />
        <Card className="list-card-main"> 
  
        <CreateWebhook  toggleModalState={toggleModalState} modalState={modalState}/>
        
        <div className='api-saved-list'>
          {renderList()}
        </div>
      </Card>

      
      </div>
    </div>
  
    )
  }
}

const getModifiedTitle = (rowObj) => {
  if (rowObj.httpHandler) return rowObj.httpHandler;
  if (rowObj.label) return rowObj.label;
  let title = rowObj.column_name?.slice(0, 40) || "";

  return title;
};



export default Webhook
