/// mongo details

var supported_browsers = ['Chrome']

function get_races(arr) {
  output = [0,0]
  for (let x = 0; x < arr.length; x++) {
    if (meta[arr[x]]['race_common'] == 'white') {
      output[0]++
    } else if (meta[arr[x]]['race_common'] == 'black') {
      output[1]++
    }
  }
  return output
}

function get_races_2(trials) {
  output = [0,0,0,0]
  for (let x = 0; x < trials.length; x++) {
    if (trials[x].old_race == 'white') {
      if (trials[x].old_tilt_difference == 0) {
        output[0]++
      } else {
        output[1]++
      }

    } else if (trials[x].old_race == 'black') {
      if (trials[x].old_tilt_difference == 0) {
        output[2]++
      } else {
        output[3]++
      }
    } 
  }
  return output
}


////////////////////////////////////////////// GENERIC HELPER FUNCTIONS /////////////////////////////////////

function pad(number, length) {
  var str = '' + number;
  while (str.length < length) {
      str = '0' + str;
  }
  return str;
}

// load node process 'io' as socket
socket = io.connect();

// define javascript facing node functions
save_trial_to_database = function(trial_data){
  socket.emit('insert', trial_data)
}

get_ids_from_database = function(n_ids){
  socket.emit('id_query', n_ids)
}


// click from index.html calls 'mongo_extract()'
function mongo_extract(){
  // send a request to node, which is listening for 'extract'
  socket.emit('extract')
}

// click from index.html calls 'mongo_extract()'
function mongo_extract_IDs(){
  // send a request to node, which is listening for 'extract'
  socket.emit('extract_faceID_counts')
}

