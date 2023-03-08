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
      if (Math.abs(trials[x].tilt_difference) == 25) {
        output[0]++
      } else {
        output[1]++
      }

    } else if (trials[x].old_race == 'black') {
      if (Math.abs(trials[x].tilt_difference) == 25) {
        output[2]++
      } else {
        output[3]++
      }
    } 
  }
  return output // [white_0, white_tilt, black_0, black_tilt]
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

function generate_encoding_stimulus (identity) {

  var tiltLR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)]
  var tiltUD = params.possible_tilts_UD[get_random_index(params.possible_tilts_UD)]

  var trial_info = {
    stimulus: params.stimulus_path + 'id' + identity + "_" + tiltLR + "_" + tiltUD + ".png",
    identity: identity,
    tiltLR: tiltLR,
    tiltUD: tiltUD,
    race: meta[identity]['race_common'],
    gender: meta[identity]['gender_common'],
    mb: meta[identity]
  }
  return trial_info
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


function generate_retrieval_stimuli_afc (used_faces, encoding_stimuli) {
  // uses params.portion_tilt and params.possible_tilts for tilts

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
  var n_tilt_w = Array(params.possible_tilt_changes.length).fill(params.retrieval_n_trials/params.categories.length/params.possible_tilt_changes.length)
  var n_tilt_b = [...n_tilt_w] // [10,10] in this case, to indicate the number of tilts

  for (let i =0; i < idxs.length; i++) { // loop randomly through encoding, to not systematically tilt faces presented earlier
    this_stim = encoding_stimuli[idxs[i]]

    if (params.tilt_strategy == 'uniform_symmetric' && this_stim['race'] == 'black') {
      for (let j = 0; j < n_tilt_b.length; j++) {
        if (n_tilt_b[j] > 0) {
          n_tilt_b[j]--
          old_LR = get_new_tilt(this_stim['tiltLR'], params.possible_tilt_changes[j])
          break
        }
      }

    } else if (params.tilt_strategy == 'uniform_symmetric' && this_stim['race'] == 'white') {
      for (let j = 0; j < n_tilt_w.length; j++) {
        if (n_tilt_w[j] > 0) {
          n_tilt_w[j]--
          old_LR = get_new_tilt(this_stim['tiltLR'], params.possible_tilt_changes[j])
          break
        }
      }
    } else {
      console.log("Retrieval trial generation: not uniform_symmetric")
      old_LR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)]
    }

    tilt_change = get_tilt_change(this_stim['tiltLR'], old_LR)

    old_fname = params.stimulus_path + "id" + this_stim['identity'] + "_" + old_LR + "_" + this_stim['tiltUD'] + ".png"


    // now get the new face to pair it with
    if (params.afc_pair == 'other') {
      new_id = generate_new_identity(used_faces, category = params.categories.filter(x => x != this_stim['race']))
    } else {
      new_id = generate_new_identity(used_faces, category = this_stim['race'])
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
      old_identity: this_stim['identity'],
      old_original_index: idxs[i],
      old_tiltLR: old_LR,
      old_tiltUD: this_stim['tiltUD'],
      old_original_tiltLR: this_stim['tiltLR'],
      old_original_tiltUD: this_stim['tiltUD'],
      tilt_change: tilt_change.change,
      tilt_difference: tilt_change.diff,
      
      old_race: this_stim['race'],
      old_gender: this_stim['gender'],

      new_race: meta[new_id]['race_common'],
      new_gender: meta[new_id]['gender_common'],

      old_mb: meta[this_stim['identity']][old_LR][this_stim['tiltUD']]['mb_'+params.stimulus_version],
      new_mb: meta[new_id][new_LR][new_UD]['mb_'+params.stimulus_version],

      correct_response: curr_stims.indexOf(old_fname) + 1,
    }
    retrieval_trials.push(this_trial)

  } // end loop over encoding trials

  retrieval_trials = shuffle(retrieval_trials); // randomize order
  return retrieval_trials;
}


function return_afc_trial(trial_info, trial_type) {

  var trial = {
    type: jsPsychHtmlSliderResponse,
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
    type: jsPsychHtmlKeyboardResponse,
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


function get_all_imagepaths(encoding_stimuli, retrieval_stimuli) {
  var images = []
  for (let i = 0; i < encoding_stimuli.length; i++) {
    images.push(encoding_stimuli[i].stimulus)
  }
  for (let i = 0; i < retrieval_stimuli.length; i++) {
    if (params.retrieval_probe_type == 'afc') {
      images.push(retrieval_stimuli[i].stimuli[0], retrieval_stimuli[i].stimuli[1])
    } else {
      images.push(retrieval_stimuli[i].stimulus)
    }
  }
  return images
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
// choices: ['ArrowLeft', 'ArrowRight', 'ArrowDown'],
return trial_structure_info
}



