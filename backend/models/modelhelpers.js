'use strict';
var ModelManager = require.main.require('./models/modelManager');
const {compare} = require('../extras/utils');
const qutils = require('./utils.js');
 
// let = { relDirection,relDetails ,pathToText} ;
exports.relDirection = relDirection;
exports.relDetails = relDetails;
exports.pathToText = pathToText;
exports.isHaveSubJoin = isHaveSubJoin;
exports.getAllNodes = getAllNodes;
exports.getAllWhereColumns = getAllWhereColumns;
exports.getAllJoinTableIds = getAllJoinTableIds;
exports.getAllTableIdFromPathId = getAllTableIdFromPathId;


exports.colFullPathToColDetail = colFullPathToColDetail;


function pathToText(pathid, subdomain, db_id) {

  if(pathid.indexOf('-') == -1) return null;
    
  let spl = pathid.split('-');

  let arr = [];

  // console.log(ModelManager.models)

  for (let i = 0; i < spl.length; i++) {
    let currentModel = ModelManager.models[subdomain].databases[db_id];    

    arr.push(currentModel.idToName[spl[i]]);
  }
  return arr;
}

function relDirection(id, subdomain, db_id) {
  // console.log(id)
  if(id.indexOf('-') == -1) return null;

  if(id.indexOf('$') > -1) {
    // clean it
    id = id.split('$')[0];
  }

  //cd00ac2a-79d7-4cdb-a7d5-9258590ab899
  let idspl = pathToText(id, subdomain, db_id);
  // console.log(idspl)
  let rel_id = (idspl[idspl.length - 2].join('.') + '-' + idspl[idspl.length - 1].join('.'));

  // console.log(rel_id)
  // console.log(rel_id,ModelManager.models['cd00ac2a-79d7-4cdb-a7d5-9258590ab899'].test['public']['firm_contacts'].properties.rels_new)

  // console.log(ModelManager.models['cd00ac2a-79d7-4cdb-a7d5-9258590ab899'].test[idspl[0][0]][idspl[0][1]].properties)
  // console.log(ModelManager.models['cd00ac2a-79d7-4cdb-a7d5-9258590ab899'].test.idToName)
  // console.log(ModelManager.models[subdomain].test[idspl[idspl.length - 2][0]][idspl[idspl.length - 2][1]].properties.rels_new[rel_id])
  let currentModel = ModelManager.models[subdomain].databases[db_id];   
  let dir = currentModel.models[idspl[idspl.length - 2][0]][idspl[idspl.length - 2][1]].properties.rels_new[rel_id].direct;

  // if(dir) {
  //     dir = dir == 'in' ? 'out' : 'in';
  // }
  // dir = dir == 'in' ? 'out' : 'in';

  return dir;

}

function colFullPathToColDetail(colFullPath, subdomain, db_id) {

  let currentModel = ModelManager.models[subdomain].databases[db_id].models;
  let splitPath = colFullPath.split(".");
  let colData = JSON.parse(JSON.stringify(currentModel[splitPath[0]][splitPath[1]].properties.columns[splitPath[2]]));
  colData["columnId"] = currentModel[splitPath[0]][splitPath[1]].properties.id + "." + colData.id;
  return colData;
  
}


