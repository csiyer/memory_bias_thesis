/// mongo details

var supported_browsers = ['Chrome']


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
function mongo_extract_IDs(experiment_id){
  // send a request to node, which is listening for 'extract'
  socket.emit('extract_faceID_counts', experiment_id)
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
    for (i = a.length - 1; i > 0; i--) {
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
      if(property.includes('race') && !property.includes('sure')) {
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


/* this is a key function. 
it takes the idcount_data, which contains 1) array of 'id' names, and 2) index-matched counts of that id's #trials
it sorts this, and takes the *n* faces with the fewest trials
*/
function get_ids(idcount_data, n) {

  // get the relative rankings of each value in idcount_data['counts']
  var counts_sorted = idcount_data['counts'].slice().sort(function(a,b){return b-a})
  var ranks = idcount_data['counts'].map(function(v){ return counts_sorted.indexOf(v)+1 })
  // note that these ranks can repeat, so [0,0,1,3,0] would return [3,3,2,1,3]

  // now, get the ~n*2 ids with the lowest counts / highest rank
  var test = []
  for (i = Math.max(...ranks); i >= 1; i--) {

    test = ranks.filter(item => item >= i) // gets all values in [ranks] that are greater than or equal to threshold
    if (test.length >= n*2) {
      break; // to retain the i threshold
    }
  }

  // now we have threshold, just pull out all the ids with counts with ranks greater than that threshold
  var ids_pick_from = [] // this will be n*2 long
  for (j = 0; j < ranks.length; j++) {
    if (ranks[j] >= i) {
      ids_pick_from.push(idcount_data['id'][j])
    }
  }

  // shuffle to randomize and pull out the first n ids from those 
  var ids = shuffle(ids_pick_from).slice(0,n)

  return ids

  /* CODE TO GENERATE RANDOM IDS: would need to instantiate/pass used_faces
  var id = Object.keys(meta)[get_random_index(Object.keys(meta))] //random identity
  while (used_faces.includes(id)) {
    id = Object.keys(meta)[get_random_index(Object.keys(meta))]
  }
  used_faces.push(id)
  */
}

// takes in list of IDs and creates stim_info with filename, tilts, metadata
function generate_stimuli(ids) {

  var tilt_LR = ''
  var tilt_UD = ''
  var face_fname = ''
  var this_stim = {}
  var output = []

  for (i = 0; i < ids.length; i++) {
    tilt_LR = params.possible_tilts_LR[get_random_index(params.possible_tilts_LR)] //random tilt
    tilt_UD = params.possible_tilts_UD[get_random_index(params.possible_tilts_UD)]
    face_fname = meta[ids[i]][tilt_LR][tilt_UD]

    this_stim = {
      stimulus: face_fname,
      id: ids[i],
      tilt_LR: tilt_LR,
      tilt_UD: tilt_UD
    }
    Object.keys(meta[ids[i]]).forEach(function(item) { // add all other metdata
      if (item.length > 3) {
        output[item] = meta[ids[i]][item]
      } 
    })

    output.push(this_stim);
  }
  return output
}


/////////////////////////////////////////////////////////////////// you can respond before the face even shows up (1s) (delay stimulus onset cue)

function generate_class_trial(stim_info) {
  var trial = {
    type: 'survey-html-form',
    preamble: "<embed src=" + params.stimulus_path + stim_info.stimulus + " width='50%' height='70%' id='stimulus' style='visibility:hidden'/>",

    html: "<font size='3.5'>" +

    "<div style='float:left; text-align:left; padding-right:10px'>"+

    "<p style='text-align:center'><b>Race</b><br>" +
    "<p style='color:'><input type='checkbox' id='black' name='race1' value='black'>"+
    "<label for='black'> Black/African-American</label><br>" +
    "<input type='checkbox' id='white'  value='white' name='race2'>"+
    "<label for='white'> White/European American</label><br>" +
    "<input type='checkbox' id='east_asian'  value='east_asian' name='race3'>" +
    "<label for='east_asian'> East Asian</label><br>" +
    "<input type='checkbox' id='south_asian'  value='south_asian' name='race4'>" +
    "<label for='south_asian'> Indian/South Asian</label><br>" +
    "<input type='checkbox' id='latinx'  value='latinx' name='race5'>" +
    "<label for='latinx'> Latinx/Hispanic</label><br>" +
    "<input type='checkbox' id='other_race' value='other' name='race6'>" +
    "<label for='other_race'> Other/Unsure</label></p>"+

    // "<p>How sure are you?<br>" +
    "<input type='range' class='jspsych-slider' id='race_sure' name='race_sure' value=0 style='width:150px; align:center'></input></p>" +
    "<p style='font-size: 75%'>0% sure &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 100% sure</p>" +

    "</div>"+
    "<div style='float:left; text-align:left; padding-right:10px; padding-left:10px'>"+

    "<p style='text-align:center'><b>Gender</b><br></p>" +
    "<p><input type='checkbox' id='man' name='gender1' value ='man'>"+
    "<label for='man'> Man</label><br>" +
    "<input type='checkbox' id='woman' name='gender2' value='woman'>"+
    "<label for='woman'> Woman</label><br>" +
    "<input type='checkbox' id='other_gender' name='gender3' value='other'>" +
    "<label for='other_gender'> Other/Unsure</label></p>" +

    // "<p><b>How sure are you?</b><br>" +
    "<input type='range' class='jspsych-slider' id='gender_sure' name='gender_sure' value=0 style='width:150px; align:center'></input></p>" +
    "<p style='font-size: 75%'>0% sure &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 100% sure</p>" +

    "</div>"+
    "<div style='float:left; text-align:center; padding-left:10px'>"+

    "<p>Anything else you'd like to tell us<br> about this face (optional)?<br>" +

    "<textarea id='feedback'  name='feedback' rows='5' cols='20'></textarea></p>"+
    //"<input type='text' id='feedback' name='feedback' style=''></p><br>" +

    "</div> <div></div>" +

    "</font>",

    button_label: "Next",


    on_start: function() {
      document.body.style.backgroundColor = params.background
      document.body.style.color = params.text_color
    },

    on_load: function() {
      // wait for 3 seconds, then show the stimulus
      setTimeout(function () {
        document.getElementById('stimulus').style.visibility = "visible";
      }, 1000);
    },

    on_finish: function(data) {

      for (var property in data.response) { //factor out response
        if (!/[0-9]+$/.test(property)) {
          data["response_".concat(property)] = data.response[property]
        }
      }
      data['response_race'] = get_race_gender(data.response, 'race')
      data['response_gender'] = get_race_gender(data.response, 'gender')

      Object.keys(stim_info).forEach(function(item) { // save all stimuli metadata
        data[item] = stim_info[item]
      })

      data.trial_type = 'classification'
      data.trial_number = jsPsych.data.get().filter({trial_type: 'classification'}).count()

	    data.experiment_id = experiment_id
	    data.subject_id = subject_id
	    data.study_id = study_id
	    data.session_id = session_id
	    data.datetime = new Date().toLocaleString();
      data = format_data_for_server(data, params)

      TEST_DATA = {
        collection: data.collection, 
        database: data.database, 
        //id: data.id,
      }
      
      if (!params.local) {
        console.log('SAVING CLASSIFICATION TRIAL TO DATABASE', TEST_DATA, data)
        save_trial_to_database(data)
      }
      clearTimeout()
    }
  }
  return trial;
}




function populate_timeline(idcount_data) {
  var timeline = [];

  const sum = idcount_data['counts'].reduce((partial_sum, a) => partial_sum + a, 0); 
  console.log( 'SUM OF TRIALS COMPLETED', sum )

  if (get_browser_type() != 'Chrome') {
    timeline.push(wrong_browser)
  }

  if (params.local) {
    timeline.push(local_alert)
  }

  timeline.push(instructions)

  //////////////////// THE MEAT OF IT /////////////////////////////
  var ids_to_use = get_ids(idcount_data, params.n_trials) // this function will sort idcount_data ids by count, select n faces with lowest count
  var stimuli = generate_stimuli(ids_to_use)

  var trials = []; 
  for (i=0; i < params.n_trials; i++) {
    timeline.push(generate_class_trial(stimuli[i]))
  }
  //////////////////////////////////////////////////////////////////////

  // debrief block/questionnaires
  timeline.push(debrief)
  timeline.push(demographics_form)
  timeline.push(end_screen)

  // log data we've received on the client side
  console.log('client side mongo document received:\n:', idcount_data)
  // update text field in element with id 'db_return'

  return timeline;

}
