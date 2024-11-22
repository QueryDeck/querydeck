'use strict';
const MYSQL = 'MySQL'

exports.haveMany = function(path, allmodels) {
  if(!Array.isArray(path)) return false;
  for (let i = 1; i < path.length; i = i + 2) {
    let c1 = this.idToName[path[i - 1]];
    let c2 = this.idToName[path[i]];
    let rel = this.determineRelation(c1, c2);
    if(rel == 'm-n' || rel == '1-m') return true;
  }
  return false;
};

exports.determineRelation = function(spl1, spl2, allmodels){
  // TODO  : check correct changes
  let c1 = spl1.join('.'); let c2 = spl2.join('.');
  if(this.allmodels[spl1[0]][spl1[1]].properties.relations[spl1[2]] != c2 && c1 != this.allmodels[spl2[0]][spl2[1]].properties.relations[spl2[2]]) return null;
  let spl1unique = this.checkIfTrulyUnique(spl1);
  let spl2unique = this.checkIfTrulyUnique(spl2);
  if(spl1unique && spl2unique) {
    // one to one
    return '1-1';
  } else if(spl1unique || spl2unique) {
    // one to many / many to one
    return spl1unique ? '1-m' : 'm-1';
  } 
  // many to many
  return 'm-n';
};

let ts_granularity = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];

exports.getDummyValue = function(pgType) {
  // Normalize type by converting to lowercase and removing any length specifiers

  const normalizedType = pgType.toLowerCase().split('(')[0].trim();
  
  // Handle array types
  if (normalizedType.endsWith('[]')) {
    const baseType = normalizedType.slice(0, -2);
    return [this.getDummyValue(baseType), this.getDummyValue(baseType)]; // Return array with 2 dummy values
  }

  // Handle range types
  if (normalizedType.startsWith('int4range') || normalizedType.startsWith('int8range') || 
      normalizedType.startsWith('numrange') || normalizedType.startsWith('tsrange') || 
      normalizedType.startsWith('tstzrange') || normalizedType.startsWith('daterange')) {
    const baseType = normalizedType.replace('range', '');
    const start = this.getDummyValue(baseType);
    const end = this.getDummyValue(baseType);
    return `[${start},${end}]`; // Return range format
  }

  if(normalizedType.indexOf('char') > -1) {
    return 'sample';
  }

  // Handle different postgres types
  switch (normalizedType) {
    // Numeric types
    case 'integer':
    case 'int':
    case 'int2':
    case 'int4':
    case 'int8':
    case 'smallint':
    case 'bigint':
    case 'tinyint':
      return 1;
    
    case 'decimal':
    case 'numeric':
    case 'real':
    case 'double precision':
    case 'float4':
    case 'float8':
      return 1.23;

    // Text types
    case 'char':
    case 'character':
    case 'varchar':
    case 'text':
    case 'tsvector':
    case 'citext':
      return 'sample';

    // Boolean
    case 'boolean':
    case 'bool':
      return true;

    // Date/Time types
    case 'date':
      return '2023-01-01';
    case 'time':
      return '12:00:00';
    case 'timestamp':
    case 'timestamptz':
    case 'timestamp without time zone':
    case 'timestamp with time zone':
      return '2023-01-01 12:00:00';
    case 'interval':
      return '1 hour';

    // JSON types
    case 'json':
    case 'jsonb':
      return {key: 'value'};

    // UUID
    case 'uuid':
      return '123e4567-k89b-e2d3-l456-a26614174000';

    // Network address types
    case 'inet':
      return '192.168.0.1';
    case 'cidr':
      return '192.168.0.0/24';
    case 'macaddr':
      return '08:00:2b:01:02:03';

    // Geometric types
    case 'point':
      return '(1,1)';
    case 'line':
      return '{1,-1,0}';
    case 'box':
      return '((1,1),(2,2))';
    case 'circle':
      return '<(0,0),1>';

    // Money
    case 'money':
      return '$1.23';

    // XML
    case 'xml':
      return '<tag>value</tag>';

    // Default for unknown types
    default:
      return null;
  }
};