function relDetails(id, subdomain, db_id) {
  // console.log(id)
  if(id.indexOf('-') == -1) return null;

  if(id.indexOf('$') > -1) {
    // clean it
    id = id.split('$')[0];
  }

  //cd00ac2a-79d7-4cdb-a7d5-9258590ab899
  let idspl = pathToText(id, subdomain, db_id);
  // console.log(idspl)
  let rel_id = (idspl[idspl.length - 2].join('.') + '-' + idspl[idspl.length - 1].join('.'));

  // console.log(rel_id)
  // console.log(rel_id,ModelManager.models['cd00ac2a-79d7-4cdb-a7d5-9258590ab899'].test['public']['firm_contacts'].properties.rels_new)

  // console.log(ModelManager.models['cd00ac2a-79d7-4cdb-a7d5-9258590ab899'].test[idspl[0][0]][idspl[0][1]].properties)
  // console.log(ModelManager.models['cd00ac2a-79d7-4cdb-a7d5-9258590ab899'].test.idToName)
  // console.log(ModelManager.models[subdomain].test[idspl[idspl.length - 2][0]][idspl[idspl.length - 2][1]].properties.rels_new[rel_id])
  let currentModel = ModelManager.models[subdomain].databases[db_id];   

  let dir = currentModel.models[idspl[idspl.length - 2][0]][idspl[idspl.length - 2][1]].properties.rels_new[rel_id];

  // if(dir) {
  //     dir = dir == 'in' ? 'out' : 'in';
  // }
  // dir = dir == 'in' ? 'out' : 'in';

  return dir;

}

function isHaveSubJoin(id, subdomain, db_id) {

  let qm = 'select';
  let currentModel = ModelManager.models[subdomain].databases[db_id];
  let Models = currentModel.models;
  if (!id) return null;
  let idSplit = id.split('$');
  let idSplitLength = idSplit.length;
  let currentSchema; 
  let path, pathSplit, pathSplitLength, lastel, secondLastEl, lastelSplit, currentColumn, currentTable, nodes = [];
  path = idSplit[0];
  pathSplit = path.split('-');
  pathSplitLength = pathSplit.length;
  if (pathSplitLength > 6) return null; // TODO : increase length  
  if (idSplit.length == 1) {
    // opening or refby 
    if (pathSplitLength == 1) {
      // 40
      let node = { nodes: [], selectable: false };
      currentSchema = currentModel.tidToName[pathSplit[0]][0];
      currentTable = currentModel.tidToName[pathSplit[0]][1];
      node.text = currentSchema + '.' + currentTable;
      let columnKeys = Object.keys(Models[currentSchema][currentTable].properties.columns).sort(compare);
      for (let i = 0; i < columnKeys.length; i++) {
        let currentNode = {};
        let currentNodeId = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].id;
        currentNode.text = columnKeys[i];
        currentNode.id = path + '.' + currentNodeId;
        currentNode.ts = qutils.istimeseriescol(columnKeys[i], Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type);
        if (Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]]) {
          currentNode.nodes = [];

          for (let j = 0; j < Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]].length; j++) {
            let refbysplit = Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]][j].split('.');
            let refbyid = Models[refbysplit[0]][refbysplit[1]].properties.id + '.' + Models[refbysplit[0]][refbysplit[1]].properties.columns[refbysplit[2]].id;

            return true;
          }
        }
        if (Models[currentSchema][currentTable].properties.relations[columnKeys[i]]) {

          return true;
        }
        node.nodes.push(currentNode);
      }
      // return  (node);
    } else {
      // 40.1-30.2
      // 40.1-30.2-30.2-4.3
      lastel = pathSplit[pathSplitLength - 1];
      secondLastEl = pathSplit[pathSplitLength - 2];
      currentSchema = currentModel.idToName[lastel][0];
      currentTable = currentModel.idToName[lastel][1];
      currentColumn = currentModel.idToName[lastel][2];
      let columnKeys = Object.keys(Models[currentSchema][currentTable].properties.columns).sort(compare);
      for (let i = 0; i < columnKeys.length; i++) {
        let element = columnKeys[i];
        let currentNode = {};
        let currentColumnId = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].id;
        let currentNodeId = Models[currentSchema][currentTable].properties.id + '.' + currentColumnId;
        currentNode.text = columnKeys[i];
        currentNode.id = path + '$' + currentColumnId;
        currentNode.ts = qutils.istimeseriescol(columnKeys[i], Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type);
        if (Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]]) {

          for (let j = 0; j < Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]].length; j++) {
            let refbysplit = Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]][j].split('.');
            let refbyid = Models[refbysplit[0]][refbysplit[1]].properties.id + '.' + Models[refbysplit[0]][refbysplit[1]].properties.columns[refbysplit[2]].id;
            if (currentNodeId == lastel && refbyid == secondLastEl && !qutils.haveMany(lastel + '-' + secondLastEl)) {
              continue;
            }

            if (pathSplitLength < 6) {
              return true;

            }
          }
        }
        if (Models[currentSchema][currentTable].properties.relations[columnKeys[i]]) {

          let refsplit = Models[currentSchema][currentTable].properties.relations[columnKeys[i]].split('.');
          let refid = Models[refsplit[0]][refsplit[1]].properties.id + '.' + Models[refsplit[0]][refsplit[1]].properties.columns[refsplit[2]].id;
          if (currentNodeId !== lastel && refid !== secondLastEl) {

            if (pathSplitLength < 6) {
              return true;
            }

          } 
          /*     else {

          } */
        }

      }

    }
  }

  return false;
}