function format_data_for_server(trial_data, params) { 
  // trial_data.worker_id= get_turk_param('workerId') // UNCOMMENT FOR MTURK 
  // trial_data.assignment_id= get_turk_param('assignmentId')
  // trial_data.hit_id= get_turk_param('hitId')
  trial_data.browser = get_browser_type()
  trial_data.collection = params.collection
  trial_data.database = params.database
  trial_data.iteration = params.iteration
  return trial_data
}
function shuffle(a) {
    var j, x, i;
    for (let i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function get_random_index(list) {
  return Math.floor(Math.random()*list.length)
}

function array_equals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}

////////////////////////////////////////////// GENERIC MTURK FUNCTIONS /////////////////////////////////////

function show_mturk_submit_button(){

  submit_button = document.createElement('div');
  submit_button.innerHTML = "" + 
  "<div id='hidden_button' style='position: absolute; top:50%; left: 50%; '>" + 
    "<form name='hitForm' id='hitForm' method='post' action=''>" + 
      "<input type='hidden' name='assignmentId' id='assignmentId' value=''>" + 
      "<input type='submit' name='submitButton' id='submitButton' value='Submit' class='submit_button'>" + 
    "</form>" + 
  "</div>"

  document.body.appendChild(submit_button);
  document.getElementById('hitForm').setAttribute('action', get_submission_url())
  document.getElementById('assignmentId').setAttribute('value', get_turk_param('assignmentId')) 

}

function get_submission_url(){
  if (window.location.href.indexOf('sandbox')>0) {
      console.log('SANDBOX!')
      submission_url = 'https://workersandbox.mturk.com/mturk/externalSubmit'
  } else {
      console.log('REAL LYFE!')
      submission_url = "https://www.mturk.com/mturk/externalSubmit"
    }
  return submission_url
}
   
  function get_turk_param( param ) {
    // worker id : 'workerId'
    // assignmen ID : 'assignmentId'
    // hit ID : 'hitId'
    var search_term = "[\?&]"+param+"=([^&#]*)";
    var reg_exp = new RegExp( search_term );
    var search_url = window.location.href;
    results = reg_exp.exec( search_url );
    if( results == null ) {
        return 'NONE'
    } else {
      return results[1];
    }
  }
  

////////////////////////////////////////////// MANAGE ZOOM SETTINGS /////////////////////////////////////

function get_browser_type(){
  var N= navigator.appName, ua= navigator.userAgent, tem;
  var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
  M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
  ////// includes version: ////////  return M.join(' '),
  return  M[0]
 };


////////////////////////////////////////////// CUSTOM EXPERIMENT FUNCTIONS /////////////////////////////////////

// gets race or gender from various checkbox buttons
function get_race_gender(response, race_gender) {

  var output = [];

  if (race_gender == 'race') {
    for (var property in response) {
      if(property.includes('race')) {
        output.push(response[property])
      }
    }

  } else if (race_gender == 'gender') {
    for (var property in response) {
      if(property.includes('gender')) {
        output.push(response[property])
      }
    }
  } 
  return output;
}

//helper function below
function how_many (identities, category) {
  // returns how many identities of that category are in 'identities'

  var count = 0;
  for (let i=0; i<identities.length; i++) {
    if (category == identities[i].charAt(identities[i].indexOf("_")+1)) {
      count++;
    }
  }
  return count;
}

// helper function for below
function generate_new_identity (exclude, category, gender='') {
  // this function is passed an array of identities to exclude and gets a random new identity not in that array
  if (exclude.length == Object.keys(meta).length) {
    console.log("Houston we have a problem. All identities used up. Returning random face.png")
    return generate_new_identity([])
  }

  var idx = [...Array(Object.keys(meta).length).keys()]
  idx = shuffle(idx) //randomly go through ids of meta

  for (let ind = 0; ind < idx.length; ind++) {
    var currId = Object.keys(meta)[idx[ind]]
    if (!exclude.includes(currId) && (category.length == 0 || category == meta[currId]['race_common']) && (gender.length==0 || gender == meta[currId]['gender_common'])) {
      return currId
    }
  }
  console.log("Error: generate_new_identity did not find a face.")
  return '001'
}


function generate_n_random_faces (used_faces, n, add_to_used = 1, categories=[]) {
  // this function just calls generate_new_identity n times, and adds to used_faces array
  // called to get practice faces and generate oddities
  // generates equally across categories given
  
  var output = [];

  if (categories.length == 0) {
    // just add random faces
    for (let j = 0; j < n; j++) {
      rand = generate_new_identity(used_faces);
      output.push(rand);
      if (add_to_used) {
        used_faces.push(rand)
      }
    }
  } else { //need to deal with categories

    for (let x = 0; x < categories.length; x++) {
      // for each category
      for (let j = 0; j < n/categories.length; j++) {
        rand = generate_new_identity(used_faces, categories[x]);   
        output.push(rand);
        if (add_to_used) {
          used_faces.push(rand)
        }
      }
    }
  }
  
  return shuffle(output);
}


function get_pair (oddity, used_faces, strategy) {
  // strategy usually comes from params.typicals_strategy
  if (strategy == 'random') { // random or pairs is entirely used up
    return generate_new_identity(used_faces);
  } 

  for (let z = 0; z < strategy.length; z++) {
    var pairs = meta[oddity]['pairs'][strategy[z]]

    if (strategy[z].includes('group')) {
      // just pick a random one from the group
      var curr = shuffle(pairs)
      for (let k = 0; k < curr.length; k++) {
        if (!used_faces.includes(curr[k])) {
          return curr[k]
        }
      }

    } else {
      // behavior_similar or something like it
      for (let i = 0; i < pairs.length; i+=params.search_chunk) {
        var curr = shuffle(pairs.slice(i, i+params.search_chunk)) // gets first 20 elements of array, then 20-40 and gracefully runs out. And randomizes the order of that chunk
        for (let k = 0; k < curr.length; k++) {
          if (!used_faces.includes(curr[k])) {
            return curr[k]
          }
        }
      } 
    }
  }
  // if we make it here, pairs ran out. Resort to random face
  console.log('Error: returning random typical')
  console.log(oddity)
  return generate_new_identity(used_faces) 
}


function generate_typicals (used_faces, oddities) {
  // this function returns an array of ID's of equal length to 'oddities' containing index-matched typicals IDs
  // according to our within-trial grouping strategy
  // 'random', 'model_similar', 'model_group', 'behavior_similar', 'behavior_group' from metadata (eventually)
  // also has toggle params.can_typicals_repeat to see if you can use the same typical face for multiple oddities
  var typicals = [];
  var curr = '';

  for (let j = 0; j < oddities.length; j++) {

    curr = get_pair(oddities[j], used_faces, params.typicals_strategy)
    typicals.push(curr);
    if (!params.can_typicals_repeat) { //if typicals can repeat, don't add to used_faces *YET* 
      used_faces.push(curr) 
    }
  }
  if (params.can_typicals_repeat) {
    // if typicals CAN repeat, still want to add them here so that they are in used_faces by the time we make retrieval trials
    used_faces = used_faces.concat(typicals)
  }
  return typicals;
}


function generate_encoding_stimulus (oddity, typical) {
  // this function is given the identity of an oddity and a typical and it generates the info of an encoding trial
  // call this on each index of oddities/typicals to make array of stim info
  // also call this on random practice face pairs

  var currOddityId = oddity;
  var currTypicalsId = typical;

  var lefts = params.possible_tilts_LR.filter(tilt => tilt.endsWith("L")) // all the possible 'L' values
  var rights = params.possible_tilts_LR.filter(tilt => tilt.endsWith("R")) // all the possible 'R' values
  var three_LR = shuffle(['00C', lefts[Math.floor(Math.random() * lefts.length)], rights[Math.floor(Math.random() * rights.length)]]) //shuffled C, random L, random R

  // this not strictly necessary but helpful if ever add more possible UD tilts
  var ups = params.possible_tilts_UD.filter(tilt => tilt.endsWith("U")) // all the possible 'U' values, should just be U here
  var downs = params.possible_tilts_UD.filter(tilt => tilt.endsWith("D")) // all the possible 'D' values, should just be D here
  var three_UD = shuffle(['C', ups[Math.floor(Math.random() * ups.length)], downs[Math.floor(Math.random() * downs.length)]]) //shuffled C, random U, random D

  var currOddityTiltLR = three_LR[0];
  var currOddityTiltUD = three_UD[0];
  var currTypicalsTiltsLR = [three_LR[1], three_LR[2]];
  var currTypicalsTiltsUD = [three_UD[1], three_UD[2]];

  var currStims = [];
  currStims.push(params.stimulus_path + "id" + typical + "_" + currTypicalsTiltsLR[0] + "_" + currTypicalsTiltsUD[0] + ".png") //typical 1
  currStims.push(params.stimulus_path + "id" + typical + "_" + currTypicalsTiltsLR[1] + "_" + currTypicalsTiltsUD[1] + ".png") //typical 2

  var currOddityIndex = Math.floor(Math.random()*(currStims.length+1)); // get random index to insert oddity into array
  currStims.splice(currOddityIndex, 0, params.stimulus_path + "id" + oddity + "_" + currOddityTiltLR + "_" + currOddityTiltUD + ".png"); //insert oddity

  currCorrectResponse = currOddityIndex + 1;
  currTypicalsIndices = [0,1,2].filter(function(x) {return x !== currOddityIndex});

  var trial_info = {
    stimuli: currStims,
    oddity_index: currOddityIndex,
    oddity_identity: oddity,
    oddity_tiltLR: currOddityTiltLR,
    oddity_tiltUD: currOddityTiltUD,
    oddity_race: meta[oddity]['race_common'],
    oddity_gender: meta[oddity]['gender_common'],
    oddity_mb: meta[oddity][currOddityTiltLR][currOddityTiltUD]['mb_'+params.stimulus_version],
    typicals_indices: currTypicalsIndices, 
    typicals_identity: typical,
    typicals_tiltsLR: currTypicalsTiltsLR,
    typicals_tiltsUD: currTypicalsTiltsUD,
    typicals_race: meta[typical]['race_common'],
    typicals_gender: meta[typical]['gender_common'],
    typicals_mb: [meta[typical][currTypicalsTiltsLR[0]][currTypicalsTiltsUD[0]]['mb_'+params.stimulus_version], meta[typical][currTypicalsTiltsLR[1]][currTypicalsTiltsUD[1]]['mb_'+params.stimulus_version]],
    correct_response: currCorrectResponse
  }
  return trial_info

  // used to have oddity category, typical category, within vs. across
}

function switch_locations (encoding_stimuli) {
  var output = JSON.parse(JSON.stringify(encoding_stimuli)); //deep copy
  
  var temp = [] // for later
  var odd = ''
  var old = []

  for (let j = 0; j < output.length; j++) {

    odd = output[j].stimuli[output[j].oddity_index]
    old = [...output[j].stimuli]

    // want a new oddity_index
    output[j].oddity_index = shuffle(output[j].typicals_indices)[0] // get random new oddity index from old typical indices
    output[j].typicals_indices = [0,1,2].filter(function(x) {return x !== output[j].oddity_index}); // not oddity index
    
    temp = shuffle(output[j].stimuli.filter(function(x) {return x != odd})) //just get the typicals and shuffle them
    temp.splice(output[j].oddity_index, 0, odd) // insert 
    
    output[j].stimuli = [...temp]
    output[j].correct_response = output[j].oddity_index + 1
  }

  return output
}


//helpers for below
function tilt_to_number(tilt) {
  if (tilt.endsWith('R')) {
    return parseInt(tilt)
  } else if (tilt.endsWith('L')) {
    return -parseInt(tilt)
  } else { //00C
    return 0
  }
}
function number_to_tilt(number) {
  if (number > 0) {
    return number.toString().concat('R')
  } else if (number < 0) { 
    return Math.abs(number).toString().concat('L')
  } else { // difference == 0
    return '00C'
  }
}

function get_new_tilt(o_tilt, tilt_diff) {
  // takes in original tilt and a number, returns a new tilt that far away
  o_number = tilt_to_number(o_tilt)
  var possible = shuffle([number_to_tilt(o_number + tilt_diff), number_to_tilt(o_number - tilt_diff)]) //randomly shuffle the two possible directions of movement
  for (let p = 0; p < possible.length; p++) {
    if (params.possible_tilts_LR.includes(possible[p])) {
      return possible[p]
    }
  }
  console.log('Error: get_new_tilt')
}

//helper function for functions below, gets LR difference between two tilts. Returns both a difference (number, L <0, R >0) and a change (string with L/R)
function get_tilt_change(o_tilt, n_tilt) {
  // tilts come like this: '60R'. Just looking for LR change not UD, assumed to be same UD tilt

  if (o_tilt.constructor.name == 'Array') { // multiple o_tilts
    var change1 = get_tilt_change(o_tilt[0], n_tilt)
    var change2 = get_tilt_change(o_tilt[1], n_tilt)
    var output = {
      diff: [change1.diff, change2.diff],
      change: [change1.change, change2.change]
    }
    return output
  }
  var difference = tilt_to_number(n_tilt) - tilt_to_number(o_tilt)
  var output = {
    diff: difference,
    change: number_to_tilt(difference),
  }
  return output;
}


function generate_retrieval_stimuli (used_faces, encoding_stimuli) {
  // Takes in all the faces used (to get new unused faces) and the encoding_stimuli (for old faces)
  // uses params.portion_new and params.retrieval_race_portions for new faces. Also cuts off new faces if no identities left
  // uses params.portion_tilt and params.possible tilts for tilts
  // uses params.test_on_typicals, params.test_on_odditites to see what kind of old ones we are testing on
  
  var retrieval_trials = [];

  //to be used 
  var this_trial = {} //just instantiate once, will use a bunch
  var this_stim = {}
  var used_indices = []

  var currFname = ''
  var currIdentity = ''
  var currTiltLR = ''
  var currTiltUD = ''
  var tiltChange = []


  // ADDING OLD TRIALS - assign to random tilt?

  var idxs = shuffle([...Array(encoding_stimuli.length).keys()]) // [0, 1, 2, ... length] but in random order
  var n_tilt_w = Array(params.possible_tilt_changes.length).fill(params.retrieval_n_old/params.categories.length/params.possible_tilt_changes.length)
  var n_tilt_b = [...n_tilt_w] // [10,10] in this case, to indicate the number of tilts

  for (let i = 0; i < idxs.length; i++) { // loop randomly through encoding trials, so we aren't systematically tilting faces presented earlier
    this_stim = encoding_stimuli[idxs[i]] 

    // ODDITY
    if (params.test_on_oddities) { // add the oddity as a retrieval trial

      if (params.tilt_strategy == 'uniform_symmetric' && this_stim['oddity_race'] == 'black') {
        for (let j = 0; j < n_tilt_b.length; j++) {
          if (n_tilt_b[j] > 0) {
            n_tilt_b[j]--
            currTiltLR = get_new_tilt(this_stim['oddity_tiltLR'], params.possible_tilt_changes[j])
            break
          }
        }

      } else if (params.tilt_strategy == 'uniform_symmetric' && this_stim['oddity_race'] == 'white') {
        for (let j = 0; j < n_tilt_w.length; j++) {
          if (n_tilt_w[j] > 0) {
            n_tilt_w[j]--
            currTiltLR = get_new_tilt(this_stim['oddity_tiltLR'], params.possible_tilt_changes[j])
            break
          }
        }
      } else {
        console.log("Retrieval trial generation: not uniform_symmetric")
        currTiltLR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)]
      }

      tiltChange = get_tilt_change(this_stim['oddity_tiltLR'], currTiltLR)
      currFname = params.stimulus_path + "id" + this_stim['oddity_identity'] + "_" + currTiltLR + "_" + this_stim['oddity_tiltUD'] + ".png"

      //now add the trial
      this_trial = {
        stimulus: currFname, 
        identity: this_stim['oddity_identity'],
        race: meta[this_stim['oddity_identity']]['race_common'],
        gender: meta[this_stim['oddity_identity']]['gender_common'],
        original_index: idxs[i],
        tiltLR: currTiltLR,
        tiltUD: this_stim['oddity_tiltUD'],
        original_tiltLR: this_stim['oddity_tiltLR'],
        original_tiltUD: this_stim['oddity_tiltUD'],
        tilt_change: tiltChange.change,
        tilt_difference: tiltChange.diff,
        encoding_type: 'oddity',
        encoding_pair: this_stim['typicals_identity'],
        retrieval_condition: 'old',
        mb: meta[this_stim['oddity_identity']][currTiltLR][this_stim['oddity_tiltUD']]['mb_'+params.stimulus_version],
        correct_response: 2
      }
      retrieval_trials.push(this_trial)
    }

    // TYPICAL
    if (params.test_on_typicals) { // add a random one of the typicals as a retrieval trial

      currTiltLR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)] //CHANGE THIS IF WE START TESTING ON TYPICALS
      tiltChange = get_tilt_change(this_stim['typicals_tiltsLR'], currTiltLR)

      currTiltUD = this_stim['typicals_tiltsUD'][Math.floor(Math.random() * 2)]
      currFname = params.stimulus_path + "id" + this_stim['typicals_identity'] + "_" + currTiltLR + "_" + currTiltUD + ".png"

      //now add the trial
      this_trial = {
        stimulus: currFname,
        identity: this_stim['typicals_identity'],
        race: meta[this_stim['typicals_identity']]['race_common'],
        gender: meta[this_stim['typicals_identity']]['gender_common'],
        original_index: idxs[i],
        tiltLR: currTiltLR,
        tiltUD: currTiltUD,
        original_tiltLR: this_stim['typicals_tiltsLR'],
        original_tiltUD: this_stim['typicals_tiltsUD'],
        tilt_change: tiltChange.change,
        tilt_difference: tiltChange.diff,
        encoding_type: 'typical',
        encoding_pair: this_stim['oddity_identity'],
        retrieval_condition: 'old',
        mb: meta[this_stim['typicals_identity']][currTiltLR][currTiltUD]['mb_'+params.stimulus_version],
        correct_response: 2
      }
      retrieval_trials.push(this_trial)
    }

  } //end for loop for old faces. now we have added all the old faces. presumably


  // ADDING NEW TRIALS

  // now lets calculate based on that how many new faces we need (cut off if not enough identities)
  var n_new = Math.min(params.retrieval_n_new, Object.keys(meta).length - used_faces.length) // min of ideal retrieval trials and number of fresh identities left

  var new_faces = []
  // then lets get all the new faces
  for (let x = 0; x < params.categories.length; x++) {
    for (let j =0; j < n_new / params.categories.length; j++) { // 16 times per category

      currIdentity = generate_new_identity(used_faces, category=params.categories[x])
      new_faces.push(currIdentity)
      //random identity 
      used_faces.push(currIdentity)
      currTiltLR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)]
      currTiltUD = params.possible_tilts_UD[get_random_index(params.possible_tilts_UD)]

      // now add the trial
      this_trial = {
        stimulus: params.stimulus_path + "id" + currIdentity + "_" + currTiltLR + "_" + currTiltUD + ".png", //filename,
        identity: currIdentity,
        race: meta[currIdentity]['race_common'],
        original_index: '',
        tiltLR: currTiltLR,
        tiltUD: currTiltUD,
        original_tilt: '',
        tilt_change: '',
        tilt_difference: '',
        encoding_type: '',
        encoding_pair: '',
        retrieval_condition: 'new',
        correct_response: 1
      }

      retrieval_trials.push(this_trial)
    }

  }//end for loop. now have all new faces in there too, hopefully.
  retrieval_trials = shuffle(retrieval_trials); // randomize order
  return retrieval_trials;
}