const pg_types = [
  {
    name: 'number',
    types: ['integer', 'smallint', 'bigint', 'tinyint', 'numeric', 'int', 'int8', 'double precision', 'float8', 'decimal', 'int4', 'int2', 'real', 'float4'],
    comparison: [
      {symbol: '=', value: "equal",name: 'equal to' },
      {symbol: '!=', value: "not_equal", name: 'not equal to'},
      {symbol: '<', value: "less_than", name: 'less than'},
      {symbol: '>', value: "greater_than", name: 'greater than'},
      {symbol: '>=', value: "greater_or_equal", name: 'greater than or equal to'},
      {symbol: '<=', value: "less_or_equal", name: 'less than or equal to'},
      {symbol: 'IS NULL',value: "is_empty", rhs: false},
      {symbol: 'IS NOT NULL', value: "is_not_empty",rhs: false},
    ]
  },
  // {
  //   name: 'number[]',
  //   types: ['integer[]', 'smallint[]', 'bigint[]', 'tinyint[]', 'numeric[]', 'int[]', 'int8[]', 'double precision[]', 'float8[]', 'decimal[]', 'int4[]', 'int2[]', 'real[]', 'float4[]'],
  //   comparison: [
  //     {symbol: '@>', value: "contains", name: 'contains'},
  //     {symbol: '<@', value: "contained_by", name: 'contained by'},
  //     {symbol: '&&', value: "overlaps", name: 'overlaps'},
  //     {symbol: 'IS NULL',value: "is_empty", rhs: false},
  //     {symbol: 'IS NOT NULL', value: "is_not_empty",rhs: false},
  //   ]
  // },
  // {
  //   name: 'text[]',
  //   types: ['text[]', 'char[]', 'varchar[]', 'character[]', 'citext[]'],
  //   comparison: [
  //     {symbol: '@>', value: "contains", name: 'contains'},
  //     {symbol: '<@', value: "contained_by", name: 'contained by'}, 
  //     {symbol: '&&', value: "overlaps", name: 'overlaps'},
  //     {symbol: 'IS NULL', value: "is_empty", rhs: false},
  //     {symbol: 'IS NOT NULL', value: "is_not_empty", rhs: false},
  //   ]
  // },
  {
    name: 'text',
    types: ['text', 'char', 'letchar', 'citext', 'tsvector' , 'mpaa_rating' ,'character' ,  'varchar'  ],
    comparison: [
      {symbol: '=', 	value: "equal" , name: 'equal to'},
      {symbol: '!=', 	value: "not_equal" , name: 'not equal to'},
      {symbol: '~', 	value: "regex" , name: 'regex'},
      {symbol: '!~', 	value: "not_regex" , name: 'not regex'},
      {symbol: 'ILIKE', 	value: "ilike" , name: 'like'},
      {symbol: 'NOT ILIKE', 	value: "not_ilike" , name: 'not like'},
      {symbol: 'LIKE', 	value: "like" , name: 'like(case sensitive)'},
      {symbol: 'NOT LIKE', 	value: "not_like" , name: 'not like(case sensitive)'},
      {symbol: 'IS NULL', 	value: "is_empty" , rhs: false},
      {symbol: 'IS NOT NULL', 	value: "is_not_empty" , rhs: false},
    ]
  },
  {
    name: 'boolean',
    types: ['bool', 'boolean'],
    comparison: [
      {symbol: '=', 	value: "equal" , name: 'equal to'},
      {symbol: '!=', 	value: "not_equal" , name: 'not equal to'},
      {symbol: 'IS TRUE',  value: "is_true", rhs: false},
      {symbol: 'IS FALSE',  value: "is_false", rhs: false},
      {symbol: 'IS NOT TRUE',  value: "is_not_true", rhs: false},
      {symbol: 'IS NOT FALSE',  value: "is_not_false", rhs: false},
      {symbol: 'IS NULL',  value: "is_empty", rhs: false},
      {symbol: 'IS NOT NULL',  value: "is_not_empty", rhs: false},
    ]
  }, 
  {
    name: 'datetime',
    types: ['datetime'  ],
    comparison: [
      {symbol: '=', value: "equal",name: 'equal to' },
      {symbol: '!=', value: "not_equal", name: 'not equal to'},
      {symbol: '<', value: "less_than", name: 'less than'},
      {symbol: '>', value: "greater_than", name: 'greater than'},
      {symbol: '>=', value: "greater_or_equal", name: 'greater than or equal to'},
      {symbol: '<=', value: "less_or_equal", name: 'less than or equal to'},
      {symbol: 'IS NULL',  value: "is_empty", rhs: false},
      {symbol: 'IS NOT NULL',  value: "is_not_empty", rhs: false},
    ]
  }, 
  {
    name: 'date',
    types: ['date' ],
    comparison: [
      {symbol: '=', value: "equal",name: 'equal to' },
      {symbol: '!=', value: "not_equal", name: 'not equal to'},
      {symbol: '<', value: "less_than", name: 'less than'},
      {symbol: '>', value: "greater_than", name: 'greater than'},
      {symbol: '>=', value: "greater_or_equal", name: 'greater than or equal to'},
      {symbol: '<=', value: "less_or_equal", name: 'less than or equal to'},
      {symbol: 'IS NULL',  value: "is_empty", rhs: false},
      {symbol: 'IS NOT NULL',  value: "is_not_empty", rhs: false},
    ]
  }, 
  {
    name: 'time',
    types: [ 'time' ],
    comparison: [
      {symbol: '=', value: "equal",name: 'equal to' },
      {symbol: '!=', value: "not_equal", name: 'not equal to'},
      {symbol: '<', value: "less_than", name: 'less than'},
      {symbol: '>', value: "greater_than", name: 'greater than'},
      {symbol: '>=', value: "greater_or_equal", name: 'greater than or equal to'},
      {symbol: '<=', value: "less_or_equal", name: 'less than or equal to'},
      {symbol: 'IS NULL',  value: "is_empty", rhs: false},
      {symbol: 'IS NOT NULL',  value: "is_not_empty", rhs: false},
    ]
  }, 
  {
    name: 'timestamp',
    types: ['timestamp', 'timestamp without time zone', 'timestamp with time zone' ],
    comparison: [
      {symbol: '=', value: "equal",name: 'equal to' },
      {symbol: '!=', value: "not_equal", name: 'not equal to'},
      {symbol: '<', value: "less_than", name: 'less than'},
      {symbol: '>', value: "greater_than", name: 'greater than'},
      {symbol: '>=', value: "greater_or_equal", name: 'greater than or equal to'},
      {symbol: '<=', value: "less_or_equal", name: 'less than or equal to'},
      {symbol: 'IS NULL',  value: "is_empty", rhs: false},
      {symbol: 'IS NOT NULL',  value: "is_not_empty", rhs: false},
    ]
  }, 
  {
    name: 'year',
    types: ['year'  ],
    comparison: [
      {symbol: '=', value: "equal",name: 'equal to' },
      {symbol: '!=', value: "not_equal", name: 'not equal to'},
      {symbol: '<', value: "less_than", name: 'less than'},
      {symbol: '>', value: "greater_than", name: 'greater than'},
      {symbol: '>=', value: "greater_or_equal", name: 'greater than or equal to'},
      {symbol: '<=', value: "less_or_equal", name: 'less than or equal to'},
      {symbol: 'IS NULL',  value: "is_empty", rhs: false},
      {symbol: 'IS NOT NULL',  value: "is_not_empty", rhs: false},
    ]
  }
  
];


