const createModalReducer = (state, action) => {
  switch (action.type) {
    // Clears data (for closing modal)
    case "CLEAR_DATA":
      return {
        ...state,
     
        paramKey: "",
        tableOptions: [],
        tableSelected: null,
        loading: false,
      };

  
    // fill all selected data in  input fields
    case "FILL_SELECTED_DATA":
      return {
        ...state,
        paramKey: action.selectedRow.param_key,
        tableSelected: {
          tableName: action.selectedRow?.column_name.split(".")[1],
          value: action.selectedRow.column_id.split(".").shift(),
          label: action.selectedRow?.column_name
            .split(".")
            .splice(0, 2)
            .join("."),
        },
        columnSelected: {
          label: action.selectedRow?.column_name.split(".").pop(),
          value: action.selectedRow.column_id,
        },
      };

    // Updates custom field name
    case "UPDATE_ATTRIBUTE":
      return {
        ...state,
        [action.field]: action.value,
      };

 
    // Updates table options
    case "UPDATE_TABLE_OPTIONS":
      let tableOptions = [];
      let tablesHash = {};
      action.value.tables.forEach((element) => {
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

      action.value.types?.forEach &&   action.value.types.forEach((dataType) => { // TODO:crashing..
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
        dataTypeList,
        parentReference,
        loading: false,
        tableOptions,
      };
    // Updates selected table
    case "UPDATE_TABLE_SELECTED":
      return {
        ...state,
        columnSelected: null,
        tableSelected: action.value,
      };

    case "UPDATE_NODES":
      const nodesHash = state.nodesHash;
      const columnsList = [];


      action.value.nodes.forEach((element) => {
        columnsList.push({
          value: element.id,
          label: element.text,
        });
      });

      nodesHash[action.value.tableId] = action.value.nodes;
      return {
        ...state,
        nodesHash,
        columnsList,
        loading: false,
      };

    
    default:
      throw new Error(
        `Unknown action type in createModalReducer: ${action.type}`
      );
  }
};

export default createModalReducer;
