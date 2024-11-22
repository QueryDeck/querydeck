'use strict';
var ModelManager = require.main.require('./models/modelManager');
const catchError = require('../../../middlewares/catchError');
const utils = require('../../../models/utils');

module.exports = function (router) {



  router.get('/table-map-old', catchError(async function (req, res) {

    if (!req.query.subdomain || !req.clientModels[req.query.subdomain]) return res.zend(null, 400);
    if (!req.query.db_id) return res.zend(null, 400, "Must have field db_id");
    if (req.user_id !== req.clientModels[req.query.subdomain].appDetails.created_by) return res.zend(null, 401, "Login Required");

    let currentModel = req.clientModels[req.query.subdomain].databases[req.query.db_id];
    console.file(currentModel)
    var schemas = Object.keys(currentModel.models);
    var all_tabs = [];
    var all_rels = [];
    let isAllRelsRequested = req.query.rels == false || req.query.rels == "false" ? false : true;
    // let isReferencedByColsRequested = req.query.referenced_by_cols == false || req.query.referenced_by_cols == "true" ? true : false ; 
    var map = { nodes: {}, links: {} };

    for (let i = 0; i < schemas.length; i++) {
      // const element = schemas[i];
      if (schemas[i] == 'tidToName' || schemas[i] == 'idToName') continue;
      var tabs = Object.keys(currentModel.models[schemas[i]]);
      for (let j = 0; j < tabs.length; j++) {
        // const element = tabs[j];
        var tab_ports = [];

        map.nodes[currentModel.models[schemas[i]][tabs[j]].properties.id] = {
          id: currentModel.models[schemas[i]][tabs[j]].properties.id,
          ports: {},
          type: 'output-only'
        };

        currentModel.models[schemas[i]][tabs[j]].properties.rels_new = currentModel.models[schemas[i]][tabs[j]].properties.rels_new || {};
        var rel_names = Object.keys(currentModel.models[schemas[i]][tabs[j]].properties.rels_new);
        let ref_in_count = 0;
        let ref_out_count = 0;
        for (let k = 0; k < rel_names.length; k++) {
          const element = rel_names[k];
          if (currentModel.models[schemas[i]][tabs[j]].properties.rels_new[rel_names[k]].direct == 'out') {
            var rel_spl = rel_names[k].split('-');
            var relsource_col_name = rel_spl[0].split('.')[2];
            var rel2spl = rel_spl[1].split('.');
            var rel_tab_id = currentModel.models[rel2spl[0]][rel2spl[1]].properties.id;
            var rel_col_id = currentModel.models[rel2spl[0]][rel2spl[1]].properties.columns[rel2spl[2]].id;
            var rel_col_name = rel2spl[2];
            var source, target, many_target;
            source = currentModel.models[schemas[i]][tabs[j]].properties.id;
            target = rel_tab_id;
            // many_target = currentModel.models[schemas[i]][tabs[j]].properties.rels_new[rel_names[k]].type.charAt(0) == 'M' ? true : false;

            map.nodes[currentModel.models[schemas[i]][tabs[j]].properties.id].ports[source + '.' + currentModel.models[schemas[i]][tabs[j]].properties.columns[relsource_col_name].id] = {
              id: source + '.' + currentModel.models[schemas[i]][tabs[j]].properties.columns[relsource_col_name].id,
              type: 'output'
            };

            map.links[source + '-' + target] = {
              id: source + '-' + target,
              from: {
                nodeId: source,
                portId: source + '.' + currentModel.models[schemas[i]][tabs[j]].properties.columns[relsource_col_name].id
              },
              to: {
                nodeId: target,
                portId: target + '.' + rel_col_id
              }
            };

            tab_ports.push({
              id: source + '.' + currentModel.models[schemas[i]][tabs[j]].properties.columns[relsource_col_name].id,
              target_id: target + '.' + rel_col_id,
              target_name: rel_col_name,
              name: relsource_col_name,
              width: 2,
              height: 2,
              side: 'NORTH',
              hidden: true
            });
            if (isAllRelsRequested)
              all_rels.push({
                type: 'rel',
                id: source + '-' + target,
                from: source,
                to: target,
                fromPort: currentModel.models[schemas[i]][tabs[j]].properties.columns[relsource_col_name].id,
                toPort: rel_col_id,
                sourcePort: source + '.' + currentModel.models[schemas[i]][tabs[j]].properties.columns[relsource_col_name].id,
                targetPort: target + '.' + rel_col_id,
                source: {
                  table_id: source,
                  table_name: schemas[i] + '.' + tabs[j],
                  col_id: currentModel.models[schemas[i]][tabs[j]].properties.columns[relsource_col_name].id,
                  col_name: relsource_col_name
                },
                target: {
                  table_id: target,
                  table_name: rel2spl[0] + '.' + rel2spl[1],
                  col_id: rel_col_id,
                  col_name: rel_col_name
                },
                // many_target: many_target
              });
            ref_out_count++;
          } else {
            target = currentModel.models[schemas[i]][tabs[j]].properties.id;
            source = rel_tab_id;
            many_target = currentModel.models[schemas[i]][tabs[j]].properties.rels_new[rel_names[k]].type.charAt(2) == 'M' ? true : false;
            ref_in_count++;

          }

        }

        let table_cols = [];
        let table_cols_keys = Object.keys(currentModel.models[schemas[i]][tabs[j]].properties.columns);
        let ref_table_cols_keys = Object.keys(currentModel.models[schemas[i]][tabs[j]].properties.referencedBy);
        let referenced_by_cols = [];
        for (let k = 0; k < table_cols_keys.length; k++) {
          let curr_col = { ...currentModel.models[schemas[i]][tabs[j]].properties.columns[table_cols_keys[k]] };
          curr_col.label = table_cols_keys[k];
          table_cols.push(curr_col);

        }

        for (let k = 0; k < ref_table_cols_keys.length; k++) {
          let ref_by_tables = currentModel.models[schemas[i]][tabs[j]].properties.referencedBy[ref_table_cols_keys[k]];
          for (let l = 0; l < ref_by_tables.length; l++) {
            let col_split = ref_by_tables[l].split('.');
            referenced_by_cols.push({
              refCol: ref_table_cols_keys[k],
              refBySchema: col_split[0],
              refByTable: col_split[1],
              refByCol: col_split[2],
            });
          }
        }


        all_tabs.push({
          type: 'table',
          text: currentModel.models[schemas[i]][tabs[j]].properties.schema_name + '.' + currentModel.models[schemas[i]][tabs[j]].properties.table_name,
          id: currentModel.models[schemas[i]][tabs[j]].properties.id,
          col_count: Object.keys(currentModel.models[schemas[i]][tabs[j]].properties.columns).length,
          columns: table_cols,
          ports: tab_ports,
          ref_in_count,
          ref_out_count,
          referenced_by_cols,
          unique_cols: utils.getUniqueColumnData(
            currentModel.models[schemas[i]][tabs[j]].properties.id,
            currentModel.models[schemas[i]][tabs[j]].properties.uindex,
            currentModel.models[schemas[i]][tabs[j]].properties),
        });
      }
    }
    return res.zend({
      app_name: req.clientModels[req.query.subdomain].appDetails.name,  // TODO : check changes  when app  is updated 
      db_name: req.clientModels[req.query.subdomain].databases[req.query.db_id].db_name,
      tables: all_tabs,
      rels: isAllRelsRequested ? all_rels : undefined,

    });


    // return res.zend(all_tabs.concat(all_rels));
  }));



  router.all('/*', (req, res) => {
    res.zend({ method: req.method }, 404, "Not Found",);
  });
};