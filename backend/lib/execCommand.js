'use strict';
const { exec } = require('child_process');

function execCommand(command, options) {

  options = {
    maxExecTime: 10000, // milliseconds
    /* 
     '/bin/bash' | '/bin/sh' 
      for linux default set to bash
    */
    shell: process.platform == 'linux' ? '/bin/bash' : undefined,  
    ...options
  }; 
  return new Promise((resolve, reject) => {

    let timerId;
   
    let child = exec(command, { shell: options?.shell }, (error, stdout, stderr) => {
      clearTimeout(timerId);
      if (error) {
        return reject({ error, stdout, stderr });
      } 
      resolve({ error, stdout, stderr });

      // if (stderr != "")
      //   console.error(`stderr: ${stderr}`);
    });

    // kill process  
    timerId = setTimeout(() => {
      child.kill(); // 'exec' kills  correctly only when shell type is '/bin/bash'
    }, Math.abs(options?.maxExecTime || 0));

  });

}

module.exports = execCommand; 
 
/* let options = {
  maxExecTime: 1000,
  shell: '/bin/bash',  // '/bin/bash' | '/bin/sh' 

}
execCommand("du -sh", options)
  .then((data) => {
    console.log(data)
  })
  .catch((err) => {
    console.log(err)
  })

execCommand("sleep 5", options)
  .then((data) => {
    console.log(data)
  })
  .catch((err) => {
    console.log(err)
  })
  */