let mysql_types = [
  {
    name: 'number',
    types: ['tinyint','mediumint','float','integer', 'smallint', 'bigint', 'numeric', 'int', 'int8', 'double precision', 'float8', 'decimal', 'int4', 'int2', 'real', 'float4'],
    comparison: [
      {symbol: '=', name: 'equal to'},
      {symbol: '!=', name: 'not equal to'},
      {symbol: '<', name: 'less than'},
      {symbol: '>', name: 'greater than'},
      {symbol: '>=', name: 'greater than or equal to'},
      {symbol: '<=', name: 'less than or equal to'},
      {symbol: 'IS NULL', rhs: false},
      {symbol: 'IS NOT NULL', rhs: false},
    ],
    functions: []
  },
  {
    name: 'text',
    types: ['text', 'char', 'letchar', 'citext'],
    comparison: [
      {symbol: '=', name: 'equal to'},
      {symbol: '!=', name: 'not equal to'},
      {symbol: 'REGEXP', name: 'regex'},
      {symbol: 'NOT REGEXP', name: 'not regex'},
      {symbol: 'LIKE', name: 'like'},
      {symbol: 'NOT LIKE', name: 'not like'},
      {symbol: 'LIKE BINARY', name: 'like(case sensitive)'},
      {symbol: 'NOT LIKE BINARY', name: 'not like(case sensitive)'},
      {symbol: 'IS NULL', rhs: false},
      {symbol: 'IS NOT NULL', rhs: false},
    ]
  },
  {
    name: 'boolean',
    types: [ 'boolean' ],
    comparison: [
      {symbol: 'IS TRUE', rhs: false},
      {symbol: 'IS FALSE', rhs: false},
      {symbol: 'IS NOT TRUE', rhs: false},
      {symbol: 'IS NOT FALSE', rhs: false},
      {symbol: 'IS NULL', rhs: false},
      {symbol: 'IS NOT NULL', rhs: false},
    ]
  },
 
  {
    name: 'datetime',
    types: ['date', 'datetime' , 'time' ,'timestamp' ,'year' ,'timestamp without time zone' ],
    comparison: [
      {symbol: '=', name: 'equal to'},
      {symbol: '!=', name: 'not equal to'},
      {symbol: '<', name: 'less than'},
      {symbol: '>', name: 'greater than'},
      {symbol: '>=', name: 'greater than or equal to'},
      {symbol: '<=', name: 'less than or equal to'},
      {symbol: 'IS NULL', rhs: false},
      {symbol: 'IS NOT NULL', rhs: false},
    ]
  }
];

