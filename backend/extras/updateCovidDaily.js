'use strict';
var ModelManager = require('../models/modelManager');
var refreshModeladder = require('../middlewares/refreshModeladder.js')();
var fs = require('fs');

const axios = require('axios');


const { RE_SYNC_SCHEMA_TIME } = require('../envconfig.js').constant;
var setTimeoutId;
let lastSyncAt = 0;

let subdomain = "coviddaily";
let db_id = "4de803fd-57b5-4637-b8bd-8b2d2d010d29";
let req = {
  clientModels: {},
  query: {},
  body: { subdomain, db_id },

  user_id: "73795e5a-a09f-402c-880c-a099ff0f6d95",
  // user_id: "d14aef48-296e-4eb9-af15-793e0119a7af" , 
  // user_id: "fdeaec21-a1d2-4ee0-863d-d27760830ea2"
};
let res = {
  zend: (...data) => {
    console.log("----------Response-------------");
    console.log(data);
  },
};





async function getData() {
  // The await keyword saves us from having to write a .then() block.

  //   let input = '/home/mohan/DRIVE-D/query-chart/mysql/covid_daily.json'
  //   let json_file_global = fs.readFileSync(input, 'utf-8');
  // let json_data_global = JSON.parse(json_file_global);
  // return json_data_global
  let endpont = 'apps/editor/controllers/nodes';

  let query = `subdomain=lingering-resonance-1&db_id=cc7ae1ea-3e0a-48cc-a574-a801562c6e88&id=15575122&qm=select`;
  let body = {

  };

  let url = 'https://pomber.github.io/covid19/timeseries.json';
  const config = {
    method: 'POST',
    url: url,

  };

  try {
    let response = await axios.get(url, config);
    // console.log ( response.data)
    return response.data;

  }
  catch (err) {
    console.log("ERROR");
    console.log(err.message);
    return [];
  }

}


// subdomain=coviddaily&id=1296&qm=select&db_id=4de803fd-57b5-4637-b8bd-8b2d2d010d29

function loadModel(params) {

  // refreshModeladder(req,{},next )
  refreshModeladder(req, res, () => {
    start()

  })

}

async function insertRow(currentModel, row) {


  return new Promise((resolve, reject) => {

    let queryObj = {
      text: `
      INSERT INTO \`covid_daily\`.\`daily_records\` 
      (  \`confirmed\`  , \`deaths\`  , \`recovered\`  , \`country_id\`  , \`record_date\`  )  
       VALUES ( ?,?,?,?,?  )    ;    
     `,
      values: [row.confirmed, row.deaths, row.recovered, row.country_id, row.record_date,]
    }
    // console.log( row)
    // console.log( queryObj)

    currentModel.query(queryObj, function (err, result) {
      // console.log( result)
      if (err) resolve(err);
      resolve(null)
    });
  });
  //  console.log( row )

}




async function start() {


  //
  let data = { lastSyncAt: (Date.now() - lastSyncAt) / 1000, };
  lastSyncAt = Date.now();

  try {



    let currentModel = ModelManager.models[req.body.subdomain].databases[req.body.db_id];
    // console.log( "clientModels[subdomains[i]].databases[db_ids[j]]" )
    // console.log( clientModels[req.body.subdomain].databases[req.body.db_id] )

    let covidDailyData = await getData()


    currentModel.query(
      `
    SELECT
     covid_daily.countries.country_name,
     covid_daily.countries.country_id,
     max( covid_daily.daily_records.record_date)  as record_date
   FROM
     covid_daily.countries
     INNER JOIN covid_daily.daily_records ON covid_daily.daily_records.country_id = covid_daily.countries.country_id
   GROUP BY
     covid_daily.countries.country_name,
     covid_daily.countries.country_id
   ORDER BY 
    covid_daily.countries.country_name 
    `,
      async function (err, result) {
        if (err) return console.error(err?.message || err);

        // console.log( "result.rows.length" )
        // console.log(   result.rows )
        // console.log( Object.keys( covidDailyData).toLocaleString())
        if (result.rows.length !== Object.keys(covidDailyData).length) console.error("Countries length not match");
        for (let i = 0; i < result.rows.length; i++) {

          let currentCountryList = covidDailyData[result.rows[i].country_name];
          if (!currentCountryList) {
            console.error("'currentCountryList' counties cases is undefined");
            continue;
          }


          let j;
          for (j = currentCountryList.length - 1; j >= 0; j--) {
            if (result.rows[i].record_date.getTime() == (new Date(currentCountryList[j].date).getTime())) {
              console.log(result.rows[i].country_name, result.rows[i].record_date, new Date(currentCountryList[j].date))
              break;
            }

          }
          if (j < 0) j = 0;
          else j += 1;
          // j = Math.max( 0, j); 
          console.log('j = ' + j)
          for (; j < currentCountryList.length; j++) {

            let row = currentCountryList[j];
            let curr_obj = {
              ...row,
              country_id: result.rows[i].country_id,
              record_date: new Date(row.date).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
              ,
            }
            delete curr_obj.date;
            let resultError = await insertRow(currentModel, curr_obj)
            if (resultError) console.error(resultError?.message || resultError)
            console.log("insert")
            // return ; 
          }

        }
        console.log("completed")

      })


    startTimer();
  }
  catch (err) {
    console.error(err);
  }

}





function startTimer() {
  clearTimeout(setTimeoutId); // clear previous timer
  setTimeoutId = setTimeout(() => {

    console.log("starting......");
    loadModel();

  },   RE_SYNC_SCHEMA_TIME); // 24 hours

}


// loadModel(); 
module.exports.startTimer = startTimer;
module.exports.startUpdating = loadModel; 