function getAllNodes(id, subdomain, db_id, search_query = '' , options ={}) {
  //  return '10df'
  

  let qm = 'select';
  let currentModel = ModelManager.models[subdomain].databases[db_id];
  let Models = currentModel.models;
  if (!id) return null;
  let idSplit = id.split('$');
  let idSplitLength = idSplit.length;
  let currentSchema;
  let path, pathSplit, pathSplitLength, lastel, secondLastEl, lastelSplit, currentColumn, currentTable, nodes = [];
  let isTableNameMatched = false ; 
  path = idSplit[0];
  pathSplit = path.split('-');
  pathSplitLength = pathSplit.length;
  if (pathSplitLength > 6) return null; // TODO : increase length  
  if (idSplit.length == 1) {
    // opening or refby 
    if (pathSplitLength == 1) {
      // 40

      let node = { nodes: [], selectable: undefined };
      currentSchema = currentModel.tidToName[pathSplit[0]][0];
      currentTable = currentModel.tidToName[pathSplit[0]][1];
      node.text = currentSchema + '.' + currentTable;
      node.table_join_path = ''; 
      if( node.text.search(search_query) > -1) isTableNameMatched = true ; // if table name matched then include all columns 
      let columnKeys = Object.keys(Models[currentSchema][currentTable].properties.columns).sort(compare);
      for (let i = 0; i < columnKeys.length; i++) {
        let currentNode = {};
        let currentNodeId = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].id;
        currentNode.text = columnKeys[i];
        currentNode.id = path + '.' + currentNodeId;

        currentNode.required =  qutils.isRequiredColumn( Models[currentSchema][currentTable].properties.columns[columnKeys[i]])  ;
        currentNode.foreign = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].foreign;
        currentNode.primary = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].primary;
        currentNode.unique = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].unique;
        currentNode.subType = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type;
        currentNode.unique_cols = qutils.getUniqueColumnData(
          path,
          Models[currentSchema][currentTable].properties.uindex,
          Models[currentSchema][currentTable].properties
        )
        // currentNode.ts = qutils.istimeseriescol(columnKeys[i], Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type);
        currentNode.optionType = qutils.getSuperType(Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type, currentModel.db_type);
        if (  Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]]) {
          currentNode.nodes = [];

          for (let j = 0; j < Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]].length; j++) {
            let refbysplit = Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]][j].split('.');
            // if( req.query.primary &&  Models[refbysplit[0]][refbysplit[1]].properties.primary.length==0 ) continue; 
            let refbyid = Models[refbysplit[0]][refbysplit[1]].properties.id + '.' + Models[refbysplit[0]][refbysplit[1]].properties.columns[refbysplit[2]].id;
            let join_path_list = pathToText(currentNode.id + '-' + refbyid, subdomain, db_id);
            let currentSubJoinId = currentNode.id + '-' + refbyid;
            let nnode = {
              text: refbysplit[0] + '.' + refbysplit[1],
              id: currentSubJoinId,
              nodes: [],
              selectable: undefined,
              // showAgg: true,
              childNodes:  isHaveSubJoin(currentSubJoinId, subdomain, db_id),
              join_path: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
              join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
              onExpand: '/apps/editor/controllers/nodes?subdomain=' + subdomain + '&id=' + currentNode.id + '-' + refbyid + '&qm=' + qm + '&db_id=' + db_id,
            };
            let reldetails = relDetails(currentNode.id + '-' + refbyid, subdomain, db_id);
            if (qm == 'select') {
              nnode.showAgg = true;
            } else if (qm == 'insert') {
              if (reldetails.type.charAt(2) == 'M') nnode.showMulti = true;
            }
            currentNode.nodes.push(nnode);

          }
        }
        if (  Models[currentSchema][currentTable].properties.relations[columnKeys[i]]) {
          currentNode.nodes = currentNode.nodes || [];
          let refsplit = Models[currentSchema][currentTable].properties.relations[columnKeys[i]].split('.');
          // if( req.query.primary &&  Models[refsplit[0]][refsplit[1]].properties.primary.length==0 ) continue; 
          let refid = Models[refsplit[0]][refsplit[1]].properties.id + '.' + Models[refsplit[0]][refsplit[1]].properties.columns[refsplit[2]].id;
          let join_path_list = pathToText(currentNode.id + '-' + refid, subdomain, db_id);
          let currentSubJoinId = currentNode.id + '-' + refid;
          let nnode = {
            text: refsplit[0] + '.' + refsplit[1],
            id: currentSubJoinId,
            nodes: [],
            selectable: undefined,
            // showAgg: true,
            childNodes:  isHaveSubJoin(currentSubJoinId, subdomain, db_id),
            join_path: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
            join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
            onExpand: '/apps/editor/controllers/nodes?subdomain=' + subdomain + '&id=' + currentNode.id + '-' + refid + '&qm=' + qm + '&db_id=' + db_id,
          };
          let reldetails = relDetails(currentNode.id + '-' + refid, subdomain, db_id);
          if (qm == 'select') {
            nnode.showAgg = true;
          } else if (qm == 'insert') {
            if (reldetails.type.charAt(2) == 'M') nnode.showMulti = true;
          }


          currentNode.nodes.push(nnode);
        }
        // if(   (!currentNode.nodes || !currentNode.nodes.length   )) continue;  // if column is not joined column then not push
        if (isTableNameMatched || currentNode.text.search(search_query) > -1) node.nodes.push(currentNode);

      }
      return node;
    } else {
      let node = { nodes: [], selectable: undefined };
      // 40.1-30.2
      // 40.1-30.2-30.2-4.3
      lastel = pathSplit[pathSplitLength - 1];
      secondLastEl = pathSplit[pathSplitLength - 2];
      if (!currentModel.idToName[lastel]) return res.zend(null, 400, "Invalid Table Id");
      node.text = currentModel.idToName[lastel][0] + '.' + currentModel.idToName[lastel][1];
      let table_join_path = pathToText(lastel + '-' + secondLastEl, subdomain, db_id);
      node.table_join_path = table_join_path[1].join(".") + ' = ' + table_join_path[0].join(".")
      if( node.text.search(search_query) > -1) isTableNameMatched = true ; 
      currentSchema = currentModel.idToName[lastel][0];
      currentTable = currentModel.idToName[lastel][1];
      currentColumn = currentModel.idToName[lastel][2];
      let columnKeys = Object.keys(Models[currentSchema][currentTable].properties.columns).sort(compare);
      for (let i = 0; i < columnKeys.length; i++) {
        // let element = columnKeys[i];
        let currentNode = {};
        let currentColumnId = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].id;
        let currentNodeId = Models[currentSchema][currentTable].properties.id + '.' + currentColumnId;
        currentNode.text = columnKeys[i];
        currentNode.id = path + '$' + currentColumnId;
        currentNode.required =  qutils.isRequiredColumn(Models[currentSchema][currentTable].properties.columns[columnKeys[i]])  ;
        currentNode.primary = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].primary;
        currentNode.foreign = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].foreign;
        // currentNode.ts = qutils.istimeseriescol(columnKeys[i], Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type);
        currentNode.optionType = qutils.getSuperType(Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type, currentModel.db_type);
        currentNode.unique = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].unique;
        currentNode.subType = Models[currentSchema][currentTable].properties.columns[columnKeys[i]].type;
        currentNode.unique_cols = qutils.getUniqueColumnData(
          path,
          Models[currentSchema][currentTable].properties.uindex,
          Models[currentSchema][currentTable].properties
        )
        if (  Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]]) {

          for (let j = 0; j < Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]].length; j++) {
            let refbysplit = Models[currentSchema][currentTable].properties.referencedBy[columnKeys[i]][j].split('.');
            // if( req.query.primary &&  Models[refbysplit[0]][refbysplit[1]].properties.primary.length==0 ) continue; 
            let refbyid = Models[refbysplit[0]][refbysplit[1]].properties.id + '.' + Models[refbysplit[0]][refbysplit[1]].properties.columns[refbysplit[2]].id;
            if (currentNodeId == lastel && refbyid == secondLastEl && !qutils.haveMany(lastel + '-' + secondLastEl)) {
              continue;
            }
            let fid = path + '-' + currentNodeId + '-' + refbyid;
            let join_path_list = pathToText(currentNodeId + '-' + refbyid, subdomain, db_id);
            currentNode.nodes = currentNode.nodes || [];
            if (pathSplitLength < 6) { // TODO : increase node length 
              let nnode = {
                text: refbysplit[0] + '.' + refbysplit[1],
                id: fid,
                nodes: [],
                selectable: undefined,
                // showAgg: true,
                childNodes:  isHaveSubJoin(fid, subdomain, db_id),
                join_path: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
                join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
                onExpand: '/apps/editor/controllers/nodes?subdomain=' + subdomain + '&id=' + fid + '&qm=' + qm + '&db_id=' + db_id,
              };
              let reldetails = relDetails(fid, subdomain, db_id);
              if (qm == 'select') {
                nnode.showAgg = true;
              } else if (qm == 'insert') {
                if (reldetails.type.charAt(2) == 'M') nnode.showMulti = true;
              }
              currentNode.nodes.push(nnode);
            }
          }
        }
        if (  Models[currentSchema][currentTable].properties.relations[columnKeys[i]]) {

          let refsplit = Models[currentSchema][currentTable].properties.relations[columnKeys[i]].split('.');
          // if( req.query.primary &&  Models[refsplit[0]][refsplit[1]].properties.primary.length==0 ) continue; 
          let refid = Models[refsplit[0]][refsplit[1]].properties.id + '.' + Models[refsplit[0]][refsplit[1]].properties.columns[refsplit[2]].id;
          if (currentNodeId !== lastel && refid !== secondLastEl) {
            currentNode.nodes = currentNode.nodes || [];
            let fid = path + '-' + currentNodeId + '-' + refid;
            let join_path_list = pathToText(currentNodeId + '-' + refid, subdomain, db_id);
            if (pathSplitLength < 6) {
              let nnode = {
                text: refsplit[0] + '.' + refsplit[1],
                id: fid,
                nodes: [],
                selectable: undefined,
                // showAgg: true,
                childNodes:  isHaveSubJoin(fid, subdomain, db_id),
                join_path: join_path_list[1].join(".") + ' = ' + join_path_list[0].join("."),
                join_path_short: `${join_path_list[1][1]}.${join_path_list[1][2]} = ${join_path_list[0][1]}.${join_path_list[0][2]}`,
                onExpand: '/apps/editor/controllers/nodes?subdomain=' + subdomain + '&id=' + fid + '&qm=' + qm + '&db_id=' + db_id,
              };
              let reldetails = relDetails(fid, subdomain, db_id);
              if (qm == 'select') {
                nnode.showAgg = true;
              } else if (qm == 'insert') {
                if (reldetails.type.charAt(2) == 'M') nnode.showMulti = true;
              }
              currentNode.nodes.push(nnode);
            }

          } else {
            // console.log('SKIP', refsplit, currentNodeId, lastel, refid,  secondLastEl);
          }
        }
        // if(  (!currentNode.nodes || !currentNode.nodes.length   )) continue;  // if column is not joined column then not push
        if ( isTableNameMatched || currentNode.text.search(search_query) > -1) nodes.push(currentNode);

      }
      node.nodes = nodes
      return (node);
    }
  }

  return false;
}
function getAllWhereColumns(bodyObj) {

  bodyObj.agg_paths = bodyObj.agg_paths || [];
  bodyObj.c = bodyObj.c || [];
  for (let i = 0; i < bodyObj.c.length; i++) {
    const element = bodyObj.c[i];
    if (element.id.indexOf('-') > -1) {
      var id_spl = element.id.split('-');
      element.id = id_spl.pop().split('$')[0]
    }
  }

  if (bodyObj.c.length != 1) return res.zend(null, 400, "Must have exactly one column");
  // let currentModel = ModelManager.models[subdomain].databases[db_id];
  let currentModel = ModelManager.models[bodyObj.subdomain].databases[bodyObj.db_id];

  var id_spl = bodyObj.c[0].id.split('-')
  var col_id = id_spl[id_spl.length - 1];
  var col_name_spl = currentModel.idToName[col_id];

  var all_col_names = Object.keys(currentModel.models[col_name_spl[0]][col_name_spl[1]].properties.columns)

  let final_where_cols = [];
  let allRequestedPath = {}
  var session_cols = Object.keys(ModelManager.models[bodyObj.subdomain].appDetails.auth.session_key_values);
  let colIdSplit;
  for (let i = 0; i < all_col_names.length; i++) {

    var cur_col_ob = {
      label: all_col_names[i],
      display_name: all_col_names[i],
      primary: currentModel.models[col_name_spl[0]][col_name_spl[1]].properties.columns[all_col_names[i]].primary,
      type: qutils.getSuperType(currentModel.models[col_name_spl[0]][col_name_spl[1]].properties.columns[all_col_names[i]].type)
    }

    if(!cur_col_ob.type) {
      continue;
    }

    cur_col_ob.id = col_name_spl[0] + "." + col_name_spl[1] + "." + all_col_names[i];


    colIdSplit = colFullPathToColDetail(cur_col_ob.id, bodyObj.subdomain, bodyObj.db_id).columnId.split(".")
    cur_col_ob['columnID'] = colIdSplit.join(".");

    if (
      (ModelManager.models[bodyObj.subdomain].appDetails.auth && ModelManager.models[bodyObj.subdomain].appDetails.auth.session_key_values && ModelManager.models[bodyObj.subdomain].appDetails.auth.session_key_values[cur_col_ob['columnID']])
      || (ModelManager.models[bodyObj.subdomain].appDetails.auth && ModelManager.models[bodyObj.subdomain].appDetails.auth.user_id_column_id == cur_col_ob['columnID'])
    ) {
      cur_col_ob.session_key = cur_col_ob['columnID']
    } else {
      var col_name_spl = ModelManager.models[bodyObj.subdomain].databases[bodyObj.db_id].idToName[cur_col_ob['columnID']];
      if (
        ModelManager.models[bodyObj.subdomain].databases[bodyObj.db_id].models[col_name_spl[0]][col_name_spl[1]].properties.relations[col_name_spl[2]]
      ) {
        if(ModelManager.models[bodyObj.subdomain].appDetails.auth.user_id_column_id) {
            var user_id_col_arr = ModelManager.models[bodyObj.subdomain].databases[bodyObj.db_id].idToName[ModelManager.models[bodyObj.subdomain].appDetails.auth.user_id_column_id];
            if(user_id_col_arr && user_id_col_arr.join('.') == ModelManager.models[bodyObj.subdomain].databases[bodyObj.db_id].models[col_name_spl[0]][col_name_spl[1]].properties.relations[col_name_spl[2]]) {
              cur_col_ob.session_key = ModelManager.models[bodyObj.subdomain].appDetails.auth.user_id_column_id;
            }
        }
        if(!cur_col_ob.session_key) {
          session_loop:
          for (let j = 0; j < session_cols.length; j++) {
            const element = session_cols[j];
            if (ModelManager.models[bodyObj.subdomain].appDetails.auth.session_key_values[session_cols[j]].column_name == ModelManager.models[bodyObj.subdomain].databases[bodyObj.db_id].models[col_name_spl[0]][col_name_spl[1]].properties.relations[col_name_spl[2]]) {
              cur_col_ob.session_key = session_cols[j];
              break session_loop;
            }
          }
        }
        
      }
    }
    
    final_where_cols.push(cur_col_ob)
  }
  return {
    columns: final_where_cols.map((item) => ({
      ...item,
      "label": item.label,
      "primary": item.primary,
      "type": item.type,
      "value": item.id,
      "columnID": item.columnID,
      "session_key": item.session_key,
    })),
    table: currentModel.models[col_name_spl[0]][col_name_spl[1]].properties.schema_name + '.' + currentModel.models[col_name_spl[0]][col_name_spl[1]].properties.table_name
  }

}