let all_merged_types = getAllMegedTypes (); 



let pg_chart_agg_fn = [
  'avg', 'count', 'max', 'min', 'sum'
];


let agg_fn_operations = {                  
  "text":  [ "row count"],
  "number":  [ "avg", "row count", "max","min", "sum"],
  "boolean":  [ "avg", "row count", "max","min", "sum"],
  "datetime":  [   "row count", "max","min",  ],
}

let formSupportedTypes = {
  // 'number', 'datetime','boolean','text'
  "text":  "string",
  "datetime":  "datetime",
  "number":  "number",
  "integer":  "integer",
  "boolean":  "boolean",
}
let formSupportedTypes2 = [
  {
    name: 'integer',
    types: new Set(["integer", "smallint", "bigint", "tinyint", "int", "int8", "int4", "int2", "mediumint",]),
    validation: {
      regex: '^[-+]?(0|[1-9][0-9]*)$',
      message: 'Only Integers allowed'
    }
  },
  {
    name: 'number',
    types: new Set([...pg_types[0].types, ...mysql_types[0].types, 'number']),
    validation: {
      regex: '^[-+]?[0-9]+\.[0-9]+$',
      message: 'Only numeric characters allowed'
    }
  },

  {  // default type 
    name: 'text',
    types: new Set([...pg_types[1].types, ...mysql_types[1].types]),
    validation: {
      regex: '',
      message: ''
    }
  },


]