function generate_retrieval_stimuli_afc (used_faces, encoding_stimuli) {
  // same as above but for AFC version
  // uses params.portion_tilt and params.possible_tilts for tilts, uses params.test_on_typicals, params.test_on_odditites
  
  var retrieval_trials = [];

  //to be used 
  var this_trial = {} //just instantiate once, will use a bunch
  var this_stim = {}
  var used_indices = []

  var old_LR = ''
  var old_UD = ''
  var tilt_change = {}
  var new_id = ''
  var new_LR = ''
  var new_UD = ''
  var old_fname = ''
  var new_fname = ''
  var curr_stims = []

  var n_tilt = params.retrieval_n_tilts

  var idxs = shuffle([...Array(encoding_stimuli.length).keys()]) // [0, 1, 2, ... length] but in random order
  var n_tilt_w = Array(params.possible_tilt_changes.length).fill(params.retrieval_n_old/params.categories.length/params.possible_tilt_changes.length)
  var n_tilt_b = [...n_tilt_w] // [10,10] in this case, to indicate the number of tilts

  for (let i =0; i < idxs.length; i++) { // loop randomly through encoding, to not systematically tilt faces presented earlier
    this_stim = encoding_stimuli[idxs[i]]

    // ODDITY
    if (params.test_on_oddities) { // add the oddity as a retrieval trial

      if (params.tilt_strategy == 'uniform_symmetric' && this_stim['oddity_race'] == 'black') {
        for (let j = 0; j < n_tilt_b.length; j++) {
          if (n_tilt_b[j] > 0) {
            n_tilt_b[j]--
            old_LR = get_new_tilt(this_stim['oddity_tiltLR'], params.possible_tilt_changes[j])
            break
          }
        }

      } else if (params.tilt_strategy == 'uniform_symmetric' && this_stim['oddity_race'] == 'white') {
        for (let j = 0; j < n_tilt_w.length; j++) {
          if (n_tilt_w[j] > 0) {
            n_tilt_w[j]--
            old_LR = get_new_tilt(this_stim['oddity_tiltLR'], params.possible_tilt_changes[j])
            break
          }
        }
      } else {
        console.log("Retrieval trial generation: not uniform_symmetric")
        old_LR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)]
      }
      tilt_change = get_tilt_change(this_stim['oddity_tiltLR'], old_LR)

      old_fname = params.stimulus_path + "id" + this_stim['oddity_identity'] + "_" + old_LR + "_" + this_stim['oddity_tiltUD'] + ".png"


      // now get the new face to pair it with
      if (params.afc_pair == 'other') {
        new_id = generate_new_identity(used_faces, category = params.categories.filter(x => x != this_stim['oddity_race']))
      } else {
        new_id = generate_new_identity(used_faces, category = this_stim['oddity_race'])
      }
      used_faces.push(new_id)
      new_LR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)]
      new_UD = params.possible_tilts_UD[get_random_index(params.possible_tilts_UD)]
      new_fname = params.stimulus_path + "id" + new_id + "_" + new_LR + "_" + new_UD + ".png"

      curr_stims = shuffle([old_fname, new_fname])


      //now add the trial
      this_trial = {
        stimuli: curr_stims,
        new_index: curr_stims.indexOf(new_fname),
        new_identity: new_id,
        new_tiltLR: new_LR,
        new_tiltUD: new_UD,

        old_index: curr_stims.indexOf(old_fname),
        old_identity: this_stim['oddity_identity'],
        old_original_index: idxs[i],
        old_tiltLR: old_LR,
        old_tiltUD: this_stim['oddity_tiltUD'],
        old_original_tiltLR: this_stim['oddity_tiltLR'],
        old_original_tiltUD: this_stim['oddity_tiltUD'],
        tilt_change: tilt_change.change,
        tilt_difference: tilt_change.diff,
        old_encoding_type: 'oddity',
        old_encoding_pair: this_stim['typicals_identity'],
        
        old_race: meta[this_stim['oddity_identity']]['race_common'],
        old_gender: meta[this_stim['oddity_identity']]['gender_common'],

        new_race: meta[new_id]['race_common'],
        new_gender: meta[new_id]['gender_common'],

        old_mb: meta[this_stim['oddity_identity']][old_LR][this_stim['oddity_tiltUD']]['mb_'+params.stimulus_version],
        new_mb: meta[new_id][new_LR][new_UD]['mb_'+params.stimulus_version],

        correct_response: curr_stims.indexOf(old_fname) + 1,
      }

      retrieval_trials.push(this_trial)
    }

    // TYPICAL
    if (params.test_on_typicals) { // add a random one of the typicals as a retrieval trial

      if (params.tilt_strategy == 'uniform_symmetric' && meta[this_stim['typicals_identity']]['race_common'] == 'black') {
        for (let j = 0; j < n_tilt_b.length; j++) {
          if (n_tilt_b[j] > 0) {
            n_tilt_b[j]--
            currTiltLR = get_new_tilt(this_stim['typicals_tiltLR'][0], params.possible_tilt_changes[j]) //CHANGE THIS IF TESTING ON TYPICALS
            break
          }
        }

      } else if (params.tilt_strategy == 'uniform_symmetric' && meta[this_stim['typicals_identity']]['race_common'] == 'white') {
        for (let j = 0; i < n_tilt_w.length; i++) {
          if (n_tilt_w[j] > 0) {
            n_tilt_w[j]--
            currTiltLR = get_new_tilt(this_stim['typicals_tiltLR'][0], params.possible_tilt_changes[j]) //CHANGE THIS IF TESTING ON TYPICALS
            break
          }
        }
      } else {
        console.log("Retrieval trial generation: not uniform_symmetric")
        currTiltLR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)]
      }

      old_UD = this_stim['typicals_tiltsUD'][Math.floor(Math.random() * 2)] // random of the two

      old_fname = params.stimulus_path + "id" + this_stim['typicals_identity'] + "_" + currTiltLR + "_" + old_UD + ".png"

      // now get the new face to pair it with
      if (params.afc_pair == 'other') {
        new_id = generate_new_identity(used_faces, category = params.categories.filter(x => x != this_stim['typicals_race']))
      } else {
        new_id = generate_new_identity(used_faces, category = this_stim['typicals_race'])
      }
      used_faces.push(new_id)
      new_LR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)]
      new_UD = params.possible_tilts_UD[get_random_index(params.possible_tilts_UD)]
      new_fname = params.stimulus_path + "id" + new_id + "_" + new_LR + "_" + new_UD + ".png"

      curr_stims = shuffle([old_fname, new_fname])

      //now add the trial
      this_trial = {
        stimuli: curr_stims,
        new_index: curr_stims.indexOf(new_fname),
        new_identity: new_id,
        new_tiltLR: new_LR,
        new_tiltUD: new_UD,

        old_index: curr_stims.indexOf(old_fname),
        old_identity: this_stim['typicals_identity'],
        old_original_index: idxs[i],
        old_tiltLR: old_LR,
        old_tiltUD: old_UD,
        old_original_tiltLR: this_stim['typicals_tiltsLR'],
        old_original_tiltUD: this_stim['typicals_tiltsUD'],
        tilt_change: tilt_change.change,
        tilt_difference: tilt_change.diff,
        old_encoding_type: 'typical',
        old_encoding_pair: this_stim['oddity_identity'],

        old_race: meta[this_stim['typicals_identity']]['race_common'],
        old_gender: meta[this_stim['typicals_identity']]['gender_common'],
        new_race: meta[new_id]['race_common'],
        new_gender: meta[new_id]['gender_common'],

        old_mb: meta[this_stim['typicals_identity']][old_LR][old_UD]['mb_'+params.stimulus_version],
        new_mb: meta[new_id][new_LR][new_UD]['mb_'+params.stimulus_version],

        correct_response: curr_stims.indexOf(old_fname) + 1,
      }

      retrieval_trials.push(this_trial)
    }

  } // end loop over encoding trials

  retrieval_trials = shuffle(retrieval_trials); // randomize order
  return retrieval_trials;
}



