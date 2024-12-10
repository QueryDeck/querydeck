const qraphQLReducer = (state, action) => {
  switch (action.type) {
    // Initiates loading
    case "START_LOADING":
      return {
        ...state,
        loading: true,
      };


    // Set Database
    case "SET_DATABASE":
      return {
        ...state,
        loading: false,
        database: action.database
      };



    // Set tables options   
    case "SET_TABLE":

      let tableOptions = [];
      let tablesHash = {};
      action.tables.forEach((element) => {
        // Adds tables to the hashed array of schemas
        if (tablesHash[element.text.split(".")[0]]) {
          let schema = tablesHash[element.text.split(".")[0]];
          schema.push({
            tableName: element.text,
            value: element.id,
            id: element.id,
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
              id: element.id,
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

      return {
        ...state,
        loading: false,
        tableOptions,
      };



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
      throw new Error(`Unknown action type in qraphQLReducer: ${action.type}`);
  }
};

export default qraphQLReducer;
