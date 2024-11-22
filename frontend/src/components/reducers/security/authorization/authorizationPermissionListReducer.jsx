const authorizationPermissionListReducer = (state, action) => {
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

    // update roles data
    case "UPDATE_ROLES":
     
      return {
        ...state,
        ...action.authParentState,
        tableData: action.authParentState.rolesData,
        roleList: action.authParentState.rolesData,
        loading: false,
      };

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
        tableData: state.tableData.reverse(),
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

      action.data.type_map.forEach((dataType) => {
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
        `Unknown action type in authorizationPermissionReducer: ${action.type}`
      );
  }
};

export default authorizationPermissionListReducer;
