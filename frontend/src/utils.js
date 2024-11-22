/**
     * Triggers when tables in the join modal are checked (to load their nodes)
     * @param {*} dataArr  array of objects [{...},{...}]
     * @param {*} fields   array containg fields that will be removed [a,b,c...,d]
     */
const removeFieldsFromArrayOfObject = (dataArr , fields) => {
    let result = [];
    for (let i = 0; i < dataArr.length; i++) {
      let newObj = { ...dataArr[i] };
      for (let j = 0; j < fields.length; j++) {
        delete newObj[[fields[j]]];
      }
      result.push(newObj);
    }
  
    return result;
  };

// remove schema name and table name from fields
const removeSchemaAndTableNameFromArrayOfObject = (dataArr) => {
  let result = [];
  if (dataArr.length > 0) {
    let dataArrKeys = Object.keys(dataArr[0]);
    let newKeys = [];
    for (let i = 0; i < dataArrKeys.length; i++) {
      newKeys.push(dataArrKeys[i].split('.').pop())
    }
    if (dataArrKeys.length) {
      for (let i = 0; i < dataArr.length; i++) {
        let newObj = {};
        for (let j = 0; j < dataArrKeys.length; j++) {
          newObj[newKeys[j]] = dataArr[i][dataArrKeys[j]]
        }
        result.push(newObj);
      }
    }

  }

  return result;
};

const removeRouteQueryParam = (route) => {

  if (route.indexOf("/:") > -1) {
    route = route.slice(0, route.indexOf("/:"));
  } else {
    let routeSplit = route.split(":");
    if (routeSplit.length > 1) {
      routeSplit.pop();
      route = routeSplit[0]
      //  if(route[route.length -1 ] === '/'
    } else {
      routeSplit = routeSplit[0].split("/");
      routeSplit.pop();
      route = routeSplit.join("/")
    }

  }
  return route;
};



 
export default {
    removeFieldsFromArrayOfObject, 
    removeSchemaAndTableNameFromArrayOfObject,
    removeRouteQueryParam,
};