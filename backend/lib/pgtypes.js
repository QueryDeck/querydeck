'use strict';
var idMap = {
  text: {
    '1': 'text'
  },
  numbers: {
    '1': 'numeric',
    '2': 'double precision',
    '3': 'real',
    '4': 'integer',
    '5': 'smallint',
    '6': 'bigint'
  },
  arrays: {
    '1': 'text[]',
    '2': 'int[]',
    '3': 'bigint[]',
    '4': 'smallint[]'
  },
  ranges: {
    '1': 'int4range',
    '2': 'int8range',
    '3': 'numrange',
    '4': 'tsrange',
    '5': 'tstzrange',
    '6': 'daterange'
  },
  bool: 'boolean'
};

var functions = [
  {
    types: [idMap.numbers['1'], idMap.numbers['2'], idMap.numbers['3'], idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']],
    functions: [
      {id: 'abs', text: 'abs (absolute value)', enclose: ['abs(', ')'], args: [{type: '*', description: ''}]},
      {id: 'sqrt', text: 'sqrt (square root)', enclose: ['sqrt(', ')'], args: [{type: '*', description: ''}]},
      {id: 'cbrt', text: 'cbrt', enclose: ['cbrt(', ')'], args: [{type: '*', description: ''}]},
      {id: 'ceil', text: 'ceil', enclose: ['ceil(', ')'], args: [{type: '*', description: ''}]},
      {id: 'floor', text: 'floor', enclose: ['floor(', ')'], args: [{type: '*', description: ''}]},
      {id: 'degrees', text: 'degrees', enclose: ['degrees(', ')'], args: [{type: '*', description: ''}]},
      {id: 'abs', text: 'abs', enclose: ['abs(', ')'], args: [{type: '*', description: ''}]},
      {id: 'power', text: 'power', enclose: ['power(', ')'], args: [{type: '*', description: ''}, {type: '*', description: ''}]},
    ]
  },
  {
    types: [idMap.text['1']],
    functions: [
      {id: 'length', text: 'length', enclose: ['length(', ')'], args: [{type: '*', description: ''}], returns: idMap.numbers['4']},
      {id: 'md5', text: 'md5', enclose: ['md5(', ')'], args: [{type: '*', description: ''}]},
    ]
  }
];

var operators = [
  {
    ops: [
      {id: '+', text: '+ addition'},
      {id: '-', text: '- subtraction'},
      {id: '*', text: '* multiplication'},
      {id: '/', text: '/ division'},
    ],
    types: [idMap.numbers['1'], idMap.numbers['2'], idMap.numbers['3'], idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']],
    returns: [
      {arg1: [idMap.numbers['1'], idMap.numbers['3'], idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']], arg2: [idMap.numbers['2']], return: idMap.numbers['2']},
      {arg1: [idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']], arg2: [idMap.numbers['1']], return: idMap.numbers['1']},
    ]
  },
  {
    ops: [
      {id: '+', text: '+ union'},
      {id: '*', text: '* intersection'},
      {id: '-', text: '- difference'},
    ],
    types: [idMap.ranges['1'], idMap.ranges['2'], idMap.ranges['3'], idMap.ranges['4'], idMap.ranges['5'], idMap.ranges['6']]
  },
  {
    ops: [
      {id: '%', text: '% modulo (remainder)'}
    ],
    types: [idMap.numbers['1'], idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']],
    returns: [
      {arg1: [idMap.numbers['4'], idMap.numbers['5']], arg2: [idMap.numbers['6']], return: idMap.numbers['6']},
      {arg1: [idMap.numbers['5']], arg2: [idMap.numbers['4']], return: idMap.numbers['4']},
      {arg1: '*', arg2: [idMap.numbers['1']], return: idMap.numbers['1']},
    ]
  },
  {
    ops: [
      {id: '^', text: '^ exponentiation'}
    ],
    types: [idMap.numbers['1'], idMap.numbers['2'], idMap.numbers['3'], idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']],
    returns: [
      {arg1: [idMap.numbers['2'], idMap.numbers['3'], idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']], arg2: [idMap.numbers['2'], idMap.numbers['3'], idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']], return: idMap.numbers['2']},
      {arg1: '*', arg2: [idMap.numbers['1']], return: idMap.numbers['1']},
    ]
  },
  {
    ops: [
      {id: '||', text: '|| concat'}
    ],
    types: [idMap.text['1'], idMap.arrays['1'], idMap.arrays['2'], idMap.arrays['3'], idMap.arrays['4']]
  },
  // {
  //   ops: [
  //     {id: 'append', text: 'array append', type: 'function', enclose: ['array_append(', ')'], args: ['$self', {type: '$el', description: 'element to append'}]},
  //     {id: 'prepend', text: 'array prepend', type: 'function', enclose: ['array_prepend(', ')'], args: ['$self', {type: '$el', description: 'element to prepend'}]},
  //     {id: 'remove', text: 'array remove', type: 'function', enclose: ['array_remove(', ')'], args: ['$self', {type: '$el', description: 'element to remove'}]},
  //     {id: 'replace', text: 'array replace', type: 'function', enclose: ['array_replace(', ')'], args: ['$self', {type: '$el', description: 'element to be replaced'}, {type: '$el', description: 'new element'}]},
  //   ],
  //   types: [idMap.arrays['1'], idMap.arrays['2'], idMap.arrays['3'], idMap.arrays['4']]
  // }
];

var comparison = [
  {
    types: [idMap.numbers['1'], idMap.numbers['2'], idMap.numbers['3'], idMap.numbers['4'], idMap.numbers['5'], idMap.numbers['6']],
    compare: [
      {id: '=', text: '= equal to'},
      {id: '!=', text: '!= not equal to'},
      {id: '<', text: '< less than'},
      {id: '>', text: '> greater than'},
      {id: '>=', text: '>= less than or equal to'},
      {id: '<=', text: '<= less greater or equal to'}
    ]
  },
  {
    types: [idMap.text['1']],
    compare: [
      {id: '=', text: '= equal to'},
      {id: '~', text: '~ like'}
    ]
  },
  {
    types: [idMap.arrays['1'], idMap.arrays['2'], idMap.arrays['3'], idMap.arrays['4']],
    compare: [
      {id: '=', text: 'equal'},
      {id: '<>', text: 'not equal'},
      {id: '<', text: 'less than'},
      {id: '>', text: 'greater than'},
      {id: '>=', text: 'less than or equal to'},
      {id: '<=', text: 'less greater or equal to'},
      {id: '@>', text: 'contains'},
      {id: '<@', text: 'is contained by'},
      {id: '&&', text: 'overlap'}
    ]
  },
  {
    types: [idMap.ranges['1'], idMap.ranges['2'], idMap.ranges['3'], idMap.ranges['4'], idMap.ranges['5'], idMap.ranges['6']],
    compare: [
      {id: '=', text: 'equal'},
      {id: '<>', text: 'not equal'},
      {id: '<', text: 'less than'},
      {id: '>', text: 'greater than'},
      {id: '>=', text: 'less than or equal to'},
      {id: '<=', text: 'less greater or equal to'},
      {id: '@>', text: 'contains range'},
      {id: '@>', text: 'contains element', rhs: '$el'},
      {id: '<@', text: 'range is contained by'},
      {id: '<@', text: 'range is contained by element', rhs: '$el'},
      {id: '&&', text: 'overlap (have points in common)'},
      {id: '<<', text: 'strictly left of'},
      {id: '>>', text: 'strictly right of'},
      {id: '&<', text: 'does not extend to the right of'},
      {id: '&>', text: 'does not extend to the left of'},
      {id: '-|-', text: 'is adjacent to'},
    ]
  },
  {
    types: '*',
    compare: [
      {id: 'IN', text: 'IN (subquery)', rhs: 'subquery'},
      {id: 'NOT IN', text: 'NOT IN (subquery)', rhs: 'subquery'}
    ]
  }
];

module.exports = {
  operators: operators,
  comparison: comparison,
  functions: functions
};