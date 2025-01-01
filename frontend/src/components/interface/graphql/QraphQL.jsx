// React imports
import React, { useEffect, useReducer, useMemo } from "react";
import { Helmet } from "react-helmet";
// Library imports
// Redux
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import qraphQLReducer from "../../reducers/graphQL/qraphQLReducer";
import {
  Card,
  // CardHeader,
  Spinner,
} from "reactstrap";

import Cookies from "js-cookie";
import { toast } from "react-toastify";
import Header from "../../../app/projects/[subdomain]/components/sections/engine/header";

// Components
import Menu from "../menu/Menu";
import SetupGraphQL from "./SetupGraphQL";
// import GraphQLQuery from "./GraphQLQuery";
import Details from "./detail/Details";

import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

import api, { apiBase } from "../../../api";

let getDatabasesController;
let getTablesController;
let getGraphQLTablesController;

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
    step: 3,
    details: {
      selectedTable: "",
    },
  };
  const [state, dispatch] = useReducer(qraphQLReducer, initialState);
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: `${
          apiBase === "localhost:3000" ? "http" : "https"
        }://${subdomain}.${apiBase}/graphql`, // 'http://hidden-darkness-8.localhost:3000/graphql',
        cache: new InMemoryCache(),
        credentials: "include",
      }),
    [subdomain]
  );

  useEffect(() => {
    getDatabasesController = new AbortController();
    getTablesController = new AbortController();
    getGraphQLTablesController = new AbortController();

    getDatabases();
    getGraphQLTables();
    return () => {
      getDatabasesController.abort();
      getTablesController.abort();
      getGraphQLTablesController.abort();
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
    // console.log( 'clicked')
    updateAttribute("setupGraphQLModalState", true);
    getTables();
  };
  const closeSetupGraphQLModal = () => {
    updateAttribute("setupGraphQLModalState", false);
  };

  const handleSelectedTable = (selectedTable) => {
    dispatch({
      type: "SET_SELECTED_TABLE",
      selectedTable,
    });
  };

  const handleSetupGraphQLModalClick = () => {
    closeSetupGraphQLModal();
    updateAttribute("loading", true);
  };

  // Databases List
  const getDatabases = async () => {
    try {
      const response = await api.get("/databases", {
        params: {
          subdomain: subdomain,
        },
        signal: getDatabasesController.signal,
      });
      const data = response.data.data;
      const database = {
        name: data.databases[0].name,
        db_id: data.databases[0].db_id,
      };

      dispatch({
        type: "SET_DATABASE",
        database,
      });
    } catch (error) {
      catchError(error);
    }
  };

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

  // Fetches a list of  graphql  table
  const getGraphQLTables = async () => {
    try {
      updateAttribute("loading", true);
      const response = await api.get("apps/editor/controllers/graphql/tables", {
        params: {
          subdomain: subdomain,
        },
        signal: getGraphQLTablesController.signal,
      });
      // setTableOptions(response.data.data )
      dispatch({
        type: "SET_GQL_TABLE",
        tableData: response.data.data,
        //  tables: response.data.data.tables,
      });
    } catch (error) {
      catchError(error);
    }
  };
  const renderData = () => {
    if (state.loading) {
      return (
        <div className="loading-div">
          <Spinner className="loading-spinner" color="primary" type="grow" />
        </div>
      );
    } else if (state.database) {
      return (
        <>
          <Details
            handleSelectedTable={handleSelectedTable}
            details={state.details}
            openSetupGraphQLModal={openSetupGraphQLModal}
          />

          <SetupGraphQL
            subdomain={subdomain}
            db_id={state.database.db_id}
            tableOptions={state.tableOptions}
            openSetupGraphQLModal={openSetupGraphQLModal}
            closeSetupGraphQLModal={closeSetupGraphQLModal}
            setupGraphQLModalState={state.setupGraphQLModalState}
            handleSetupGraphQLModalClick={handleSetupGraphQLModalClick}
          />
        </>
      );
    }
  };
  return (
    <ApolloProvider client={client}>
      <div>
        <Helmet>
          <title>QraphQL | QueryDeck</title>
        </Helmet>
        <Header mode="api" section="GraphQL" subdomain={subdomain} />
        <div className="list-deck">
          <Menu appid={subdomain} />
          <Card className="list-card-main">{renderData()}</Card>
        </div>
      </div>
    </ApolloProvider>
  );
};

export default QraphQL;
