var crypto = require('crypto');

/** Sync */
function getRandomString(length, chars) {
    if (!chars) {
      chars  = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' ; 
    }
  
    const charsLength = chars.length;
    if (charsLength > 256) {
      throw new Error('Argument \'chars\' should not have more than 256 characters'
        + ', otherwise unpredictability will be broken');
    }
  
    const randomBytes = crypto.randomBytes(length);
    let result = new Array(length);
  
    let cursor = 0;
    for (let i = 0; i < length; i++) {
      cursor += randomBytes[i];
      result[i] = chars[cursor % charsLength];
    }
  
    return result.join('');
  }
  



function getResultColumnDataType(result, currentModel) {

  let colNameToTypeObj = {};
  let builtinsIDToValue = {};
  let col_id, col_path_arr;
  let hasUnknownDataType = false;
  for (let i = 0; i < result.fields?.length; i++) {
    col_id = result.fields[i].tableID + "." + result.fields[i].columnID;
    col_path_arr =    currentModel.idToName[col_id];
    if (!col_path_arr) {
      hasUnknownDataType = true;
      continue;
    };
    colNameToTypeObj[result.fields[i].name] = {
      type: currentModel.models[col_path_arr[0]][col_path_arr[1]].properties.columns[col_path_arr[2]].type || null,
    }

  }
  if (hasUnknownDataType) {
    let builtins = result._types._types.builtins;
    let builtins_keys = Object.keys(builtins);
    for (let i = 0; i < builtins_keys.length; i++) {
      builtinsIDToValue[builtins[builtins_keys[i]]] = builtins_keys[i];
    }
    for (let i = 0; i < result.fields.length; i++) {
      if (!colNameToTypeObj[result.fields[i].name]) {
        colNameToTypeObj[result.fields[i].name] = {
          type: builtinsIDToValue[result.fields[i].dataTypeID]?.toLowerCase() || 'unknown'
        }
      }

    }
  }
  return colNameToTypeObj;


}

  function compare(a, b) {
    if (a.last_nom < b.last_nom) {
      return -1;
    }
    if (a.last_nom > b.last_nom) {
      return 1;
    }
    return 0;
  }


function formatNodesForTableMode(allNodes) {
  let result = {};

  for (let i = 0; i < allNodes.length; i++) {
    let nodes = allNodes[i]
    // nodes.selectable = false;
    result[nodes.tableId] = nodes
    delete nodes.table_join_path;
    delete nodes.tableId;

  }
  // result.sort((a, b) => a.label > b.label ? 1 : -1)
  return result;

}


function formatJoinGraph(data) {

  if (!data) return data;
  let result = [];

  for (let i = 0; i < data.length; i++) {
    let currObj = { 
      ...data[i],
      label: data[i].text,
      value: data[i].id,
      path: data[i].join_path,
      disable_value: true,
     };
    delete currObj.text ; 
    delete currObj.id ; 
    delete currObj.join_path ; 
    result.push(currObj)
  }
  // result.sort((a, b) => a.label > b.label ? 1 : -1)
  return result;

}

function getClientDomain(req) {
    return 'https://app.querydeck.io'
}

function replaceAllDataFromText(text, dataObj) {

  let dataObjKeys = Object.keys( dataObj)
  for (let i = 0; i < dataObjKeys.length; i++) {
      let currKey = dataObjKeys[i];
      let re = new RegExp(`{{${currKey}}}`,"gi");
      text = text.replace(re, dataObj[currKey]); 

  }
  return text; 
}





  exports.getRandomString = getRandomString;  
  exports.getClientDomain = getClientDomain;  
  exports.getResultColumnDataType = getResultColumnDataType;  
  exports.compare = compare;
  exports.formatNodesForTableMode = formatNodesForTableMode;
  exports.formatJoinGraph = formatJoinGraph;
  exports.replaceAllDataFromText = replaceAllDataFromText;
