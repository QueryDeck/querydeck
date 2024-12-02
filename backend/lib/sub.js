'use strict';
var adv = ['autumn', 'hidden', 'bitter', 'misty', 'silent', 'empty', 'dry', 'dark', 'summer', 'icy', 'delicate', 'quiet', 'white', 'cool', 'spring', 'winter', 'patient', 'twilight', 'dawn', 'crimson', 'wispy', 'weathered', 'blue', 'billowing', 'broken', 'cold', 'damp', 'falling', 'frosty', 'green', 'long', 'late', 'lingering', 'bold', 'little', 'morning', 'muddy', 'old', 'red', 'rough', 'still', 'small', 'sparkling', 'throbbing', 'shy', 'wandering', 'withered', 'wild', 'black', 'young', 'holy', 'solitary', 'fragrant', 'aged', 'snowy', 'proud', 'floral', 'restless', 'divine', 'polished', 'ancient', 'purple', 'lively', 'nameless'];

var nouns = ['waterfall', 'river', 'breeze', 'moon', 'rain', 'wind', 'sea', 'morning', 'snow', 'lake', 'sunset', 'pine', 'shadow', 'leaf', 'dawn', 'glitter', 'forest', 'hill', 'cloud', 'meadow', 'sun', 'glade', 'bird', 'brook', 'butterfly', 'bush', 'dew', 'dust', 'field', 'fire', 'flower', 'firefly', 'feather', 'grass', 'haze', 'mountain', 'night', 'pond', 'darkness', 'snowflake', 'silence', 'sound', 'sky', 'shape', 'surf', 'thunder', 'violet', 'water', 'wildflower', 'wave', 'water', 'resonance', 'sun', 'wood', 'dream', 'cherry', 'tree', 'fog', 'frost', 'voice', 'paper', 'frog', 'smoke', 'star'];

exports.gen = gen;

function gen (callback) {

  var DB = require.main.require('./models/index.js').db;
  var models = require.main.require('./models/modelManager').pgtmodels.models;

  var pairs = [];

  adv = uniques(adv);
  nouns = uniques(nouns);

  for (let i = 0; i < adv.length; i++) {
    // const element = adv[i];
    for (let j = 0; j < nouns.length; j++) {
      // const element = nouns[j];

      for (let k = 0; k < 1; k++) {
        // const element = array[k];
        pairs.push({name: adv[i].toLowerCase() + '-' + nouns[j].toLowerCase() + '-' + (k + 1), auto: true});
        // if(k == 0) pairs.push({name : adv[i] + '-' + nouns[j]})
        // else pairs.push({name : adv[i] + '-' + nouns[j] + '-' + k})
      }
            
    }
  }

  new DB({}).execute([
    new models.public.subdomain_gen().insert(pairs)
  ], function(err, r){
    callback(err)
  });

}

function uniques(arr) {
  var a = [];
  for (var i=0, l=arr.length; i<l; i++)
    if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
      a.push(arr[i]);
  return a;
}