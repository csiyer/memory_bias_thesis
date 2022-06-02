experiment_id = jsPsych.randomization.randomID(20) // random subject ID of length 20
console.log('Experiment ID: ', experiment_id)

var subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
var study_id = jsPsych.data.getURLVariable('STUDY_ID');
var session_id = jsPsych.data.getURLVariable('SESSION_ID');
jsPsych.data.addProperties({
  subject_id: subject_id,
  study_id: study_id,
  session_id: session_id
});
console.log('Prolific info:', subject_id, study_id, session_id)
if (subject_id == undefined) {
	params.iteration = 'non_prolific'
}
console.log('Iteration: ', params.iteration)


var wrong_browser = {
		type: 'html-keyboard-response',
		stimulus: 'Welcome! Please reopen this page in Chrome to begin.',
		choices: []
};

var local_alert = {
    type: 'html-keyboard-response',
    stimulus: 'You are running this task locally! Press space bar to begin',
    choices: ['space']
};


var instructions = {
  type: "instructions",
  pages: [ 
  "<p style= 'font-size:200%'><b>Welcome!</b></br></p>" + 
  "<p>This task will take around <b>" + params.time + " minute(s)</b>, and you will earn <b>$" + params.pay.toFixed(2) + "</b>.</p>",

  // instructions
  "<p style='font-size:150%'><b>Instructions</b></p>" + 
  "<p>You will see a series of faces, and you will be deciding the <b>race</b> and <b>gender</b> of each (you can select multiple boxes).</p>" + 
  "<p>You can also indicate your confidence about each decision using a slider like the one below. </p>" +
  '<br><input type="range" class="jspsych-slider" value=50 style="width:20%"></input>' +
  "<p style='font-size: 75%'>0% sure &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 100% sure</p>" +
  "<p>We encourage you to use the slider, but if you don't touch the slider, we won't use it.</p>" + 
  "<p>Lastly, you can tell us anything that stands out to you about each face (optional).</p>",

    // consent form
  "<p style='font-size:150%'><b>Consent Form</b></p>" + 
  "<p>Before we get started, feel free to take a look at our consent form, and download a copy for your records if you like:<p>" + 
  "<div style='padding:1%' >"  + 
    "<embed src='memory_lab_online_consent.pdf' width='100%' height='400px' style='border: 2px solid lightgrey';/>" + 
  '</div>' + 
  "<p>Click 'Next' if you agree to participate and are ready to begin.</p>"

  ], 

  show_clickable_nav: true,
  show_page_number: false,

  post_trial_gap: 500,

  on_start: function() {
    document.body.style.backgroundColor = params.background
    document.body.style.color = params.text_color
  }
};




var debrief = {
  type: 'html-button-response',
  stimulus:  
    "<p style='font-size:150%'><b>You are done!</b></p>" + 
    "<p>Thank you for completing this task!</p>" + 
    "<p>Before you go, we just need some information about you for our records.</p>",
  choices: ['Next'],
  on_start: function() {
    document.body.style.backgroundColor = params.background
  }
};


var demographics_form = {
  type: 'survey-html-form',
  html:   
  '<br><p style="font-size: 125%"><b>Demographics Questions</b></p>' +

  '<p><b>Race:</b> </p><p><input type="checkbox" id="native" name="race1" value="Native"/><label for="native">Native American/Alaskan </label>' +
  '<input type="checkbox" id="asian" name="race2" value="Asian"/><label for="asian">Asian </label>' +
  '<input type="checkbox" id="pacific" name="race3" value="Pacific Islander"/><label for="pacific">Pacific Islander </label>' +
  '<input type="checkbox" id="black" name="race4" value="Black"/><label for="black">Black/African American </label>' +
  '<input type="checkbox" id="white" name="race5" value="White"/><label for="white">White/European </label>' +
  '<input type="checkbox" id="latinx" name="race6" value="Latinx"/><label for="latinx">Hispanic/Latinx </label>' +
  '<input type="checkbox" id="other" name="race7" value="Other"/><label for="other">Other </label></p>' +

  '<p>Are you of Latinx/Hispanic origin, regardless of race? ' +
  '<input type="radio" id="latinx+" name="latinx" value="Yes"><label for="latinx+">Yes</label>' +
  '<input type="radio" id="latinx-" name="latinx" value="No"><label for="latinx-">No</label></p>' +

  '<p><b>Gender:</b></p><p>' +
  '<input type="radio" id="male" name="gender" value="Male"><label for="male">Male </label>' +
  '<input type="radio" id="female" name="gender" value="Female"><label for="female">Female </label>' +
  '<input type="radio" id="gender_other" name="gender" value="Other"><label for="gender_other">Other </label></p>' +
  '<p>If other, fill in here: <input type="text" id="gender_other" name="gender_other" ></p><br>',

  button_label: "Click to submit your data and end the experiment.",
  on_finish: function(data) {
	  data.trial_type = 'demographics'
	  data.subject_id = subject_id
	  data.study_id = study_id
	  data.session_id = session_id
	  data.experiment_id = experiment_id
    for (var property in data.response) {
      //don't want to add races anymore, it'll be added below
      if (!property.includes('race')) {
          data[property] = data.response[property] //put responses into the same format as all the other data
      }
    }
    data.race = get_race_gender(data.response, 'race') //now add race as an array of present races (the multiple checkboxes weren't working with jsPsych data...)
    data.datetime = new Date().toLocaleString();
    data = format_data_for_server(data, params)
    if (!params.local) {
      save_trial_to_database(data)  
    }
    console.log('Demographics data:', data)
  }
}


var end_screen = {
  type: 'html-keyboard-response',
  stimulus: '<p>Thank you! Press any key to be redirected to Prolific.</p>',
  response_ends_trial: true
}


/////////////// Populate the timeline ///////////////
// within the socket.on so we have access to idcount_dataa
socket.on('return_ids_from_database', function(variables) {
  console.log('VARIABLES', variables) 
  var count_info = {'counts':variables['counts'], 'id':variables['id']}
	//console.log('COUNTS: ', variables)
  if (variables['experiment_id'] == experiment_id){
    // initialize timeline + etc.
    var timeline = populate_timeline(count_info)

    jsPsych.init({
      timeline: timeline,
      on_finish: function() {
        console.log('pew pew!')
        window.location = params['prolific_redirect_link']
      }
    });
  } else {
    console.log( variables['experiment_id'], 'is starting their experiment, but we\'re ',  experiment_id)
  }
})

mongo_extract_IDs(experiment_id)
