// Load the full build.
var _ = require('lodash');




var modules = [
    , 
    {},
    {
    name: 'Module1',
    submodules: [{
        name: 'Submodule1',
        id: 1
      }, {
        name: 'Submodule2',
        id: 2
      }
    ]
  }, {
    name: 'Module2',
    submodules: [{
        name: 'Submodule1',
        id: 3
      }, {
        name: 'Submodule2',
        id: 4
      }
    ]
  }
];

let maxExecutionTime  = 5000; 

function filterData( data, filterList ) {
    const END  = Date.now() +  maxExecutionTime; 
   
     function recusiveTravese( curr) {
        // if( END < Date.now()){
        //     console.log( 'exiting')
        //     return ; 
        // }
        if( Array.isArray( curr) ){
            for (let i = 0; i < curr.length; i++) {
                recusiveTravese( curr[i]);
            }
        }
        else if( typeof curr == 'object'){ 
              let keys = Object.keys (curr )
              for (let i = 0; i < keys.length; i++) {
                recusiveTravese( curr[keys]);
            }
        }
        if( filterList.includes ( curr ) ){ 
            console.log( "curr =--> ", curr)
            curr = "FILTERED"
        }
     }

     recusiveTravese( data) ; 

}


let  filterList = [ 'name' , ]
// console.log( JSON.stringify( modules, null , 2))
filterData(modules , filterList)
console.log( JSON.stringify( modules, null , 2))