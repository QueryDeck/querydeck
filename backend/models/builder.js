'use strict';
module.exports = class builder {

  constructor(models, allmodels, templateMode){
    this.models = models;
    this.allmodels = allmodels.models;
    return this;
  }

  generate(){
    this.queries = [];
    let single = this.models.length == 1;
    let inupIndex = 0;
    for (let i = 0; i < this.models.length; i++) {
      if(this.models[i].template) {
        this.queries.push({
          query: this.select(this.templateToQuery(this.models[i]), false),
          alias: 'q' + this.makeid(3)
        });
        continue;
      }
      if (this.models[i].q.method == 'select') {
        // array
        this.queries.push({
          query: this.select(this.models[i], false),
          alias: 'q' + this.makeid(3)
        });
      } else {
        this.addInupQuery(this.models[i]);
      }
    }
    if(this.queries.length == 1) return {text: this.queries[0].query, values: this.valueArray || []};
    let finalQuery = 'WITH ';
    let aliasArray = [];
    for (let j = 0; j < this.queries.length; j++) {
      if(this.queries[j].alias.charAt(0) == 'q') aliasArray.push(this.queries[j].alias);
      
      finalQuery += this.queries[j].alias +' AS (' + this.queries[j].query + ') ';
      if(j != this.queries.length - 1) finalQuery += ', ';
    }
    finalQuery += ' SELECT * FROM ' + aliasArray.join(', ') + ';';
    return {text: finalQuery, values: this.valueArray || []};
  }

  getParamIndex(value){
    if(!this.valueIndex) this.valueIndex = 0;
    if(!this.valueArray) this.valueArray = [];
    ++this.valueIndex;
    this.valueArray.push(value);
    return '$' + this.valueIndex;
  } 

  select(model, single){
    // model.q.where = this.addSchemaToObKeys(model.q.where, model, model.q.as);

    let finalColumns = this.resolveSelectOb(model);
    if(model.q.groupby) model.q.groupby = this.addSchemaToObKeys(model.q.groupby, model, model.q.as);
    let jtext = ' ';
    if(model.q.joins && model.q.joins.length > 0) {
      for (let i = 0; i < model.q.joins.length; i++) {
        if(model.q.form) model.q.joins[i].model.q.form = true;
        if((model.q.joins[i].model.q.aggregate || model.q.joins[i].model.q.aggregateOne || model.q.joins[i].model.q.aggArray) && !model.q.form) {
          model.q.joins[i].model.q.where = model.q.joins[i].on;
          finalColumns.push('( ' + this.select(model.q.joins[i].model) + ' )');
        } else {
          jtext += model.q.joins[i].type + ' JOIN ' + (model.q.joins[i].model.constructor.properties.schema_name + '.' + model.q.joins[i].model.constructor.properties.table_name);
          if(model.q.joins[i].model.q.as) jtext += ' AS ' + this.identAlias(model.q.joins[i].model.q.as) + ' ';
          jtext += ' ON ' + this.resolveConditions(this.addSchemaToObKeys(model.q.joins[i].on, model.q.joins[i].model), model.q.joins[i].model);
          finalColumns = finalColumns.concat(this.resolveSelectOb(model.q.joins[i].model));
        }
      }
    }
    jtext += ' ';

    let off = model.q.offset ? ' OFFSET ' + model.q.offset : '';
    let aliastext = '';
    if(model.q.as) aliastext = ' AS ' + this.identAlias(model.q.as) + ' ';
    if(model.q.orderby) model.q.orderby.by = this.addSchemaToObKeys(model.q.orderby.by, model, model.q.as);
    let fq = 'SELECT ' +
            finalColumns.join(',') +
            ' FROM ' +
            model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name + aliastext + 
            jtext +
            this.resolveWhere(model)
            +
            this.resolveGroup(model.q.groupby) +
            this.resolveOrder(model.q.orderby) +
            off +
            this.resolveLimit(model.q.limit);
            
    if(single) return fq;
    let id = this.makeid(6);
    if(model.q.aggArray) return ' SELECT ARRAY_AGG(aggm.' + Object.keys(model.q.columns)[0].split('.').pop() + ') AS ' + model.q.aggArray + ' FROM (' + fq + ') aggm ';
    if(model.q.aggregateOne) return ' SELECT ROW_TO_JSON(' + id + '.*) AS ' + this.identAlias(model.q.aggAlias || model.q.as || model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name) + ' FROM ( ' + fq +
            ' ) ' + id 
    ;
    return ' SELECT JSON_AGG(' + id + '.*) AS ' + this.identAlias(model.q.aggAlias || model.q.as || model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name) + ' FROM ( ' + fq +
            ' ) ' + id 
    ;
  }

  resolveSelectOb(model){
    model.q.columns = this.addSchemaToObKeys(model.q.columns, model, model.q.as);
    let finalColumns = [];
    let columnKeys = Object.keys(model.q.columns);
    if(columnKeys.length == 1 && columnKeys[0].indexOf('*') > -1 && model.q.form) {
      let mk = Object.keys(model.constructor.properties.columns);
      let newc = {};
      for (let k = 0; k < mk.length; k++) {
        newc[mk[k]] = true;
      }
      model.q.columns = this.addSchemaToObKeys(newc, model);
      columnKeys = Object.keys(model.q.columns);
    }
    for (let i = 0; i < columnKeys.length; i++) {
      let ctype = typeof model.q.columns[columnKeys[i]];
      let mypgtype = this.getType(columnKeys[i]);
      if(mypgtype.indexOf('range') > -1 && ctype != 'object') {
        model.q.columns[columnKeys[i]] = {$rangeToArray: true};
        ctype = 'object';
      } 
      
      if(ctype == 'string' && !model.q.form) {
        finalColumns.push(columnKeys[i] + ' AS ' + this.identAlias(model.q.columns[columnKeys[i]]));
      } else if(model.q.columns[columnKeys[i]] && ctype == 'object') {
        let opkeys = Object.keys(model.q.columns[columnKeys[i]]);
        let t = this.getType(columnKeys[i]);
        if(t.indexOf('json') > -1) {
          // resolve json
          for (let j = 0; j < opkeys.length; j++) {
            let jalias = columnKeys[i] + '$jk=' + opkeys[j];
            if(!model.q.form && typeof model.q.columns[columnKeys[i]][opkeys[j]] == 'string') jalias = model.q.columns[columnKeys[i]][opkeys[j]];
            finalColumns.push(' (' + columnKeys[i] + ' -> \'' + opkeys[j] + '\') AS ' + this.identAlias(jalias) + ' ');
          }
        } else {
          // ops
          if(opkeys[0] == '$rangeToArray' && t.indexOf('range') > -1) {
            if(typeof model.q.columns[columnKeys[i]][opkeys[j]] == 'string') finalColumns.push(' ARRAY[LOWER(' + columnKeys[i] + '), UPPER(' + columnKeys[i] + ') - 1 ] AS ' + this.identAlias(model.q.columns[columnKeys[i]][opkeys[j]]) + ' ');
            else finalColumns.push(' ARRAY[LOWER(' + columnKeys[i] + '), UPPER(' + columnKeys[i] + ') - 1 ] AS ' + this.identAlias(columnKeys[i].split('.').pop()) + ' ');
          } else if(opkeys[0] == '$sum' && t.indexOf('int') > -1) {
            if(typeof model.q.columns[columnKeys[i]][opkeys[j]] == 'string') finalColumns.push(' SUM(' + columnKeys[i] + ') AS ' + this.identAlias(model.q.columns[columnKeys[i]][opkeys[j]]));
            else finalColumns.push(' SUM(' + columnKeys[i] + ') AS ' + this.identAlias('sum_' + columnKeys[i].split('.').pop()));
          }
        }
      } else {
        if(model.q.form) finalColumns.push(columnKeys[i] + ' AS ' + this.identAlias(columnKeys[i]));
        else finalColumns.push(columnKeys[i]);
      }
    }
    return finalColumns;
  }

  resolveGroup(group){
    if (!group || group.length == 0) return '';
    return ' GROUP BY ' + Object.keys(group).join(',');
  }

  resolveOrder(order){
    if(!order || typeof order != 'object') return '';
    if(order.random) return ' ORDER BY RANDOM() '
    if ((Object.keys(order.by)).length == 0) return '';
    return ' ORDER BY ' + Object.keys(order.by).join(',') + ' ' + order.type;
  }

  resolveLimit(l){
    if(!l) return '';
    return ' LIMIT ' + l;
  }

  resolveWhere(model){
    if(!model.q.where) return '';
    let w = this.resolveConditions(model.q.where, model);
    return ' WHERE ' + w;
  }

  insert(model){
    // normalize keys through the array
    let allkeys = [];
    let li = model.q.columns.length;
    for (let i = 0; i < li; i++) {
      let k = Object.keys(model.q.columns[i]);
      let lj = k.length;
      for (let j = 0; j < lj; j++) {
        if(allkeys.indexOf(k[j]) == -1) allkeys.push(k[j]);
      }
    }
    // allkeys.push('created_at');
    for (let i = 0; i < li; i++) {
      let k = Object.keys(model.q.columns[i]);
      let lj = allkeys.length;
      for (let j = 0; j < lj; j++) {
        if(k.indexOf(allkeys[j]) == -1) model.q.columns[i][allkeys[j]] = {$default: true};
      }
      // model.q.columns[i].created_at = Date.now();
    }
    // let prequery;
    let q = 'INSERT INTO '
            + model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name
            + '(' + allkeys.join(',') + ')'
            + ' VALUES ' + this.resolveValues(model.q.columns, model) + ' '
            + this.resolveConflict(model)
            + ' RETURNING *';
    if(model.q.conflict && model.q.conflict.update) {
      // upsert 
      let w;
      if(model.q.conflict.on.length == 1) {
        let warr = [];
        for (let i = 0; i < model.q.columns.length; i++) {
          warr.push(model.q.columns[i][model.q.conflict.on[0]]);
        }
        if(warr[0].model) {
          if(warr[0].generatedQuery) w = {[model.q.conflict.on[0]]: {$rawqin: '(SELECT ' + warr[0].toReturn + ' FROM ' + warr[0].queryAlias + ')'}};
          else w = {[model.q.conflict.on[0]]: {$cnbq: warr[0]}};
        } else {
          w = {[model.q.conflict.on[0]]: {$cnb: warr}};
        }
      } else {
        w = {$type: 'or'};
        for (let i = 0; i < model.q.columns.length; i++) {
          w['$and' + i] = {};
          for (let j = 0; j < model.q.conflict.on.length; j++) {
            w['$and' + i][model.q.conflict.on[j]] = model.q.columns[i][model.q.conflict.on[j]];
          }
        }
      }
      // prequery = 'SELECT * FROM ' + model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name + ' WHERE ' + this.resolveConditions(w, model);
    }
    return {
      // prequery: prequery,
      query: q,
      returnVal: model.q.returning && typeof model.q.returning == 'object' ? Object.keys(model.q.returning)[0] : null
    };
  }

  update(model){
    if(!model.q.where) throw 'Cannot update without where conditions';
    let w = this.resolveWhere(model);

    var key_len = Object.keys(model.q.columns).length;
    let q;
    if(key_len == 1) {
      q = 'UPDATE ' + model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name
            + ' SET ' + Object.keys(model.q.columns).join(',') + ' '
            + ' = ' + this.resolveValues([model.q.columns], model) + ' '
            + w
            + ' RETURNING *';
    } else {
      q = 'UPDATE ' + model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name
            + ' SET (' + Object.keys(model.q.columns).join(',') + ') '
            + ' = ' + this.resolveValues([model.q.columns], model) + ' '
            + w
            + ' RETURNING *';
    }

    return {
      prequery: 'SELECT * FROM ' + model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name + w,
      query: q,
      returnVal: model.q.returning && typeof model.q.returning == 'object' ? Object.keys(model.q.returning)[0] : null
    };
  }

  delete(model){
    if(!model.q.where) throw 'Cannot delete without where conditions';
    return {
      query: 'DELETE FROM ' + model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name + this.resolveWhere(model) + ' RETURNING *'
    };
  }

  resolveConflict(model){
    if(!model.q.conflict) return '';
    if(!model.q.conflict.on && model.q.returning) throw 'Cannot return values from upsert if you dont specify conflict columns.';
    if(!model.q.conflict.on) return ' ON CONFLICT DO NOTHING ';
    if(!model.q.conflict.update) {
      let nobon = [];
      for(let i = 0; i< model.q.conflict.on.length; i++)
        nobon.push(' EXCLUDED.' + model.q.conflict.on[i]);
      return ' ON CONFLICT (' + model.q.conflict.on.join(',') + ') DO UPDATE SET (' + model.q.conflict.on.join(',') + ') = (' + nobon.join(',') + ') ';
    }
    let keys = Object.keys(model.q.conflict.update);
    if(keys.length == 1) {
      return ' ON CONFLICT (' + model.q.conflict.on.join(',') + ') DO UPDATE SET ' + keys.join(',') + ' = ' + this.resolveValues([model.q.conflict.update], model) + ' ';
    } else {
      return ' ON CONFLICT (' + model.q.conflict.on.join(',') + ') DO UPDATE SET (' + keys.join(',') + ') = ' + this.resolveValues([model.q.conflict.update], model) + ' ';
    }
  }

  addInupQuery(model){
    if(model.q.method == 'select') throw 'cannot inup select model';
    model.q.aggAlias = model.q.aggAlias || (model.constructor.properties.schema_name != 'public' ? (model.constructor.properties.schema_name + '.') : '') + model.constructor.properties.table_name + '$' + this.makeid(3);
    let ob = this[model.q.method](model);
    if(ob.prequery) {
      this.queries.push({
        query: 'SELECT JSON_AGG(l.*) AS ' + this.identAlias('old$' + model.q.aggAlias) + ' FROM (' + ob.prequery + ') l',
        alias: 'q' + this.makeid(3)
      });
    }
    let ii = 'i' + this.makeid(3);
    this.queries.push({
      query: ob.query,
      alias: ii
    });
    let prefix = model.q.method == 'delete' ? 'deleted' : 'new';
    this.queries.push({
      query: 'SELECT JSON_AGG(' + ii + '.*) AS ' + this.identAlias(prefix + '$' + model.q.aggAlias) + ' FROM ' + ii,
      alias: 'q' + this.makeid(3)
    });
    model.generatedQuery = true;
    model.queryAlias = ii;
    model.toReturn = ob.returnVal;
    return {
      queryAlias: ii,
      toReturn: ob.returnVal
    };
  }

  resolveValues(columns, model){
    let valtext = '';
    let insertKeys = Object.keys(columns[0]);
    for (let i = 0; i < columns.length; i++) {
      valtext += ' (';
      for (let j = 0; j < insertKeys.length; j++) {
        let v = columns[i][insertKeys[j]];
        let nv;
        if(v && typeof v == 'object' && v.model) {
          // model
          if(v.q.method == 'insert' || v.q.method == 'update') {
            if(v.generatedQuery) {
              // repeat
              nv = '(SELECT ' + v.toReturn + ' FROM ' + v.queryAlias + ')';
            } else {
              // new
              let res = this.addInupQuery(v);
              nv = '(SELECT ' + res.toReturn + ' FROM ' + res.queryAlias + ')';
            }
          } else {
            nv = '(' + this.select(v, true) + ')';
          }
        } else if (v && typeof v == 'object'){
          let nestedobkeys = Object.keys(v);
          if(nestedobkeys[0] && nestedobkeys[0].indexOf('$') > -1) {
            // operator
            nv = this.resolveValueOperators([insertKeys[j]], v);
          } else {
            nv = this.getParamIndex(v);
          }
        } else {
          if(typeof v == 'undefined') nv = 'NULL';
          else {
            let vtype = this.getType(model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name + '.' + insertKeys[j]);
            if(v == '' && (vtype == 'integer' || vtype == 'bigint' || vtype == 'smallint')) {
              nv = ' NULL ';
            } else {
              nv = this.getParamIndex(v);
            }
          }
        }
        valtext += nv;
        if(j != insertKeys.length -1) valtext += ',';
      }
      valtext += ')';
      if(i < columns.length - 1) valtext += ', ';
    }
    return valtext;
  }

  resolveValueOperators(columnName, operator){
    let op = Object.keys(operator)[0];
    let val = operator[op];
    let text;
    if(op == '$append') {
      text = 'ARRAY_APPEND(' + columnName + ', ' + this.getParamIndex(val) + ')';
    } else if(op == '$prepend') {
      text = 'ARRAY_PREPEND(' + columnName + ', ' + this.getParamIndex(val) + ')';
    } else if(op == '$remove') {
      text = 'ARRAY_REMOVE(' + columnName + ', ' + this.getParamIndex(val) + ')';
    } else if(op == '$cat') {
      text = 'ARRAY_CAT(' + columnName + ', ' + this.getParamIndex(val) + ')';
    } else if(op == '$default') {
      text = 'DEFAULT';
    }
    return text;
  }

  resolveConditions(conditions, mymodel){

    let modConds;
    // console.log('conditions',conditions)
    if(conditions.condition && conditions.rules) {
      modConds = {};
      // parse front
      modConds.$type = conditions.condition == 'AND' ? 'and' : 'or';
      for (let i = 0; i < conditions.rules.length; i++) {
        const element = conditions.rules[i];
        if(conditions.rules[i].condition && conditions.rules[i].rules) {
          let con = conditions.rules[i].condition == 'AND' ? '$and' : '$or';
          // delete conditions.rules[i].condition;
          // console.log(conditions.rules[i])
          modConds[con + i] = conditions.rules[i];
        } else {

          let fvalue = conditions.rules[i].value;

          if(!this.idToName[conditions.rules[i].id]) throw 'resolveConditions(conditions, mymodel) not id ' + conditions.rules[i].id;

          conditions.rules[i].id = this.idToName[conditions.rules[i].id].join('.');

          if(conditions.rules[i].requestParam) fvalue = '$' + conditions.rules[i].requestParam;

          let full_name = conditions.rules[i].id;

          if(conditions.rules[i].operator == 'equal') modConds[full_name] = {['$eq' + i]: fvalue};
          else if(conditions.rules[i].operator == 'not_equal') modConds[full_name] = {['!$eq' + i]: fvalue};
        }
      }
      
    } else {

      conditions = this.addSchemaToObKeys(conditions, mymodel, mymodel.q.as);

    }
    // console.log(modConds)
    
    // if(modConds) conditions = modConds
    let finalConds = modConds ? modConds : conditions;

    // console.log('&*&*&*&*&*&*&*&* BEFORE', conditions)
    // console.log('&*&*&*&*&*&*&*&* AFTER', finalConds)
    let type = finalConds.$type && finalConds.$type.indexOf('or') > -1 ? ' OR ' : ' AND ';
    let keys = Object.keys(finalConds);
    let text = '';
    // console.log(keys)
    // if(keys.length == 3) {
    //   let foundCondi = false, foundValid = false, foundRules = false;
    //   if(keys[0].indexOf('.condition') > -1 || keys[1].indexOf('.condition') > -1 || keys[2].indexOf('.condition') > -1) foundCondi = true;
    //   if(keys[0].indexOf('.rules') > -1 || keys[1].indexOf('.rules') > -1 || keys[2].indexOf('.rules') > -1) foundRules = true;
    //   if(keys[0].indexOf('.valid') > -1 || keys[1].indexOf('.valid') > -1 || keys[2].indexOf('.valid') > -1) foundValid = true;
    //   if(foundCondi && foundValid && foundRules) return text;
    // }
    for (let i = 0; i < keys.length; i++) {
      if(keys[i] == '$exists') {
        text += ' EXISTS ( ' + this.select(finalConds[keys[i]], true) + ' ) ';
      } else if(keys[i] == '$!exists') {
        text += ' NOT EXISTS ( ' + this.select(finalConds[keys[i]], true) + ' ) ';
      } else if(keys[i].indexOf('$or') > -1 || keys[i].indexOf('$and') > -1) {
        let nestedConditions = finalConds[keys[i]];
        nestedConditions.$type = keys[i];
        text += ' ( ' + this.resolveConditions(nestedConditions, mymodel) + ' ) ';
      } else if(keys[i].charAt(0) != '$') {
        text += ' ( ' + this.resolveOperators(keys[i], finalConds[keys[i]], mymodel.constructor.properties.schema_name + '.' + mymodel.constructor.properties.table_name + '.' + keys[i].split('.').pop()) +' ) ';
      } else if(keys[i].indexOf('$raw') > -1) {
        text += ' ' + finalConds[keys[i]] + ' ';
      } else {
        continue;
      }
      if(i != keys.length - 1) text += type;
    }
    return text;
  }

  getParamMapIndex(val){

    if(!this.paramMap) this.paramMap = {};
    if(!this.paramMapIndex) this.paramMapIndex = 0;
    if(this.paramMap[val]) return this.paramMap[val];
    ++this.paramMapIndex;
    this.paramMap[val] = '$' + this.paramMapIndex;
    return this.paramMap[val];

  }

  resolveOperators(columnName, operator, realcname){
    // console.log('resolveOperators', columnName, operator, realcname)
    let pgtype = this.getType(realcname);
    let optype = typeof operator;
    // console.log(pgtype, optype)
    if (optype === 'string' || optype === 'number') {
      return ' ' + columnName + ' = ' + this.getParamIndex(operator);
    }
    if(pgtype == 'boolean') {
      if(operator) return columnName + ' IS TRUE ';
      else return columnName + ' IS NOT TRUE ';
    }
    if(optype == 'undefined') throw 'Operator cannot be undefined';
    if(operator.$param) return ' ' + columnName + ' = ' + this.getParamIndex(operator.$param) + ' ';
    let keys = Object.keys(operator);
    // console.log(keys)
    let type = operator.$type && operator.$type.indexOf('or') > -1 ? ' OR ' : ' AND ';
    let text = ' ';
    // console.log('start for loop')
    for (let i = 0; i < keys.length; i++) {
      // console.log(operator[keys[i]], keys[i])
      // if(!operator[keys[i]] || keys[i] == '$type') continue;

      if((!operator[keys[i]] && typeof operator[keys[i]] == 'object') || keys[i] == '$type') continue;
      let opkey = keys[i];
      let val;
      if(typeof operator[keys[i]] == 'object' && (operator[keys[i]].model)) {
        // console.log(1)
        // model
        if(operator[keys[i]].q.method != 'select' && operator[keys[i]].generatedQuery) {
          val = '(SELECT ' + operator[keys[i]].toReturn + ' FROM ' + operator[keys[i]].queryAlias + ')';
        } else {
          val = operator[keys[i]];
        }
      } else if(keys[i] == '$ident'|| keys[i] == '$null' || keys[i] == '$rawqin' || keys[i] == '$in' || keys[i] == '$!in') {
        // console.log(2)
        val = operator[keys[i]];
      } else if(typeof operator[keys[i]] == 'string' && (operator[keys[i]].indexOf('$req.body.') > -1 || operator[keys[i]].indexOf('$req.body.') > -1)){
        // console.log(3)
        val = getParamMapIndex(operator[keys[i]]);
      } else {
        // console.log(4)
        val = this.getParamIndex(operator[keys[i]]);
      }

      if (keys[i].indexOf('$gt') > -1) text += this.wrapType(columnName, realcname) + ' > ' + val;
      else if (keys[i].indexOf('$lt') > -1) text += this.wrapType(columnName, realcname) + ' < ' + val;
      else if (keys[i].indexOf('$eq') > -1) text += this.wrapType(columnName, realcname) + ' = ' + val;
      else if (keys[i].indexOf('$!eq') > -1) text += this.wrapType(columnName, realcname) + ' != ' + val;
      else if (keys[i] === '$ident') text += this.wrapType(columnName, realcname) + ' = ' + operator[keys[i]];
      else if (keys[i].indexOf('$cilike') > -1) text += 'LOWER(' + this.wrapType(columnName, realcname) + ') ~ LOWER(' + val + ')';
      else if (keys[i].indexOf('$like') > -1) text += this.wrapType(columnName, realcname) + ' ~ ' + val;
      else if (keys[i].indexOf('$cnq') > -1) text += this.wrapType(columnName, realcname) + ' @> ARRAY[(' + this.select(operator[keys[i]], true) + ')]';
      else if (keys[i].indexOf('$cnbq') > -1) text += this.wrapType(columnName, realcname, true) + ' <@ ARRAY[(' + this.select(operator[keys[i]], true) + ')]';
      else if (keys[i].indexOf('$cnb') > -1) text += this.wrapType(columnName, realcname, true) + ' <@ ' + (val.indexOf('$') > -1 ? val : 'ARRAY[' + val + ']') + '::' + pgtype + '[]';
      else if (keys[i].indexOf('$!cnb') > -1) text += ' NOT (' + this.wrapType(columnName, realcname, true) + ' <@ ' + val + '::' + pgtype + '[]) ';
      else if (keys[i].indexOf('$cn') > -1) text += this.wrapType(columnName, realcname) + ' @> ' + val + '::' + pgtype;
      else if (keys[i].indexOf('$!cn') > -1) text += ' NOT (' + this.wrapType(columnName, realcname) + ' @> ' + val + '::' + pgtype + ') ';
      else if (keys[i].indexOf('$inq') > -1) text += this.wrapType(columnName, realcname) + ' IN (' + this.select(operator[keys[i]], true) + ')';
      else if (keys[i].indexOf('$!inq') > -1) text += this.wrapType(columnName, realcname) + ' NOT IN (' + this.select(operator[keys[i]], true) + ')';
      else if (keys[i].indexOf('$in') > -1) text += this.wrapType(columnName, realcname) + ' IN ' + '(' + val.join(',') + ')';
      else if (keys[i].indexOf('$!in') > -1) text += this.wrapType(columnName, realcname) + ' NOT IN ' + '(' + val.join(',') + ')';
      else if (keys[i] === '$null') operator[keys[i]] ? text += this.wrapType(columnName, realcname) + ' IS NULL' : text += this.wrapType(columnName, realcname) + ' IS NOT NULL ';
      else if (keys[i] === '$rawqin') text += columnName + ' IN ' + operator[keys[i]];
      else if (keys[i] === '$rcn') text += this.wrapType(columnName, realcname) + ' @> ' + val + '::' + pgtype;
      else if (keys[i] === '$rcnb') text += this.wrapType(columnName, realcname) + ' <@ ' + val + '::' + pgtype;
      else if (keys[i] === '$overlap') text += this.wrapType(columnName, realcname) + ' && ' + val + '::' + pgtype + '[]';
      else continue;
      if (i < (keys.length - 1)) text += type;
    }
    return text;
  }

  stripNull(arr){
    let a = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]) a.push(arr[i]);
    }
    return a;
  }

  QUOTE_LITERAL(v){
    v = " '" + v + "' ";
    return v;
  }

  addSchemaToObKeys(colob, model, as){
    if(!colob) return null;
    let o = {};
    let keys = Object.keys(colob);
    if(as) {
      for (let i = 0; i < keys.length; i++) {
        o[this.identAlias(as) + '.' + keys[i]] = colob[keys[i]];
      }
      return o;
    }
    let li = keys.length;
    for (let i = 0; i < li; i++) {
      if(keys[i].indexOf('$raw') > -1 || keys[i].indexOf('$rawqin') > -1 || keys[i].indexOf('exists') > -1 || keys[i].indexOf('$type') > -1) {
        o[keys[i]] = colob[keys[i]]
        continue;
      } else if(keys[i].substr(0, 1) == '$') {
        // condtions
        o[keys[i]] = this.addSchemaToObKeys(colob[keys[i]], model, as);
        continue;
      }
      let spl = keys[i].split('.').length;
      if(spl == 1) o[model.constructor.properties.schema_name + '.' + model.constructor.properties.table_name + '.' + keys[i]] = colob[keys[i]];
      else if(spl == 2) o[model.constructor.properties.schema_name + '.' + keys[i]] = colob[keys[i]];
      else if(spl == 3) o[keys[i]] = colob[keys[i]];
    }
    return o;
  }

  wrapType(columnName, realcname, arr) {
    let t = this.getType(realcname);
    if(arr && t.indexOf('[]') == -1) return ' ARRAY[' + columnName + ']::' + t + '[] ';
    return columnName + '::' + t;
  }

  getType(columnName){
    // console.log(columnName);
    let c = columnName.split('.');
    return this.allmodels[c[0]][c[1]].properties.columns[c[2]].type.toLowerCase();
  }

  identAlias(alias){
    return '"' + alias + '"';
  }

  deepCopy(a){
    return JSON.parse(JSON.stringify(a));
  }

  makeid(len) {
    len = len + 2;
    let text = "a";
    let possible = "1bc62de3f23gh4ij5k_0_lmno231pq6rst7uvw864xy9z";

    for(let i=0; i < len; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

};
