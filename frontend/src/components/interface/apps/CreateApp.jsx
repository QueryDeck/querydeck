// React imports
import React, { useEffect, useReducer } from "react";
import { Helmet } from "react-helmet";
import { useHistory } from "react-router-dom";

// Redux
import { useDispatch } from "react-redux";

// Reducers
import createAppReducer from "../../reducers/apps/createAppReducer";

// Library imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCopy,
  faLock,
  faPlus,
  faSitemap,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  FormGroup,
  FormFeedback,
  Input,
  Label,
  UncontrolledTooltip,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import { toast } from "react-toastify";

// Image imports
// import mysql_logo from '../logos/mysql_logo'
// import pg_logo from '../logos/pg_logo'

// Components
// import currentTime from '../../../currentTime'

// API
import api from "../../../api";

// Abort controller for cancelling network requests
let createAppController;

// Create app at '/apps/new'
const CreateApp = () => {
  // Redux
  const reduxDispatch = useDispatch();
  // const [tab, setTab] = useState("db-schema");

  // For 403 errors on unauthorised users
  const history = useHistory();

  // Initial state
  const initialState = {
    connectionString: "",
    db_engine: 'PostgreSQL',
    name: {
      label: "App Name",
    },
    dbHost: {
      label: "Database Host",
    },
    dbUsername: {
      label: "Database Username",
    },
    dbPassword: {
      label: "Database Password",
    },
    dbPort: {
      label: "Database Port",
    },
    dbName: {
      label: "Database Name",
    },
    buttonLoading: false,
    acknowledgement: false,
    manualIntrospectionRows: {
      label: "Database Schema Rows",
      value: "",
      check: false,
    },
    tab: "db-detail",
  };

  const fields = Object.keys(initialState).slice(
    2,
    Object.keys(initialState).length - 4
  );
  // Adding checks and values to initial state
  fields.forEach((field) => {
    switch (field) {
      case 'name':
          initialState[field].value = 'Untitled'
          break
      case "dbPort":
        initialState[field].value = "80";
        break;
      default:
        initialState[field].value = "";
        break;
    }
    initialState[field].check = false;
  });

  const [state, dispatch] = useReducer(createAppReducer, initialState);

  useEffect(() => {
    createAppController = new AbortController();

    return () => {
      createAppController.abort();
    };
  }, []);

  // Updates db type
  // const updateDB = value => {
  //     dispatch({
  //         type: 'DB',
  //         db_engine: value
  //     })
  // }

  // Updates field value
  const updateField = (field, event) => {
    dispatch({
      type: "VALUE",
      field: field,
      value: event.target.value,
    });
  };

  // Updates connection string
  const updateConnectionString = (event) => {
    dispatch({
      type: "UPDATE_CONNECTION_STRING",
      connectionString: event.target.value.replace(/^\s+|\s+$/g, ""),
    });
  };

  // Checks empty field and alerts user
  const checkField = (field) => {
    dispatch({
      type: "CHECK",
      field: field,
      check: true,
    });
  };

  // Resets app state to default
  const resetData = () => {
    dispatch({
      type: "RESET",
      // appName: `app_${currentTime()}`
    });
  };

  // Checks empty fields and returns boolean
  const checkValues = () => {
    let flag = true;
    fields.forEach((field) => {
      if (!(state[field].value && state.db_engine)) {
        flag = false;
      }
    });
    if (!state.acknowledgement) {
      return false;
    }
    return flag;
  };

  // Checks format and  field of schema rows
  const checkSchemaValues = () => {
    let flag = true;
    let message = "";
    if (
      !state.manualIntrospectionRows.value ||
      !state.manualIntrospectionRows.value.length
    ) {
      flag = false;
      message = "Must have JSON input";
    }

    try {
      const parsedData = JSON.parse(state.manualIntrospectionRows.value);
      const requiredFields = [
        "nspname",
        "relname",
        "attrelid",
        "oid",
        "number",
        "name",
        "attnum",
        "notnull",
        "type",
        "primarykey",
        "uniquekey",
        "uindex",
        "foreignkey",
        "foreignkey_fieldnum",
        "foreignkey_fieldname",
        "foreignkey_schema",
        "foreignkey_connnum",
        "default",
      ];
      parsedData.forEach((item) => {
        let missingFields = [];
        let itemKeys = Object.keys(item);
        requiredFields.forEach((key) => {
          if (!itemKeys.includes(key)) {
            missingFields.push(key);
          }
        });
        if (missingFields.length) {
          flag = false;
          message = "Missing fields : " + missingFields.join(", ");
        }
      });
    } catch (error) {
      flag = false;
      message = "Invalid format of  JSON data";
    }

    if (!flag && state.manualIntrospectionRows.value.length) {
      toast.error(message);
    }
    return { isValid: flag, reason: message };
  };
  const changeTab = (newTab) => {
    dispatch({
      type: "SWITCH_TAB",
      tab: newTab,
    });
  };
  // Toggles acknowledgement
  const toggleAcknowledgement = () => {
    dispatch({
      type: "TOGGLE_ACKNOWLEDGEMENT",
    });
  };

  // Renders database input  connect string
  const renderDatabaseConnString = () => {
    return (
      <>
        <Label className="list-card-label">
          Connection String:
          <Input
            onChange={updateConnectionString}
            placeholder="Database connection string (optional)"
            value={state.connectionString}
          />
        </Label>
        <div
          className="create-separator-container"
          style={{
            margin: "0 auto",
            width: "250px",
          }}
        >
          <div className="create-separator-item" />
          <h5 className="create-or">OR</h5>
          <div className="create-separator-item" />
        </div>
      </>
    );
  };
  // Renders input fields as a form for app details
  const renderFields = () => {
    // DB Type Selector
    const formFields = [];
    for (let index = 1; index < fields.length; index++) {
      let inputType;
      const field = fields[index];
      const label = state[fields[index]].label;
      // Sets field type depending on the field
      switch (field) {
        case "dbPassword":
          inputType = "password";
          break;
        case "dbPort":
          inputType = "number";
          break;
        default:
          inputType = "text";
          break;
      }
      formFields.push(
        <FormGroup data-testid={field} key={field}>
          <Label style={{ width: "100%" }}>
            {label}:
            <Input
              invalid={!state[field].value && state[field].check}
              onBlur={() => checkField(field)}
              onChange={(event) => updateField(field, event)}
              placeholder={`Enter ${label}`}
              maxLength={field === "name" ? 20 : 128}
              required="required"
              type={inputType}
              value={state[field].value}
            />
            <FormFeedback>{label} is required</FormFeedback>
          </Label>
        </FormGroup>
      );
    }
    return (
      <>
        <Form>{formFields}</Form>
      </>
    );
  };


  const copyIP = () => {
    navigator.clipboard
      .writeText('52.76.5.239')
      .then(() => {
        toast.success("IP copied!");
      })
      .catch((err) => {
        console.error(err);
      });
  };

  // Renders a list of db engines
  const renderEngines = () => (
    <>
      <Label style={{ width: "100%" }}>
        App Name:
        <Input
          invalid={!state.name.value && state.name.check}
          onBlur={() => checkField("name")}
          onChange={(event) => updateField("name", event)}
          placeholder={`Enter App Name`}
          maxLength={20}
          required="required"
          type="text"
          value={state.name.value}
        />
        <FormFeedback>App Name is required</FormFeedback>
      </Label>
    </>
  );

  // Renders acknowledgement
  const renderAcknowledgement = () => (
    <div style={{ display: "flex" }}>
      <Label style={{ display: "flex" }}>
        <Input
          checked={state.acknowledgement}
          onChange={(event) => toggleAcknowledgement(event.target.checked)}
          style={{
            margin: "unset",
            position: "unset",
          }}
          type="checkbox"
        />
        &nbsp;
        <span>
          I have allowed connections to my database from QueryDeck's IP address:{" "}
          {window.location.hostname === "app.querydeck.io"
            ? "18.217.221.232"
            : "52.76.5.239"}
        </span>
        &nbsp;
      </Label>
      <UncontrolledTooltip target="copy">Copy</UncontrolledTooltip>
      <span
        className="cursor-pointer"
        id="copy"
        onClick={copyIP}
        style={{ fontSize: ".8333333333rem" }}
      >
        <FontAwesomeIcon icon={faCopy} />
      </span>
    </div>
  );

  // Renders combined data
  const renderTabs = () => {
    return (
      <div className="create-form">
        {renderEngines()}
        <Alert
          color='success'
          onClick={() => window.location.href()}
          style={{
            fontSize: 14,
            margin: '6px 0',
            padding: 6,
            textAlign: 'center'
          }}
        >
          <FontAwesomeIcon icon={faLock} /> We take data security seriously and your data is safely encrypted.
        </Alert>
        <div className="create-separator-container">
          <div className="create-separator-item" />
          <h4 className="create-or">Database&nbsp;Details</h4>
          <div className="create-separator-item" />
        </div>
        
        <Alert
          color='primary'
          onClick={() => window.location.href()}
          style={{
            fontSize: 14,
            margin: '6px 0',
            padding: 6,
            textAlign: 'center'
          }}
        >
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://docs.querydeck.io/docs/getting-started/get-started-with-querydeck/quickstart-with-querydeck"
            style={{
              fontSize: 14,
              margin: 0,
              padding: 6,
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            Click to learn more on how to get started with QueryDeck.
          </a>
        </Alert>
        <br />
        <Nav tabs>
          <NavItem className="query-right-nav cursor-pointer">
            <NavLink
              className={state.tab !== "db-detail" ? "active" : ""}
              onClick={() =>
                state.tab !== "db-detail" ? changeTab("db-detail") : ""
              }
            >
              Connection Details <FontAwesomeIcon icon={faInfoCircle} />
            </NavLink>
          </NavItem>

          <NavItem className="query-right-nav cursor-pointer" id="query">
            <NavLink
              className={state.tab !== "db-schema" ? "active" : ""}
              onClick={() =>
                state.tab !== "db-schema" ? changeTab("db-schema") : ""
              }
            >
              Schema Details <FontAwesomeIcon icon={faSitemap} />
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent style={{ padding: "0px 2px" }} activeTab={state.tab}>
          <TabPane tabId="db-detail">{renderConnDetailsTab()}</TabPane>
          <TabPane tabId="db-schema">
            {renderDatabaseSchemaDetailsTab()}
          </TabPane>
        </TabContent>
      </div>
    );
  };

  // Renders Tab 1
  const renderConnDetailsTab = () => {
    return (
      <>
        <br />
        {renderDatabaseConnString()}
        {renderFields()}
        {renderAcknowledgement()}
        <div className="create-actions">
          <div>
            <Button block color="falcon-danger" onClick={resetData} size="lg">
              Reset &nbsp;
              <FontAwesomeIcon icon={faBan} />
            </Button>
          </div>
          <div>
            <Button
              block
              color="falcon-success"
              disabled={!checkValues() || state.buttonLoading}
              onClick={() => createApp(false)}
              size="lg"
            >
              Create App &nbsp;
              <FontAwesomeIcon icon={faPlus} />
            </Button>
          </div>
          <div>
            <Button
              block
              color="falcon-primary"
              disabled={state.buttonLoading}
              onClick={() => createApp(true)}
              size="lg"
            >
              Demo App &nbsp;
              <FontAwesomeIcon icon={faPlus} />
            </Button>
          </div>
        </div>
      </>
    );
  };

  // Renders Tab 2
  const renderDatabaseSchemaDetailsTab = () => {
    return (
      <>
        <br />

        <FormGroup data-testid={"field"} key={"field"}>
          <Label style={{ width: "100%", marginTop: "10px" }}>
            Schema Details
            <Input
              className="list-card-textarea"
              placeholder={`Enter Schema Details`}
              type="textarea"
              rows="14"
              //   onChange={secretHandler}
              //   value={secret}
              name="manualIntrospectionRows"
              // invalid={true}
              // invalid={!state.manualIntrospectionRows.value && state.manualIntrospectionRows.check}

              onBlur={() => checkSchemaValues()}
              onChange={(event) =>
                updateField("manualIntrospectionRows", event)
              }
              // maxLength={field === "name" ? 20 : 128}
              required="required"
              value={state.manualIntrospectionRows.value}
            />
            <FormFeedback>Schema Details is required</FormFeedback>
          </Label>
        </FormGroup>

        <div className="create-actions">
          <div>
            <Button
              block
              color="falcon-success"
              disabled={
                !state.manualIntrospectionRows.value || state.buttonLoading
              }
              onClick={() => createApp(false)}
              size="lg"
            >
              Create App &nbsp;
              <FontAwesomeIcon icon={faPlus} />
            </Button>
          </div>
        </div>
      </>
    );
  };

  // Adds app to apps list
  const createApp = (demo) => {
    // dispatch({
    //   type: "BUTTON_LOADING_START",
    // });
    // Checks empty fields
    let flag = true;
    let newApp = {};
    if (demo) {
      newApp = {
        use_demo_db: true,
      };
    } else if (state.tab === "db-schema") {
      if (!checkSchemaValues().isValid) {
        return;
      }
      newApp.manual_introspection = true;
      newApp.manual_introspection_rows = JSON.parse(
        state.manualIntrospectionRows.value
      );
      newApp.name = state.name.value;
    } else {
      fields.forEach((field) => {
        if (state[field].value.length) {
          newApp[field.toLowerCase()] = state[field].value;
        } else {
          flag = false;
        }
      });
      newApp.name = state.name.value ? state.name.value : state.dbName.value
      // newApp.name = 'untitled app'
      if (state.db_engine) {
        newApp["db_type"] = state.db_engine;
      } else {
        flag = false;
      }
      console.log("Database Details");
      console.table(newApp);
    }

    if (flag) {
      api
        .post("/apps", newApp, {
          signal: createAppController.signal,
        })
        .then((res) => {
          dispatch({
            type: "BUTTON_LOADING_STOP",
          });
          console.log("App Details");
          console.table(res.data.data);
          toast.success(`${demo ? "A" : "Demo a"}pp Added Successfully!`);
          history.replace(
            `/apps/${res.data.data.subdomain}/api/new`
          );
        })
        .catch((err) => {
          console.error("Unable to create a new app", err);
          dispatch({
            type: "BUTTON_LOADING_STOP",
          });
          toast.warning(`Error! Please check the fields and try again.`);
          if (err.response) {
            if (err.response.status === 403) {
              Cookies.remove("session");
              toast.warning(`Please login again`);
              reduxDispatch({ type: "RESET" });
              history.push("/auth/login?redirect=/apps/new");
            } else if (err.response.status === 400) {
              toast.error("Error 400 | Bad Request");
            } else if (err.response.status === 404) {
              toast.error("Error 404 | Not Found");
            } else if (err.response.status === 500) {
              toast.error("Error 500 | Internal Server Error");
            }
          }
        });
    } else {
      toast.warn("Please fill up the empty fields and try again!");
      console.warn("Form fields empty");
    }
  };

  const renderData = () => {
    return (
      <Card className="list-card">
        <div className="apps-list">
          <CardHeader>
            <h2 className="apps-heading">New App</h2>
          </CardHeader>
          <CardBody>{renderTabs()}</CardBody>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <Helmet>
        <title>New | Apps | QueryDeck</title>
      </Helmet>
      {renderData()}
    </div>
  );
};

export default CreateApp;
