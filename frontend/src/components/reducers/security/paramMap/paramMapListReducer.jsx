const paramMapListReducer = (state, action) => {
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
    // Sets param map 
    case "SET_PARAM_MAP":
      const sessionKeyValueslist =  action.sessionKeyValueslist;
      sessionKeyValueslist.sort((a, b) => b?.created_at - a?.created_at); 
      let tooltips = {
        ...state.tooltips,
      };
      sessionKeyValueslist.forEach((db) => {
        tooltips[db] = false;
      });
      return {
        ...state,
        sessionKeyValueslist: sessionKeyValueslist,
        tableData: sessionKeyValueslist,
        loading: false,
        tooltips,
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
        sorting: {
          ...state.sorting,
          order: !state.sorting.order,
        },
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
      throw new Error(
        `Unknown action type in paramMapListReducer: ${action.type}`
      );
  }
};

export default paramMapListReducer;