function getAllJoinTableIds(currModel, pathId) {
  let result = [];
  let idToTablePath;
  let tableId;
  let isJoinTable;
  if (pathId.indexOf("-") > -1) {
    tableId = pathId.split("-").pop().split(".")[0];
    isJoinTable = true;
  } else {
    tableId = pathId;
    isJoinTable = false;
  }
  idToTablePath = currModel.tidToName[tableId];

  let curr_table_prop = currModel.models[idToTablePath[0]][idToTablePath[1]].properties;

  {
    /*  get all reference by tables */
    let ref_by_keys = Object.keys(curr_table_prop.referencedBy);
    for (let i = 0; i < ref_by_keys.length; i++) {

      let ref_by_columns = curr_table_prop.referencedBy[ref_by_keys[i]];
      let col_id
      if (isJoinTable) {
        col_id = pathId + '-' + tableId + '.' + currModel.models[curr_table_prop.schema_name][curr_table_prop.table_name].properties.columns[ref_by_keys[i]].id;
      } else {
        col_id = (tableId) + '.' + currModel.models[curr_table_prop.schema_name][curr_table_prop.table_name].properties.columns[ref_by_keys[i]].id;
      }

      for (let j = 0; j < ref_by_columns.length; j++) {
        let join_path_split = ref_by_columns[j].split('.');
        let join_table_prop = currModel.models[join_path_split[0]][join_path_split[1]].properties;
        let join_table_id = col_id + '-' + join_table_prop.id + '.' + join_table_prop.columns[join_path_split[2]].id;
        result.push(join_table_id)
      }


    }
  }
  {
    /*  get all referencing to  tables */
    let rel_keys = Object.keys(curr_table_prop.relations);
    for (let i = 0; i < rel_keys.length; i++) {

      let col_id = tableId + '.' + currModel.models[curr_table_prop.schema_name][curr_table_prop.table_name].properties.columns[rel_keys[i]].id;
      if (isJoinTable) {
        col_id = pathId + '-' + tableId + '.' + currModel.models[curr_table_prop.schema_name][curr_table_prop.table_name].properties.columns[rel_keys[i]].id;
      } else {
        col_id = tableId + '.' + currModel.models[curr_table_prop.schema_name][curr_table_prop.table_name].properties.columns[rel_keys[i]].id;
      }

      let join_path_split = curr_table_prop.relations[rel_keys[i]].split('.');
      let join_table_prop = currModel.models[join_path_split[0]][join_path_split[1]].properties;
      let join_table_id = col_id + '-' + join_table_prop.id + '.' + join_table_prop.columns[join_path_split[2]].id;
      result.push(join_table_id)
    }


  }


  return result;
}

function getAllTableIdFromPathId(pathId) {
  let tableIds = [];
  let pathId_spilt = pathId.split("-");
  for (let i = 0; i < pathId_spilt.length; i++) {
    tableIds.push(pathId_spilt[i].split(".")[0]);;

  }
  return tableIds;
}