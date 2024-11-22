
const authorizationRoleReducer = (state, action) => {
  switch (action.type) {
    // Toggles modal
    case "TOGGLE_MODAL":
      if (action.selectedRow) {
        return {
          ...state,
          [action.field]: action.value,
          selectedRow: action.selectedRow,
        };
      } else {
        return {
          ...state,
          [action.field]: action.value,
        };
      }
    // Initiates loading
    case "START_LOADING":
      return {
        ...state,
        loading: true,
      };

    // Update selected  role
    case "UPDATE_SELECTED_ROLE":
      return {
        ...state,
        selectedRole: action.selectedRole,
        authDetails: action.authDetails,
      };

    // Update selected  cell
    case "SET_SELECTED_PERMISSION":
      return {
        ...state,
        filterFields: null, // reset table columns 
        joinGraphs: null, // reset exist columns 
        selectedPermisson: action.selectedPermisson,
      };

    case "SET_FILTER_FIELDS": {
      const  appAuth  = action.payload.appAuth; 
      Object.keys( appAuth).forEach((key)=>{ 
         if(appAuth[key].isAuthColumn ){ 
           let currColumn = action.payload.data.columns.find(item=> item.columnID === key)
           if(currColumn){ 
            currColumn.session_key = key
           }
         }
      })
      return {
        ...state,
        filterFields: [{
          label: action.payload.data.table,
          options: action.payload.data.columns
        }] ,
      };

 
    }

    // Shows delete tooltip
    case "SHOW_TOOLTIP":
      return {
        ...state,
        tooltips: {
          ...state.tooltips,
          [action.field]: true,
        },
      };
    // Hides delete tooltip
    case "HIDE_TOOLTIP":
      return {
        ...state,
        tooltips: {
          ...state.tooltips,
          [action.field]: false,
        },
      };
    // Cycles sorting field
    case "CYCLE_FIELD":
      return {
        ...state,
        tableData: action.tableData,
        sorting: {
          ...state.sorting,
          field: action.field,
        },
      };
    // Toggles sorting order
    case "TOGGLE_ORDER":
      return {
        ...state,
        roles: action.data.roles,
      };

    // Updates table options
    case "UPDATE_TABLE_OPTIONS":
      let tableOptions = [];
      let tablesHash = {};
      action.data.tables.forEach((element) => {
        // Adds tables to the hashed array of schemas
        if (tablesHash[element.text.split(".")[0]]) {
          let schema = tablesHash[element.text.split(".")[0]];
          schema.push({
            tableName: element.text,
            value: element.id,
            label: element.text
              .split(".")
              .splice(1, element.text.split(".").length - 1)
              .join(""),
          });
          tablesHash[element.text.split(".")[0]] = schema;
          // Creates a new hashed array for a schema, to populate it with tables
        } else {
          tablesHash[element.text.split(".")[0]] = [
            {
              tableName: element.text,
              value: element.id,
              label: element.text
                .split(".")
                .splice(1, element.text.split(".").length - 1)
                .join(""),
            },
          ];
        }
      });
      // Pushes schemas with their tables into separate categories
      const schemas = Object.keys(tablesHash);
      schemas.forEach((element) => {
        tableOptions.push({
          label: element,
          options: tablesHash[element],
        });
      });

      // create merged types
      const dataTypeList = [];
      const parentReference = {};

    action.data.types?.forEach &&  action.data.types.forEach((dataType) => { // TODO:crashing..
        const datatypeObject = {
          label: dataType.name,
          options: [],
        };

        dataType.types.forEach((element) => {
          parentReference[element] = dataType.name;
          datatypeObject.options.push({
            value: element,
            label: element,
          });
        });
        dataTypeList.push(datatypeObject);
      });
      return {
        ...state,

        loading: false,
        operators: action.data.types,
        tableOptions,
      };
    // Updates selected table

    // Updates a single field
    case "SINGLE":
      return {
        ...state,
        [action.field]: action.payload,
      };

    case "UPDATE_ATTRIBUTE":
      return {
        ...state,
        [action.field]: action.value,
      };

    default:
      throw new Error(
        `Unknown action type in authorizationRoleReducer: ${action.type}`
      );
  }
};

export default authorizationRoleReducer;