function return_slider_trial(trial_info, trial_type) {
  var trial  = {
    type: 'image-slider-response',
    // stimulus_info: trial_info, // don't need anymore
    stimulus: trial_info.stimulus,
    slider_width: 300,
    labels: ["definitely didn't see", '|', "definitely saw"],
    slider_start: 50, //Math.round(Math.random()*100),
    require_movement: true,
    response_ends_trial: true,
    post_trial_gap: 200,
    on_finish: function(data) {

      data.meta = {}; // adds metadata
      Object.keys(meta[trial_info.identity]).forEach(function(item) {
        if (meta[trial_info.identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
          data.meta[item] = meta[trial_info.identity][item]
        }
      });

      // add all trial_info stuff to data
      Object.keys(trial_info).forEach(function(item) {
        data[item] = trial_info[item]
      });

      data.trial_type = trial_type
      data.trial_number = jsPsych.data.get().filter({trial_type: trial_type}).count()
      data.correct = (data.response < 50 && data.correct_response == 1) || (data.response > 50 && data.correct_response == 2) 
      data.experiment_id = experiment_id
      data.datetime = new Date().toLocaleString();
      data = format_data_for_server(data, params)
      console.log('Retrieval data:', data)
      if (!params.local) {
        save_trial_to_database(data)  
      }
    }
  }
  return trial
}

function return_afc_trial(trial_info, trial_type) {

  var trial = {
    type: 'html-slider-response',
    stimulus: "<p><img src='" + trial_info.stimuli[0] +"' ></img><img src='" + trial_info.stimuli[1] + "' ></img></p>", //style = 'width:30%'
    slider_width: 300,
    start: 50, //Math.round(Math.random()*100),
    labels: ["&#x2190;", '|', "&#x2192;"],
    prompt: '<p>Which face was in Part 1?</p>',
    response_ends_trial: true,
    trial_duration: params.retrieval_max_trial_time,
    require_movement: true,
    render_on_canvas: false, // custom plugin wont work without this for now
    post_trial_gap: 200,

    on_finish: function(data) {

      // add metadata of old and new faces
      data['meta_old'] = {}
      Object.keys(meta[trial_info.old_identity]).forEach(function(item) {
        if (meta[trial_info.old_identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
          
          data['meta_old'][item] = meta[trial_info.old_identity][item]
        }
      });
      data['meta_new'] = {}
      Object.keys(meta[trial_info.new_identity]).forEach(function(item) {
        if (meta[trial_info.new_identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
          data['meta_new'][item] = meta[trial_info.new_identity][item]
        }
      });

      // add all trial_info stuff to data
      Object.keys(trial_info).forEach(function(item) {
        data[item] = trial_info[item]
      });

      data.trial_type = trial_type
      data.trial_number = jsPsych.data.get().filter({trial_type: trial_type}).count()

      data.correct = (data.response < 50 && data.correct_response == 1) || (data.response > 50 && data.correct_response == 2) 

      data.experiment_id = experiment_id
      data.datetime = new Date().toLocaleString();
      data = format_data_for_server(data, params)
      console.log('Retrieval data:', data)
      if (!params.local) {
        save_trial_to_database(data)  
      }
    }
  }
  return trial
}



function return_afc_trial_keyboard(trial_info, trial_type) {

  var trial = {
    type: 'html-keyboard-response',
    stimulus: "<p><img src='" + trial_info.stimuli[0] +"'></img><img src='" + trial_info.stimuli[1] + "'></img></p>", //style = 'width:30%'
    choices: [37, 39],
    prompt: '<p>Which face was in part 1?</p><p><b>&#x2190; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &#x2192;</b></p>',
    response_ends_trial: true,
    trial_duration: params.retrieval_max_trial_time,

    on_finish: function(data) {

      // add metadata of old and new faces
      data['meta_old'] = {}
      Object.keys(meta[trial_info.old_identity]).forEach(function(item) {
        if (meta[trial_info.old_identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
          
          data['meta_old'][item] = meta[trial_info.old_identity][item]
        }
      });
      data['meta_new'] = {}
      Object.keys(meta[trial_info.new_identity]).forEach(function(item) {
        if (meta[trial_info.new_identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
          data['meta_new'][item] = meta[trial_info.new_identity][item]
        }
      });

      // add all trial_info stuff to data
      Object.keys(trial_info).forEach(function(item) {
        data[item] = trial_info[item]
      });

      data.trial_type = trial_type
      data.trial_number = jsPsych.data.get().filter({trial_type: trial_type}).count()

      data.correct = data.correct_response == params.key_[data.key_press] // 1 for left, 2 for right

      data.experiment_id = experiment_id
      data.datetime = new Date().toLocaleString();
      data = format_data_for_server(data, params)
      console.log('Retrieval data:', data)
      if (!params.local) {
        save_trial_to_database(data)  
      }
    }
  }
  return trial
}





















////////////////////////////////////////////// tyler's old custom functions /////////////////////////////////////

function get_preset_trial_stimuli(i_cat, i_var, i_object, n_to_return){

// this function is grotesque :::laughs:::   

var keep_inds = []
var rotation_info = {'xy':[], 'xz':[], 'yz':[]}
var variation_info = []   
for (i_item=0; i_item < meta_filler[i_cat]['names'].length; i_item ++) {
  
  var object_match = meta_filler[i_cat]['names'][i_item] == i_object
  var variation_match = meta_filler[i_cat]['variation_level'][i_item] == i_var

  if ( object_match & variation_match ) {
    keep_inds.push(meta_filler[i_cat]['indices'][i_item])
    rotation_info['xy'].push(meta_filler[i_cat].rotation_xy[i_item])
    rotation_info['xz'].push(meta_filler[i_cat].rotation_xz[i_item])
    rotation_info['yz'].push(meta_filler[i_cat].rotation_yz[i_item]) 
    variation_info.push(meta_filler[i_cat].variation_level[i_item])
  }
} 

// get the random indices we'll use for both data types 
var random_indices = [...Array(keep_inds.length).keys()]
random_indices = shuffle(random_indices).slice(0,n_to_return)
// extract the preset trials here

var return_index = [] 
var rotation_return = {'xy':[], 'xz':[], 'yz':[]}
var variation_return = []   
for (i=0; i < random_indices.length; i++) {
  
  return_index.push( keep_inds[random_indices[i]] )
  rotation_return['xy'].push( rotation_info['xy'][random_indices[i]] )
  rotation_return['xz'].push( rotation_info['xz'][random_indices[i]] )
  rotation_return['yz'].push( rotation_info['xz'][random_indices[i]] )
  variation_return.push( variation_info[random_indices[i]] )
}
// separate oddity and typical info 
// some version of arr.splice(oddity_index, 1) 
return {index: return_index, rotation: rotation_return, variation: variation_return}
// change to return both oddity and typical info at once 
}


function get_image_info(i_cat, i_var, i_object, j_object, n_to_return){

// this function is grotesque :::laughs:::   
 /////// LEGACY CODE WE CAN USE TO GENERATE CONTROL TRIALS FOR THE MTURK VALIDATION

if ( i_var == 'V0' ){ 
     
  ///////////// GENERATE CONTROL TRIALS ////////////////////
  
  var n_to_return = params.n_objects_per_trial

  var control_indices = []
  var _control_indices = [] 
  for (i_item=0; i_item < meta_filler[i_cat]['names'].length; i_item ++) {
    
    var object_match = meta_filler[i_cat]['names'][i_item] == i_object
    var variation_match = meta_filler[i_cat]['variation_level'][i_item] == i_var
    var _object_match = meta_filler[i_cat]['names'][i_item] == j_object

    if ( object_match & variation_match ) {
      control_indices.push(meta_filler[i_cat]['indices'][i_item]) }
    if ( _object_match & variation_match ) { 
      _control_indices.push(meta_filler[i_cat]['indices'][i_item])
    }
  }

  control_indices = shuffle(control_indices).slice(0,n_to_return)
  oddity_info = {index: shuffle(_control_indices)[0], variation:'V0'}
  typical_info = {index: control_indices.slice(0, n_to_return-1), variation:'V0'}

} else { 
   
  ////////// EXTRACT STIMULI FROM PRESET INDICIES ///////////// 
  // console.log( params.group_type )
  var _ind_array = [0, 1, 2, 3, 4] 
  if (true) {//(params.group_type=='even'){
    _ind_select = _ind_array.filter(n => n%2==0)  
  } else{ 
    _ind_select = _ind_array.filter(n => n%2)    
  } 
  
  _ind_choice = shuffle(_ind_select)[0]
  //console.log(i_cat, i_object, j_object, _ind_choice)

  var i_trial = lesion_stimuli[i_cat][i_object][j_object][_ind_choice]
  
  /// generic method that isn't segmenting things into even and odds 
  /// var i_trial = shuffle(lesion_stimuli[i_cat][i_object][j_object])[0]
  
  oddity_info = {index: i_trial['oddity'], variation:'V3'}
  typical_info = {index: i_trial['typicals'], variation:'V3'}
  
  new_indices = i_trial['stimuli']
}

return {typical:typical_info, oddity: oddity_info}

}

function generate_stimuli(typical_category, oddity_category, i_variation, stimulus_path){

// get a random object from list of all objects
//console.log('typical_category:', typical_category)
var typical_object_index = get_random_index(meta_filler[typical_category]['template_names'])
var oddity_object_index = get_random_index(meta_filler[oddity_category]['template_names'])

// set category type
if (typical_category==oddity_category) {
  // if it's a within category, make sure they aren't the same object :) 
  while (typical_object_index == oddity_object_index ) {
    oddity_object_index = get_random_index( meta_filler[oddity_category]['template_names'])
  }
  var category_type = 'within_category'
} else {
  var category_type = 'between_category'
}

// get the name of each object
var typical_identity = meta_filler[typical_category]['template_names'][typical_object_index]
var oddity_identity =  meta_filler[oddity_category]['template_names'][oddity_object_index]

// extract indices and meta_filler in
//var typical_info = get_image_info(typical_category, i_variation, typical_identity, 3)
//var oddity_info = get_image_info(oddity_category, i_variation, oddity_identity, 1)
/////////// THIS IS WHAT WE'RE WORKING ON CHANGING, THE TWO LINES ABOVE ////////////////
var stimulus_info = get_image_info(typical_category, i_variation, typical_identity, oddity_identity) 

// finalize typical stimulus information (includes stimulus location) 
var stimuli = []
for (i_stim=0; i_stim<stimulus_info.typical.index.length; i_stim++){
  stimuli.push(stimulus_path + stimulus_info.typical.index[i_stim] + '.jpeg')
}

// finalize oddity stimulus infor (includes stimulus location)
var oddity_stimulus_file = stimulus_path + stimulus_info.oddity.index + '.jpeg'
 
// insert oddity at random location in stimuli to finalize choice array 
var random_location_within_array = Math.round(Math.random()*stimuli.length)
stimuli.splice(random_location_within_array, 0, oddity_stimulus_file);

// data to return  
trial_structure_info = {
                        stimuli:stimuli, 
                        comparison: category_type, 
                        correct_response: random_location_within_array+1,
                        typical_category:typical_category, 
                        oddity_category: oddity_category,
                        typical_indices: stimulus_info.typical.index, 
                        oddity_index: stimulus_info.oddity.index,
                        category_type: category_type, 
                        typical_identity:  typical_identity, 
                        oddity_identity: oddity_identity, 
                        variation_level: i_variation, 
                        //typical_rotation: stimulus_info.typical.rotation, 
                        //oddity_rotation: stimulus_info.oddity.rotation, 
                       }
//console.log( 'TRIAL STRUCTURE', trial_structure_info )  
return trial_structure_info
}



