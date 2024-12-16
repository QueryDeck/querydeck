// React imports
import React, { useEffect, useReducer } from "react";
import { Helmet } from "react-helmet";
// Library imports
// Redux
import { useHistory } from 'react-router-dom';
import { useDispatch } from "react-redux";
import qraphQLReducer from "../../reducers/graphQL/qraphQLReducer";
import {
  Card,
  CardBody,
  // CardHeader,

  Spinner,
} from "reactstrap";
import api from "../../../api";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import Header from '../../../app/projects/[subdomain]/components/sections/engine/header';

// Components
import Menu from "../menu/Menu";
import SetupGraphQL from "./SetupGraphQL";




let getDatabasesController;
let getTablesController;







const QraphQL = ({ appid: subdomain }) => {
  // Redux
  const reduxDispatch = useDispatch();

  // For 403 errors on unauthorised users
  const history = useHistory();
  const initialState = {
    loading: true,

    database: null,
    tableOptions: null,
    setupGraphQLModalState: false,

  };
  const [state, dispatch] = useReducer(qraphQLReducer, initialState);




  useEffect(() => {
    getDatabasesController = new AbortController();
    getTablesController = new AbortController();

    getDatabases()

    return () => {
      getDatabasesController.abort();
      getTablesController.abort();


    };
    // eslint-disable-next-line
  }, []);




  ///// Network requests /////
  const catchError = (error) => {
    if (error.response) {
      if (error.response.data.meta.status === 403) {
        Cookies.remove("session");
        toast.warning(`Please login again`);
        reduxDispatch({ type: "RESET" });
        history.push(`/auth/login?redirect=/apps/${subdomain}/graphql`);
      } else if (error.response.data.meta.status === 400) {
        toast.error("Error 400 | Bad Request");
      } else if (error.response.data.meta.status === 404) {
        toast.error("Error 404 | Not Found");
      } else if (error.response.data.meta.status === 500) {
        toast.error("Error 500 | Internal Server Error");
      } else {
        toast.error("Something went wrong");
      }
    } else {
      console.error(error);
    }
  };
  const updateAttribute = (field, value) => {
    dispatch({
      type: "UPDATE_ATTRIBUTE",
      field: field,
      value: value,
    });
  };


  const openSetupGraphQLModal = () => {
    updateAttribute('setupGraphQLModalState', true)
    getTables()
  };
  const closeSetupGraphQLModal = () => {
    updateAttribute('setupGraphQLModalState', false)
  };



  const handleSetupGraphQLModalClick = () => {

    closeSetupGraphQLModal()
    updateAttribute('loading', true)
  };


  // Databases List
  const getDatabases = async () => {
    try {
      const response = await api.get('/databases', {
        params: {
          subdomain: subdomain
        },
        signal: getDatabasesController.signal
      })
      const data = response.data.data
      const database = {
        name: data.databases[0].name,
        db_id: data.databases[0].db_id
      }

      dispatch({
        type: "SET_DATABASE",
        database,
      });


    } catch (error) {
      catchError(error)
    }
  }


  // Fetches a list of  table
  const getTables = async () => {
    try {
      updateAttribute("loading", true);
      const response = await api.get("/apps/editor/controllers/ops", {
        params: {
          subdomain: subdomain,
          db_id: state.database.db_id,
        },
        signal: getTablesController.signal,
      });
      // setTableOptions(response.data.data )

      dispatch({
        type: "SET_TABLE",
        tables: response.data.data.tables,
        //  tables: response.data.data.tables,
      });

    } catch (error) {
      catchError(error);
    }
  };

  const renderData = () => {

    if (state.loading) {
      return (<div className="loading-div">
        <Spinner
          className="loading-spinner"
          color="primary"
          type="grow"
        />
      </div>)
    }
    else if (state.database) {
      return (



        <CardBody style={{ paddingTop: 0 }}>
          <SetupGraphQL subdomain={subdomain} db_id={state.database.db_id} tableOptions={state.tableOptions}
            openSetupGraphQLModal={openSetupGraphQLModal}
            closeSetupGraphQLModal={closeSetupGraphQLModal}
            setupGraphQLModalState={state.setupGraphQLModalState}
            handleSetupGraphQLModalClick={handleSetupGraphQLModalClick}
          />
        </CardBody>




      );
    }


  }
  return (
    <div>
      <Helmet>
        <title>QraphQL | QueryDeck</title>
      </Helmet>
      <Header
        mode='api'
        section='GraphQL'
        subdomain={subdomain}
      />
      <div className="list-deck">
        <Menu appid={subdomain} />
        <Card className="list-card-main">
          {renderData()}
        </Card>
      </div>
    </div>
  );

};

export default QraphQL;
