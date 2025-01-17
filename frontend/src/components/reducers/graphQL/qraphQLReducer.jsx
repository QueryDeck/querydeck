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
        database: action.database,
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

    // Set selected table
    case "SET_SELECTED_TABLE":
      return {
        ...state,
        details: {
          ...state.details,
          selectedTable: action.selectedTable,
        },
      };

    // Set selected table
    case "SET_GQL_TABLE":
      const sortedTablesLocal = action.data.tables.sort((a, b) => a.table_name.localeCompare(b.table_name));
      return {
        ...state,
        loading: false,
        details: {
          ...state.details,
          tableData: sortedTablesLocal,
          tableDataFiltered: sortedTablesLocal,
          enabled: action.data.enabled,
          initial: action.data.initial,
          sort: {
            order: true, // true = ascending, false = descending
          }
        },
      };

    case "FILTER_TABLES":
      const searchTerm = action.search.toLowerCase();
      const filteredTables = state.details.tableData.filter(item =>
        item.table_name.toLowerCase().includes(searchTerm)
      );
      const sortedFilteredTables = filteredTables.sort((a, b) => {
        const comparison = a.table_name.localeCompare(b.table_name);
        return state.details.sort.order ? comparison : -comparison;
      });
      return {
        ...state,
        details: {
          ...state.details,
          tableDataFiltered: sortedFilteredTables
        }
      };

    case "SORT_TABLES":
      const newOrder = !state.details.sort.order;
      const sortedTables = [...state.details.tableDataFiltered].sort((a, b) => {
        const comparison = a.table_name.localeCompare(b.table_name);
        return newOrder ? comparison : -comparison;
      });
      return {
        ...state,
        details: {
          ...state.details,
          tableDataFiltered: sortedTables,
          sort: {
            ...state.details.sort,
            order: newOrder
          }
        }
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
