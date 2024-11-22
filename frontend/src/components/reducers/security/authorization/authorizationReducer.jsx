const authorizationReducer = (state, action) => {
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

          // Set db_id 
    case "SET_DB_ID":
      return {
        ...state,
        dbId : action.db_id,
      
      };

    // set roles data
    case "SET_ROLES":
      const roleTypesOptions = []; 
      let  appAuth= {}; 
      const data = action.data || {}; 
        data.role_types &&  data.role_types.forEach((elem)=>{
        roleTypesOptions.push( { 
          label: elem.name,
          value: elem.role_type_id,
          description: elem.description,
 
        })
      })
      appAuth = { ...data.session_key_values } ;
      if(data.user_session_object && data.user_session_object.column_id){ 
        appAuth[data.user_session_object.column_id ] =   data.user_session_object         // TODO: handle same column id
        appAuth[data.user_session_object.column_id ].isAuthColumn = true
      }
      return {
        ...state,
        rolesData: data?.roles || [],
        roleTypeOptions: roleTypesOptions,
        authDetails: {
          authDetailId: data.auth_detail_id,
          appAuth: appAuth, 
        },
        loading: false,
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
        `Unknown action type in authorizationReducer: ${action.type}`
      );
  }
};

export default authorizationReducer;
