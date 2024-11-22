var db = require.main.require('./lib/maindb.js');

exports.log = log;

function log(...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    db.query({text: 'insert into be_logs (log_message) values ($1)', values: [message]}, function(err){
        if(err) {
            console.error('Error logging message:', err);
        }
    });
}