function getSuperType(t, db_type) {
  // TODO: filter datatypes using db_types for different db
  // t = t.toLowerCase();
  // TOdo fileter according database type Mysql /postgres 
  // console.log( "getSuperType ",t, "DB_TYPE ", db_type)
  t = t.toLowerCase(); 
  let datatypes  = db_type == MYSQL ? mysql_types : pg_types ; 
  for (let i = 0; i < datatypes.length; i++) {
    // const element = datatypes[i];
    if(datatypes[i].types.indexOf(t) > -1) return datatypes[i].name;
  }
  // console.log( t.search(/numeric\(*/))
  if(t.search(/numeric\(*/)>=0){ 
    // numeric( 
    return getSuperType("integer", db_type);
  }

  /* Text Types  */
  let startWithTextTypes = [ 'character varying' ,'character','char','varchar']
  for (let i = 0; i < startWithTextTypes.length; i++) {
    if(t.startsWith(startWithTextTypes[i]) ) return getSuperType("text", db_type); 
  }
   

  if(t.startsWith('timestamp')){  
    return getSuperType("timestamp", db_type);
  }

  if(t.startsWith('time')){  
    return getSuperType("datetime", db_type);
  }
 
  
  // console.log( "Data_Type  -------> ", t, db_type)
}
// console.log("return data type:= "  +  getSuperType("numeric(") )

function getFormSupportedType(t, db_type) {
  if(formSupportedTypes[ t] ) return formSupportedTypes[ t];
  return formSupportedTypes [ getSuperType (t, db_type) ] || 'string'
}

function getFormSupportedType2(t, db_type) {
  for (let i = 0; i < formSupportedTypes2.length -1 ; i++) {
    if (formSupportedTypes2[i].types.has(t)  || formSupportedTypes2[i].types.has( getSuperType (t, db_type)) ) return formSupportedTypes2[i];
  }
  return formSupportedTypes2[formSupportedTypes2.length - 1]   // return default as type

}

let translate_old = {
  'equal': '$eq',
  'not_equal': '$!eq',
  'less_than': '$lt',
  'less_or_equal': '$lte',
  'greater_than': '$gt',
  'greater_or_equal': '$gte',
  'is_null': '$null',
  'is_not_null': '$!null',
  'is_true': '$true',
  'is_not_true': '$!true',
  'is_false': '$false',
  'is_not_false': '$!false'
};

let translate_new = {
  '=': '$eq',
  '!=': '$!eq',
  '<': '$lt',
  '<=': '$lte',
  '>': '$gt',
  '>=': '$gte',
  '!': '$null',
  '!!': '$!null',
  'true': '$true',
  '!true': '$!true',
  'false': '$false',
  '!false': '$!false'
};

// some foreign keys on the conencting tables might share uindex (many to many)
function checkIfTrulyUnique(colarr, allmodels) {
  if(allmodels[colarr[0]][colarr[1]].properties.primary == colarr[2]) return true;
  let uindex = allmodels[colarr[0]][colarr[1]].properties.uindex[colarr[2]];
  if(!uindex) return false;
  let k = Object.keys(allmodels[colarr[0]][colarr[1]].properties.uindex);
  let klen = k.length;
  if(klen == 0) return false;
  if(klen == 1) return true;
  for (let i = 0; i < klen; i++) {
    // check for many to many
    if(k[i] != colarr[2] && allmodels[colarr[0]][colarr[1]].properties.uindex[k[i]] == uindex) return false;
  }
  return true;
}

function istimeseriescol(name, type) {
  // console.log(name, type);
  if(type.indexOf('timestamp') > -1 || type == 'date') return true;
  if(type.match(/integer|bigint/) && name.toLowerCase().match(/created_at|createdat|updated_at|updatedat|create_time|createtime|update_time|updatetime|unix/)) return true;
  return false;
}

function gettimeseriestype(name, type) {
  //TODO : add type check  for Mysql 
  if(type == 'date'  ) return {max_gran: 'day', type: 'date'};
  if(type.indexOf('timestamp') > -1   || type == 'datetime' || type == 'time' ) return {max_gran: 'second', type: type};
  // if(  name.toLowerCase().match(/created_at|createdat|updated_at|updatedat|create_time|createtime|update_time|updatetime|unix/)) {
    if(type.match(/integer/)) return {max_gran: 'second', type: 'unixs'};
    else if(type.match(/bigint/)) return {max_gran: 'second', type: 'unixms'};
  // }
  return null;
}

function getAllMegedTypes () {
  let result_types = []; 
   for( let i = 0; i<pg_types.length; i++ ){
    // if(pg_types[i].name !== mysql_types[i].name ){
    //   throw new Error( 'mismatch types name')
    // }
    let currObj =  {
      // name : pg_types[i].name.charAt(0).toUpperCase() + pg_types[i].name.slice(1),  // make first letter captalize 
      name : pg_types[i].name, 
      types :[...( new Set( [...pg_types[i].types] )) ]  // make types unique  
    }
    // if(currObj.name == 'Datetime' ) currObj.name = 'DateTime' ;
    result_types.push(currObj)
   }


   return result_types ; 
}


function getUnlistedTypes(currentModel, subdomain, db_id) {
  let resultObj = {
    db_id: db_id,
    subdomain: subdomain,
    remainingTypes: {}
  }

  // let currentModel = modelManager.models[subdomain].databases[db_id];
  let schemas = Object.keys(currentModel.models);
  for (let index = 0; index < schemas.length; index++) {


    if (schemas[index] == 'tidToName' || schemas[index] == 'idToName') continue;
    let schemaName = schemas[index]

    let currTableKeys = Object.keys(currentModel.models[schemaName])
    for (let i = 0; i < currTableKeys.length; i++) {
      const tableName = currTableKeys[i];
 
      let tableColumns = currentModel.models[schemaName][tableName].properties.columns;
      let tableColumnsKeys = Object.keys(tableColumns);
 
      for (let j = 0; j < tableColumnsKeys.length; j++) {

        if (!getSuperType(tableColumns[tableColumnsKeys[j]].type, currentModel.db_type)) {

          if (!resultObj.remainingTypes[schemaName]) resultObj.remainingTypes[schemaName] = [];

          resultObj.remainingTypes[schemaName].push({
            columnName: tableColumnsKeys[j],
            type: tableColumns[tableColumnsKeys[j]].type,
            tableName: tableName,
            schemaName: schemaName,

          })
        }


      }
    }
  }
 
  return resultObj
}

function formatTsDate(rows, db_type, ts_gran) {


  let d;
  // let ts_gran = 'minute'
  let result;
  let lang = 'en-US';
  // let opt
  // second: 12 Feb 10:16:34 pm
  // minute: 12 Feb 10:16 pm
  // hour: 12 Feb 10 pm
  // day: Sun, 12 Feb 2023
  // week: 12 Feb 2023
  // month: Feb 2023
  // year: 2023
  // date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),

  //['second','minute','hour','day','week','month','year']; 

  for (let i = 0; i < rows.length; i++) {
    d = new Date(rows[i].tp);
    d.L = d.toLocaleDateString;
    d.T = d.toLocaleTimeString
    if (ts_gran == 'second') {
      result = `${d.L(lang, { day: '2-digit' })} ${d.L(lang, { month: 'short' })} ${d.T(lang, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
    }
    else if (ts_gran == 'minute') {
      result = `${d.L(lang, { day: '2-digit' })} ${d.L(lang, { month: 'short' })} ${d.T(lang, { hour: "2-digit", minute: "2-digit" })}`;
    }
    else if (ts_gran == 'hour') {
      result = `${d.L(lang, { day: '2-digit' })} ${d.L(lang, { month: 'short' })} ${d.T(lang, { hour: "2-digit" })}`;
    }
    else if (ts_gran == 'day') {
      result = `${d.L(lang, { weekday: "short" })}, ${d.L(lang, { day: '2-digit' })} ${d.L(lang, { month: 'short', year: 'numeric' })}`;
    }
    else if (ts_gran == 'week') {
      result = `${d.L(lang, { day: '2-digit' })} ${d.L(lang, { month: 'short', year: 'numeric' })}`;
    }
    else if (ts_gran == 'month') {
      result = `${d.L(lang, { month: 'short', year: 'numeric' })}`;
    }
    else if (ts_gran == 'year') {
      result = `${d.L(lang, { year: 'numeric' })}`;
    }

    // rows[i].tp_unformat = rows[i].tp;
    if( result)  rows[i].tp = result;
  }
  // }
}

function getEnumOptions(path_id, models) {
  let result = [];

  let baseTableId = path_id.split("-")[0].split(".")[0]
  let tableId = path_id.split("-").pop().split('.')[0];   //15575134 
  let isJoinTable = false;
  let tableIdPath = path_id.split("$")[0];  // 15575122.1-15575134.2
  if (path_id.indexOf('-') > -1) {
    isJoinTable = true;
  }
  else {
    tableIdPath = tableIdPath.split(".")[0];
  }

  let tablePath = models.tidToName[tableId]
  let properties = models[tablePath[0]][tablePath[1]].properties;
  let relations = models[tablePath[0]][tablePath[1]].properties.relations
  let referencedBy = models[tablePath[0]][tablePath[1]].properties.referencedBy

  {
    /*   ### insert all 1 degree enums ###  */
    let relations_keys = Object.keys(relations);
    for (let i = 0; i < relations_keys.length; i++) {
      // const element = relations_keys[i];
      let enum_key_split = relations[relations_keys[i]].split('.');
      let enum_key_properties = models[enum_key_split[0]][enum_key_split[1]].properties;

      let dataObj = {
        name: relations_keys[i] + '_' + enum_key_split[1],
        id: null,

        column_id: properties.id + "." + properties.columns[relations_keys[i]].id,
        column_full_name: tablePath[0] + "." + tablePath[1] + "." + relations_keys[i],
        type: 'single',
        key: enum_key_split[0] + "." + enum_key_split[1] + "." + enum_key_split[2],
        key_id: enum_key_properties.id + "." + enum_key_properties.columns[enum_key_split[2]].id,
        key_path: null,
        // value: "user_selection" , 
      }
      if (isJoinTable) {
        dataObj.id = tableIdPath + "$" + properties.columns[relations_keys[i]].id;
        dataObj.key_path = tableIdPath + "-" + dataObj.column_id + "-" + dataObj.key_id + "$" + enum_key_properties.columns[enum_key_split[2]].id;
      }
      else {
        dataObj.id = tableIdPath + '.' + properties.columns[relations_keys[i]].id;
        dataObj.key_path = + dataObj.column_id + "-" + dataObj.key_id + "$" + enum_key_properties.columns[enum_key_split[2]].id;
      }

      result.push(dataObj);

    }
  }

  /*   ### insert all 2 degree enums ###  */
  let referencedBy_keys = Object.keys(referencedBy);

  for (let i = 0; i < referencedBy_keys.length; i++) {
    let refInCols = referencedBy[referencedBy_keys[i]];
    // let referencedBy_keys_col_split = referencedBy_keys
    for (let j = 0; j < refInCols.length; j++) {
      let refInCol_split = refInCols[j].split(".");
      let refInCol_properties = models[refInCol_split[0]][refInCol_split[1]].properties;
      let refInCol_relations = models[refInCol_split[0]][refInCol_split[1]].properties.relations;
      let refInCol_relations_keys = Object.keys(models[refInCol_split[0]][refInCol_split[1]].properties.relations);
      for (let k = 0; k < refInCol_relations_keys.length; k++) {
        if (refInCol_relations_keys[k] ===  referencedBy_keys[i]   ) continue; //skip self table reference 
        let refInCol_relations_keys_col_split = refInCol_relations_keys[k].split(".");
        let enum_key_split = refInCol_relations[refInCol_relations_keys[k]].split(".");
        let enum_key_properties = models[enum_key_split[0]][enum_key_split[1]].properties;
        if( baseTableId == enum_key_properties.id ) continue // skip circular path and reverse path 
        let dataObj = {
          name: refInCol_split[1] + '_' + enum_key_split[1],
          id: null,
          column_id: properties.id + "." + properties.columns[referencedBy_keys[i]].id,
          column_full_name: tablePath[0] + "." + tablePath[1] + "." + referencedBy_keys[i],
          type: 'multiple',
          key: enum_key_split[0] + "." + enum_key_split[1] + "." + enum_key_split[2],
          key_id: enum_key_properties.id + "." + enum_key_properties.columns[enum_key_split[2]].id,
          key_path: null,
          // value: "user_selection" , 
        }
        let refInCol_link_path = `${refInCol_properties.id}.${refInCol_properties.columns[refInCol_split[2]].id}-${refInCol_properties.id}.${refInCol_properties.columns[refInCol_relations_keys_col_split[0]].id}`;

        if (isJoinTable) {
          dataObj.id = tableIdPath + "$" + properties.columns[referencedBy_keys[i]].id;
          dataObj.key_path = tableIdPath + "-" + dataObj.column_id + "-" + refInCol_link_path + "-" + dataObj.key_id + "$" + enum_key_properties.columns[enum_key_split[2]].id;
        }
        else {
          dataObj.id = tableIdPath + '.' + properties.columns[referencedBy_keys[i]].id;
          dataObj.key_path = + dataObj.column_id + "-" + refInCol_link_path + "-" + dataObj.key_id + "$" + enum_key_properties.columns[enum_key_split[2]].id;
        }

        result.push(dataObj);

      }

    }
  }
  // if( path_id.indexOf("-") > -1){
  //   tableId = 
  // }


  return {
    // inputId: path_id,
    // tablePath: tableIdPath,
    tableId: tableId,
    tableName: tablePath.join('.'),
    enumOptions: result,
  };
}

function getAllAllowedPaths(columns) {
  let allowedPaths = new Set();
  for (let i = 0; i < columns.length; i++) {

    if (columns[i].id.indexOf("$") > -1) {
      allowedPaths.add(columns[i].id.split("$")[0])
    } else {
      allowedPaths.add(columns[i].id.split(".")[0])
    }

  }
  return [...allowedPaths] ;
}

function pathIdToId(path_id) {
  if( path_id.indexOf( "-") > -1 ){
    let id_split = path_id.split("-").pop().split("$"); 
    return  id_split[0].split(".")[0] + "." +id_split[1];   
  }
  return path_id
}

function checkAndAddPrimaryKey(columns, model) {

  let column_arr;
  let columnObj = {};
  let currTableId;
  let currColId;
  let id_split;
  let tableModel;

  for (let i = 0; i < columns.length; i++) {

    if (columns[i].id.indexOf("-") > -1) {
      id_split = columns[i].id.split("$");
      currTableId = id_split[0].split("-").pop().split(".")[0];
      currColId = currTableId + "." + id_split[1];
    }
    else {
      id_split = columns[i].id.split(".");
      currColId = columns[i].id;
      currTableId = id_split[0];
    }
    column_arr = model.idToName[currColId];
    if (columnObj[currTableId] === undefined) columnObj[currTableId] = { primary: false, tablePathId: id_split[0] };
    if (model[column_arr[0]][column_arr[1]].properties.columns[column_arr[2]].primary) columnObj[currTableId].primary = true;
  }
  let columnObj_keys = Object.keys(columnObj);
  for (let i = 0; i < columnObj_keys.length; i++) {

    if (columnObj[columnObj_keys[i]].primary === false) {
      column_arr = model.tidToName[columnObj_keys[i]];
      tableModel = model[column_arr[0]][column_arr[1]]
      let primary_key_arr = tableModel.properties.primary
      let symbol = columnObj[columnObj_keys[i]].tablePathId.indexOf("-") > -1 ? "$" : ".";
      if (!primary_key_arr.length) continue;

      let newCol = {
        id: columnObj[columnObj_keys[i]].tablePathId + symbol + tableModel.properties.columns[primary_key_arr[0]].id,
        label: primary_key_arr[0], 
        forced: true , 
      }
      
      columns.push(newCol)

    }

  }
  return columns;
}

function isRequiredColumn(columnData) {

  if ((columnData.not_null && columnData.default !== null)) return false;
  return columnData.not_null;
}


function getUniqueColumnData(tablePath, uindex, tableProperties) {
  tablePath = ""+tablePath; 
  let result = [];
  let uindex_keys = Object.keys(uindex);
  for (let i = 0; i < uindex_keys.length; i++) {
    let columnsData = [];
    let columns = uindex[uindex_keys[i]]
    for (let j = 0; j < columns.length; j++) {
      columnsData.push({
        id: tablePath + ( tablePath.includes("-") ? '$' : '.') + tableProperties.columns[columns[j]].id,
        text: columns[j],
      })
    }
    result.push({
      label: uindex_keys[i],
      columns: columns,
      columnsData,
    })

  }

  return result;
}


function formatPGTypesForFE () {
  let result_types = {}; 
   for( let i = 0; i<pg_types.length; i++ ){

    // if(pg_types[i].name === 'datetime' ){
    //   continue; 
    // }
    let currObj =  {
      types :  pg_types[i].types ,
      operators : pg_types[i].comparison.map((item)=> {
        let currOpObj = {
          "label":item.symbol,
          "value": item.value
        }
        if(item.rhs === false  ){
          currOpObj.disable_value = true 
        }
        return currOpObj;
      }) 
    }
    result_types[pg_types[i].name] = currObj
   }


   return result_types ; 
}

exports.formatTsDate = formatTsDate;
exports.gettimeseriestype = gettimeseriestype;
exports.istimeseriescol = istimeseriescol;
exports.pg_types = pg_types; 
exports.mysql_types = mysql_types; 
exports.all_merged_types = all_merged_types; 
exports.getUnlistedTypes = getUnlistedTypes; 

exports.pg_chart_agg_fn = pg_chart_agg_fn;
exports.ts_granularity = ts_granularity;
exports.getSuperType = getSuperType;
exports.getFormSupportedType = getFormSupportedType;
exports.getFormSupportedType2 = getFormSupportedType2;
exports.getEnumOptions = getEnumOptions;
exports.pathIdToId = pathIdToId;
exports.checkAndAddPrimaryKey = checkAndAddPrimaryKey;
exports.isRequiredColumn = isRequiredColumn;
// exports.isAutofillDatatype = isAutofillDatatype;

exports.getAllAllowedPaths = getAllAllowedPaths;
exports.agg_fn_operations = agg_fn_operations;
exports.pg_type_translate = translate_new;
exports.getUniqueColumnData = getUniqueColumnData;
exports.formatPGTypesForFE = formatPGTypesForFE;

