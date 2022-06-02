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
  params.iteration = 'pilot_testing'
}
console.log('Iteration: ', params.iteration)


// 1. ENCODING INSTRUCTIONS
// 2. ENCODING PRACTICE
// 3. ENCODING DISCRIMINATION TASK
// 4. FILLER INSTRUCTIONS
// 5. FILLER DISCRIMINATION TASK
// 6. RETRIEVAL INSTRUCTIONS
// 7. RETRIEVAL PRACTICE
// 8. RETRIEVAL TASK
// 9. EXPERIMENT DEBRIEF + SURVEY QUESTIONS
// 10. POPULATING THE TIMELINE

var wrong_browser = {
		type: 'html-keyboard-response',
		stimulus: 'Welcome! Please reopen this page in Chrome to begin the experiment.',
		choices: []
};

var local_alert = {
    type: 'html-keyboard-response',
    stimulus: 'You are running this task locally! If you are a participant, please close this window and contact the experimenter.',
};

var welcome_fullscreen = {
  type: "fullscreen",
  message: function() {
    var message = "<p style= 'font-size:200%' ><b>Welcome to our experiment!</b></br></p>" + 
    "<p>The experiment will take approximately " + params.total_completion_time + " minute(s).</p>"

    if (params.inform_memory) {
      message += "<p>This experiment has three parts: <b>two visual tasks</b> and <b>one memory task</b>.</p>"
    } 

    if (params.show_pay) {
      message += "<p>You'll earn a base rate of <b>$" + params.base_payment.toFixed(2) + "</b> just for completing the experiment, as well as a <b>bonus</b> depending on your performance." +
      "<br>If you perform well (>" + params.total_good_performance.toFixed(2)*100 + "% accuracy), you can make <b>more than $" + params.good_payment.toFixed(2) + "!</b>" +
      "<br>If you don't perform well (<" + params.total_cutoff + "% accuracy), you'll make <b>just the base rate.</b></p>"
    }
    return message
  },
  button_label: "Click to enter full screen and begin experiment", 
  fullscreen_mode: true, 
  on_start: function() {
    document.body.style.backgroundColor = params.background
    document.body.style.color = params.text_color
  }
};

// 1. ENCODING INSTRUCTIONS (and general instructions) ////////////////////////////////////////////////////////////////////////////


var instructions_encoding = {
  type: "instructions",
  pages: function() {
    var pages = [
    // consent form
    "<p style='font-size:150%''><b>Consent Form</b></p>" + 
    "<p>Before we get started, feel free to take a look at our consent form, and download a copy for your records if you like:<p>" + 
    "<div style='padding:1%' >"  + 
      "<embed src='utils/online_consent.pdf' width='100%' height='400px' style='border: 2px solid lightgrey';/>" + 
    '</div>' + 
    "<p>Click 'Next' if you agree to participate and you will begin Part 1.</p>" ,  

    // PART ONE INSTRUCTIONS - Encoding task

    // example trial
    "<p style='font-size: 150%'><b>Part 1 Instructions</b></p>" +
    "<p>This part will last approximately " + params.encoding_completion_time + " minute(s).</p>" +
    "<p>You will view three faces at a time, like this:</p>" + 
    '<p><img  style="width:30%" src="utils/examples/example-trial.png"></img>'+    
    "<br>Two of the faces will be of the same person, shown from two different viewpoints." + 
    "<br>One of these faces will be of a different person.</p>",

    // trial instructions
    "<p style='font-size:150%'><b>Your task</b><p>" + 
    "<p>In each trial, your task is to identify the face that doesn't match the others.</p>" + 
    "<p>Use the arrow keys on your keyboard to choose the 'odd face out':</p>" + 
    "<p>" + 
      "<b>&#x2190;</b> (Left Arrow) Face on the left" + 
      '<br><b>&#x2192;</b> (Right Arrow) Face on the right' + 
      "<br><b>&#x2193;</b> (Down Arrow) Face on the bottom</p>" + 
    '<p><img  style="width:30%" src="utils/examples/example-trial-correct.png"></img></p>'+ 
    "<p>In the example above, you should select the <b>right</b> face by pressing the <b>right arrow (&#x2192;)</b> key.</p>" +
    "<p>We hope that these controls are intuitive once you start using them! If not, let us know :)</p>",  

    // timing/bonus/difficulty info
    "<p style='font-size: 150%'><b>More information</b></p>" +
    "<p><b>Timing</b></p>" +
    "<p>You will have " + params.encoding_max_trial_time/1000 + " seconds to complete each trial; if you don't respond in this time, the trial will be marked as incorrect.</p>" +
    "<p><b>Difficulty</b></p>" +
    "<p>Some of the faces may be quite similar to one another, so make sure you take your time in each trial!" ,  

    // practice trials 
    "<p style='font-size: 150%'><b>Part 1 Practice</b></p>" + 
    "<p>We'll give you a few practice trials now, to get familiar with the controls and see what this task is like.</p>" + 
    "<p>You can also use these practice trials to verify that you want to participate in the study.</p>" + 
    "<p>Once you get " + params.encoding_practice_criterion + " trials right, you'll move on to the experiment itself.</p>",
    ]

    if (params.show_pay) {
      pages[3] += "<p><b>Bonus</b></p>" +
      "<p>You'll earn $" + params.encoding_bonus.toFixed(2) + " towards your bonus for every trial you get right; you'll loose $" + params.encoding_penalty.toFixed(2) + " when you get it wrong.<br>" + 
      "That means you'll have to get at least " + params.encoding_cutoff + "% correct to earn any bonus in this section!</p>"
    }

    if (params.inform_memory) {
      pages.splice(3, 0, "<p>Later, in part 3, you will take a <b>memory test</b> for the faces you see in this part, so you'll want to remember them.</p>");
    }
    
    return pages
  }, 
  show_clickable_nav: true,
  show_page_number: false,
  post_trial_gap: 500,
  on_finish: function() {
    document.body.style.backgroundColor = params.stim_background
  }
};


// 2. ENCODING PRACTICE ///////////////////////////////////////////////////////////////////////////////////////////////////////////

var used_faces = []; // very important! keeps track of the faces we've already used

var practice_faces = generate_n_random_faces(used_faces, params.encoding_practice_n_faces, add_to_used = 1, categories = ['latinx']) // just for now 

// practice trial choice array 
var practice_trial  = {
  type: 'choice-array-task',
  stimulus: '',
  choices: [37, 39, 40], 
  prompt: '',  // 'Use either the <b>Left</b>, <b>Right</b>, or <b>Down</b> Arrow to choose the oddity',
  response_ends_trial: true,
  post_trial_gap: 200,
  on_start: function(data) {
    // practice_index = Math.round(Math.random() * (params.reference_categories.length-1) )
    shuffled = shuffle(practice_faces) //just to get random two
    test_trial = generate_encoding_stimulus(shuffled[0], shuffled[1]);
    data.stimulus_info = test_trial
    data.stimulus =  test_trial.stimuli
    data.correct_response = test_trial.correct_response
    data.trial_type = 'encoding_practice'
  }, 
  on_finish: function(data) {
    data.choice = params.key_[data.key_press]
    data.correct = data.correct_response == params.key_[data.key_press]
    data.trial_type = 'encoding_practice'
    practice_trials = jsPsych.data.get().filter({trial_type: 'encoding_practice'})
    n_practice_trials = practice_trials.count()
    
    if (n_practice_trials >= params.encoding_practice_criterion) { 
      correct_count = practice_trials.filter({correct:true}).count() 
    } else { correct_count = 0}  
    if ( ( correct_count >= params.encoding_practice_criterion)  ) {
      data.practice_threshold_met = true
    }

    data.trial_number = jsPsych.data.get().filter({trial_type: 'encoding_practice'}).count()
    data.choice = params.key_[data.key_press]
    data.experiment_id = experiment_id
    data.datetime = new Date().toLocaleString();
    data = format_data_for_server(data, params)
    console.log('Discrimination practice data:', data) 
    if (!params.local) {
      save_trial_to_database(data)  
    }
 }
}

// practice trial feedback
var practice_inter_trial_screen  = {
  type: 'image-keyboard-response',
  stimulus: '',
  // prompt is conditional -- changes once they meet criterion
  prompt: function() {
    // feedback about whether they got the answer right
    emoji = ['incorrect D:', 'correct :D'][jsPsych.data.get().last(1).filter({correct:true}).count()]
    // change display if they've met the practice threshhold
    practice_met = jsPsych.data.get().filter({practice_threshold_met:1}).count() 
    if (practice_met) { 
      exit = '<p>Press the space bar to end the practice trials </p>' 
    } else { 
      exit = '<p>Press the space bar to begin another practice trial</p>' 
    } 
    // set complete feedback string to present to subjects
    display = '<p style="font-size:200%"><b>'+emoji+'</b></p>'+exit
    return display
  }, 
  choices: [' '], 
}

// block with conditional loop based on criterion performance
var  practice_block= {
  timeline: [practice_trial, practice_inter_trial_screen],
  loop_function: function(data){
    exit_key = 'enter'
    
    practice_trials = jsPsych.data.get().filter({trial_type: 'encoding_practice'})
    n_practice_trials = practice_trials.count()
    
    if (n_practice_trials > 4) { 
      correct_count = practice_trials.filter({correct:true}).count() 
    } else { correct_count = 0} 
    
    last_key_press = jsPsych.data.getLastTrialData().values()[0].key_press
    exit_key_convert = jsPsych.pluginAPI.convertKeyCharacterToKeyCode(exit_key)
    practice_met = jsPsych.data.get().filter({practice_threshold_met:1}).count() 
    if ( ( practice_met) ) { // * (exit_key_convert == last_key_press ) ){
      return false; // break loop 
    } else {
      return true; // continue loop 
    }
  }, 
};

var encoding_inter_trial_screen  = {
  type: 'image-keyboard-response',
  stimulus: '',
  prompt: function() { 
    if (params.encoding_feedback) { 
      emoji = ['D:', ':D'][jsPsych.data.get().last(1).filter({correct:true}).count()]
    } else { emoji = '' 
    } 
    feedback = '<p><b>' + emoji + '</b></p><p>Press the space bar to begin the next trial</p>' 
    return feedback}, 
  choices: [' '], 
};

var part1_ready = {
 type: 'html-button-response',
 stimulus: function() {
  var output = '<p style="font-size:150%"><b>Nice work! Now you\'re ready to start Part 1. </b></p>' +
  "<p>You'll have " + params.encoding_max_trial_time/1000 + " seconds to find the odd face out in each trial"

  if (params.show_pay) {
    output += ", and remember:</p><p>There's a bonus (+$" + params.encoding_bonus.toFixed(2) + ") for each correct choice you make, " +
  "and a big penalty (-$" + params.encoding_penalty.toFixed(2) + ") for each mistake!<p>"
  } else {
    output += ".</p>"
  }

  if (params.inform_memory) {
    output += "<p><b>Lastly, remember that you will be tested on your memory of these faces later (in part 3)!</b></p>"
  }

  output += "<p>This part will last approximately " + params.encoding_completion_time + "  minute(s).</p>"//"<p>You'll recieve feedback at the end of the experiment, not after every trial.</p>" +
  
  return output
 },
  choices: ['Click to begin part 1'], 
  on_start: function(){  //turns un-gray
    document.body.style.backgroundColor = params.background
  },
  on_finish: function(){  //turns gray
    document.body.style.backgroundColor = params.stim_background
  }
};


// 3. ENCODING DISCRIMINATION TASK ////////////////////////////////////////////////////////////////////////////////////////////////

var oddities = [] 
for (let i = 0; i < params.encoding_n_trials/params.encoding_repeats; i+=4) { // construct oddities in miniblocks to get distributions right + pseudorandomization of order
  oddities = oddities.concat(generate_n_random_faces(used_faces, params.miniblock_size, add_to_used=1, categories = params.categories))
}

var typicals = generate_typicals(used_faces, oddities) // pair each with typical

encoding_stimuli = []
for (let i=0; i<oddities.length; i++) {
  encoding_stimuli[i] = generate_encoding_stimulus(oddities[i], typicals[i]) // generate each stim_info one by one
}
console.log("Encoding stimulus info: ", encoding_stimuli);

/*
Reference: details on information in encoding_stimuli
encoding_stimuli = array[]. At each index: 
{
    stimuli []
    oddity_index
    oddity_identity
    oddity_tiltLR
    oddity_tiltUD
    oddity_race
    oddity_gender
    typicals_indices
    typicals_identity
    typicals_tiltsLR
    typicals_tiltsUD
    typicals_race
    typicals_gendere
    correct_response
}
*/

var encoding_trials = [];

for (let i=0; i < params.encoding_n_trials/params.encoding_repeats; i++) {

	var this_trial  = {
    type: 'choice-array-task',
    stimulus_info: encoding_stimuli[i],
    stimulus: encoding_stimuli[i].stimuli,
    correct_response: encoding_stimuli[i].correct_response,
    choices: [37, 39, 40],
    prompt: '', // "<p>Select the different face with &#x2190;, &#x2192;, or &#x2193;</p>",
    trial_duration: params.encoding_max_trial_time, 
    response_ends_trial: true,
    post_trial_gap: 200,
    on_finish: function(data) {

      // save metadata of oddity
      data.oddity_meta = {};
      Object.keys(meta[data.oddity_identity]).forEach(function(item) {
        if (meta[data.oddity_identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
          data.oddity_meta[item] = meta[data.oddity_identity][item]
        }
      });
      // save metadata of typicals
      data.typicals_meta = {};
      Object.keys(meta[data.typicals_identity]).forEach(function(item) {
        if (meta[data.typicals_identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
          data.typicals_meta[item] = meta[data.typicals_identity][item]
        }
      });

      data.correct = data.correct_response == params.key_[data.key_press]
      data.trial_type = 'encoding'
      data.trial_number = jsPsych.data.get().filter({trial_type: 'encoding'}).count()
      data.choice = params.key_[data.key_press]
      data.experiment_id = experiment_id
      data.datetime = new Date().toLocaleString();
      data = format_data_for_server(data, params)
      console.log('Encoding trial data:', data)
      if (!params.local) {
        save_trial_to_database(data)
      }
    }
  }
	encoding_trials.push(this_trial)
};

// if repeating encoding trials, switch locations of encoding_stimuli and push to encoding_trials again 
for (let r = 1; r < params.encoding_repeats; r++) {
  // repeat this many times
  encoding_stimuli_repeat = shuffle(switch_locations(encoding_stimuli))
  console.log('Repeated encoding stimulus info: ', encoding_stimuli_repeat)
  for (let i=0; i < params.encoding_n_trials/params.encoding_repeats; i++) {
    var this_trial  = {
      type: 'choice-array-task',
      stimulus_info: encoding_stimuli_repeat[i],
      stimulus: encoding_stimuli_repeat[i].stimuli,
      correct_response: encoding_stimuli_repeat[i].correct_response,
      choices: [37, 39, 40],
      prompt: '', // "<p>Select the different face with &#x2190;, &#x2192;, or &#x2193;</p>",
      trial_duration: params.encoding_max_trial_time, 
      response_ends_trial: true,
      post_trial_gap: 200,
      on_finish: function(data) {

        // save metadata of oddity
        data.oddity_meta = {};
        Object.keys(meta[data.oddity_identity]).forEach(function(item) {
          if (meta[data.oddity_identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
            data.oddity_meta[item] = meta[data.oddity_identity][item]
          }
        });
        // save metadata of typicals
        data.typicals_meta = {};
        Object.keys(meta[data.typicals_identity]).forEach(function(item) {
          if (meta[data.typicals_identity][item].constructor != Object) { // only gets attributes that aren't dictionaries
            data.typicals_meta[item] = meta[data.typicals_identity][item]
          }
        });
        data.correct = data.correct_response == params.key_[data.key_press]
        data.trial_type = 'encoding'
        data.trial_number = jsPsych.data.get().filter({trial_type: 'encoding'}).count()
        data.choice = params.key_[data.key_press]
        data.experiment_id = experiment_id
        data.datetime = new Date().toLocaleString();
        data = format_data_for_server(data, params)
        console.log('Encoding trial data:', data)
        if (!params.local) {
          save_trial_to_database(data)
        }
      } //end on-finish
    } // end this_trial 
    encoding_trials.push(this_trial)
  } //end inner for loop

} //end outer for loop


  



// 4. FILLER INSTRUCTIONS /////////////////////////////////////////////////////////////////////////////////////////////////////////

var instructions_filler = {
  type: "instructions",
  pages: function() {
    var pages = [
      "<p style='font-size: 150%'><b>Part 2</b></p>" +
      //"<p>We will now move on to Part 2 of the experiment.</p>" +
      "<p>This part will last approximately " + params.filler_completion_time + " minute(s).</p>", 

      "<p style='font-size: 150%'><b>Part 2 Instructions</b></p>" +
      "<p>In this part, you will be performing the same task as in Part 1.</p>" +
      "<p>However, instead of faces, you will be choosing the 'odd image out' between images like the ones below:</b></p>" +
      '<p><img  style="width:35%" src="utils/examples/example-filler-blurred.png"></img></p>' +
      "<p>Your goal is again to find the <b>different object</b> (you can ignore the backgrounds), using the <b>&#x2190;</b> (Left Arrow), <b>&#x2192;</b> (Right Arrow), and <b>&#x2193;</b> (Down Arrow).</p>" + 
      "<p>In the trial above, you should select the <b>elephant</b> by clicking <b>&#x2193; (Down Arrow)</b></p>",

      // timing/bonus information
      "<p style='font-size: 150%'><b>More information</b></p>" +
      "<p><b>Timing</b></p>" +
      "<p>You will once again have " + params.filler_max_trial_time/1000 + " seconds to complete each trial, before the trial is marked as incorrect.</p>",

      // practice trials 
      "<p style='font-size: 150%'><b>Part 2 Practice</b></p>" + 
      "<p>We'll give you a few practice trials now.</p>" + 
      "<p>Once you get " + params.encoding_practice_criterion + " trials right, you'll move on to the experiment itself.</p>"
    ]

    if (params.show_pay) {
      pages[2] += "<p><b>Bonus</b></p>" + "<p>You'll earn $" + params.filler_bonus.toFixed(2) + " towards your bonus for every trial you get right; you'll loose $" + params.filler_penalty.toFixed(2) + " when you get it wrong.<br>"
    }
    return pages
  }, 
  show_clickable_nav: true,
  show_page_number: false,
  on_start: function() {
    document.body.style.backgroundColor = params.background
  },
  on_finish: function(){  //turns gray
    document.body.style.backgroundColor = params.filler_background
  }
};



// 5. FILLER DISCRIMINATION TASK /////////////////////////////

var filler_trials = []; // trials to populate

for (let i_trial=0; i_trial < params.filler_n_trials; i_trial++) {
	// select our reference categories in equal proportion 
	var typicals_ = params.reference_categories [ Math.floor(i_trial/(params.filler_n_trials/params.reference_categories.length)) ] 
	// select distractor category 
	if (i_trial%params.between_frequency==0) {
  		// only select from non-typical categories  
  		var remaining_ = Object.keys(meta_filler).filter(function(value){ return value != typicals_;});
  		oddity_ = remaining_[ get_random_index(remaining_) ] 
  		var oddity_type = 'between'
	} else {
	  //console.log('WITHIN!')
	  // within category discrimination
	  var oddity_ = typicals_
	  var oddity_type = 'within' 
	}

	// select distractor category 
	if (i_trial%params.control_frequency==0) { 
	  // within category discrimination
	  i_variation = params.control_variation_level
	} else {
	  i_variation = params.experimental_variation_level
	}

	// generate stimuli from typical and oddity categories
	stim_info = generate_stimuli(typicals_, oddity_, i_variation, params.filler_path)
	stim_info.oddity_type = oddity_type 

	var this_trial  = {
	  type: 'choice-array-filler',
	  stimulus_info: stim_info, 
	  stimulus: stim_info.stimuli,
	  correct_response: stim_info.correct_response, 
	  choices: [37, 39, 40],
	  prompt: '', // '<br>Use either <b>4</b>, <b>9</b>, <b>r</b>, or <b>i</b> to choose the oddity',  
	  response_ends_trial: true,
	  trial_duration: params.filler_max_trial_time,
	  post_trial_gap: 200,
	  on_finish: function(data) {
	    data.correct = data.correct_response == params.key_[data.key_press]
	    data.trial_type = 'filler'
	    data.oddity_type = [ 'between', 'within' ] [ ( data.typical_category == data.oddity_category ) * 1  ] 
	    data.choice_object = [ data.typical_name, data.oddity_name ] [ data.correct * 1 ]  
	    data.choice_category = [ data.typical_category, data.oddity_category ] [ data.correct * 1 ] 
	    data.trial_number = jsPsych.data.get().filter({trial_type: 'filler'}).count()  
	    data.choice = params.key_[data.key_press]

	    data.experiment_id = experiment_id
	    data.datetime = new Date().toLocaleString();

	    data = format_data_for_server(data, params)
	    console.log('Filler trial data: ', data)  
	    if (!params.local) {
	    	save_trial_to_database(data)
	    }
	  }
	}
	filler_trials.push(this_trial)
} // end for loop
filler_trials = shuffle(filler_trials)



/////// Filler practice: in this order so we can just pull from the filler_trials
// practice trial feedback
var filler_practice_inter_trial_screen  = {
  type: 'image-keyboard-response',
  stimulus: '',
  // prompt is conditional -- changes once they meet criterion
  prompt: function() {
    // feedback about whether they got the answer right
    emoji = ['incorrect D:', 'correct :D'][jsPsych.data.get().last(1).filter({correct:true}).count()]

    //counts number of correct filler_practice trials
    var all_done = jsPsych.data.get().filterCustom(function(trial) {
      return (trial.trial_type == 'filler' && trial.correct); //counts number of correct retrieval_practice trials completed
    });

    // determines exit string based on 1) if practice trials are done and 2) if they got it right
    if (all_done >= params.filler_practice_criterion) {
      exit = '<p>Press the space bar to end the practice trials</p>' 
    } else if (emoji == 'incorrect D:') {
      exit = '<p>Press the space bar to repeat this trial</p>' 
    } else {
      exit = '<p>Press the space bar to begin the next trial</p>' 
    }
    // set complete feedback string to present to subjects
    display = '<p style="font-size:200%"><b>'+emoji+'</b></p>'+exit
    return display
  }, 
  choices: [' '], 
}

// practice trials - 
var filler_practice_blocks = [];
for (let i=0; i < params.filler_practice_criterion; i++) {
  var practice_trial  = filler_trials[i];

  // loop that trial if they get it wrong
  var block_loop = {
    timeline:[practice_trial, filler_practice_inter_trial_screen],
    loop_function: function(data) {
      return (!jsPsych.data.get().last(2).values()[0].correct); //if correct, don't repeat loop. if incorrect, loop.
    } 
  }
  filler_practice_blocks.push(block_loop)
} //end for loop


var part2_ready = {
 type: 'html-button-response',
 stimulus: function() {
  var output = '<p style="font-size:150%"><b>You will now begin Part 2.</b></p>' +
  "<p>You'll have " + params.filler_max_trial_time/1000 + " seconds to complete each trial"
  if (params.show_pay) {
    output += ", and remember:</p><p>There's a bonus (+$" + params.filler_bonus.toFixed(2) + ") for each correct choice you make, " +
  "and a big penalty (-$" + params.filler_penalty.toFixed(2) + ") for each mistake!<p>"
  } else {
    output += ".</p>"
  }
  output += "<p>This part will last approximately " + params.filler_completion_time + "  minute(s).</p>"
  return output
 },
  choices: ['Click to begin part 2'], 
  on_start: function(){  //turns un-gray
    document.body.style.backgroundColor = params.background
  },
  on_finish: function(){  //turns gray
    document.body.style.backgroundColor = params.filler_background
  }
};




// 6. RETRIEVAL INSTRUCTIONS //////////////////////////////////////////////////////////////////////////////////////////////////////

/*
Reference: details on information in retrieval_stimuli
retrieval_stimuli = array[]. At each index: 
{
    stimulus
    identity
    race
    gender
    original_index
    tiltLR
    tiltUD
    original_tiltLR
    tilt_change
    tilt_difference
    encoding_type
    encoding_pair
    retrieval_condition
    correct_response (0 = new, 1 = old)
}

for AFC:
{
  stimuli
  new_index
  new_identity
  new_tiltLR
  new_tiltUD

  old_index
  old_identity
  old_original_index
  old_tiltLR
  old_tiltUD
  old_original_tiltLR
  old_original_tiltUD
  old_tilt_change
  old_tilt_difference
  old_encoding_type
  old_encoding_pair
  old_race
  old_gender
  new_race
  new_gender
  correct_response? 
}
*/

if (params.retrieval_probe_type == 'afc') {
  var retrieval_stimuli = generate_retrieval_stimuli_afc(used_faces, encoding_stimuli)
} else {
  var retrieval_stimuli = generate_retrieval_stimuli(used_faces, encoding_stimuli)
}

console.log("Memory stimulus info: ", retrieval_stimuli);


var instructions_retrieval = {
  type: "instructions",
  pages: function() {
    var pages = [];
    if (params.retrieval_probe_type == 'afc') {
      pages = [
      "<p style='font-size: 150%'><b>Part 3</b></p>" +
      "<p>We will now move on to the final part of the experiment.</p>" +
      "<p>This part will last approximately " + params.retrieval_completion_time + " minute(s).</p>", 

      "<p style='font-size: 150%'><b>Part 3 Instructions</b></p>" +
      "<p>In this part, you will see a series of faces, now <b>two at a time</b>.</p>" +
      "<p><img style = 'width:26%' src='utils/examples/retrieval-old.png'></img><img style = 'width:30%' src='utils/examples/retrieval-new.png'></img></p>" +
      "<p>One face you have seen in Part 1, one face you haven't.<br>Your task is to decide which face you have seen before.</p>",

      "<p style='font-size: 150%'><b>Part 3 Instructions</b></p>" +
      "<p>Once you decide which face was in Part 1, you will indicate your decision on a slider like the one below.</p>" +
      "<p><img style = 'width:26%' src='utils/examples/retrieval-old.png'></img><img style = 'width:30%' src='utils/examples/retrieval-new.png'></img></p>" +
      '<br><input type="range" class="jspsych-slider" value=50 style="width:30%"></input>' +
      "<p style='font-size: 75%'>&#x2190; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &#x2192;</p>" + 
      "<p>Move the slider towards the face you think was in Part 1, and your answer can reflect how confident you are." +
      "<br>The slider will always start at the midpoint. Feel free to drag this slider around to see how it works.</p>", 
      
      "<h2>We use the slider for <b>two reasons</b>:</h2>" +
      "<p>" + 
      "<br>1. <b>To evaluate your accuracy:</b> when calculating your bonus, we determine whether your decision on each trial was on the correct side. <br>" +
      "<br>2. <b>It tells us how confident you are in your decision:</b> this wont be used to evaluate your performance, but it's very important!<br>Where you put the slider helps us understand your subjective experience of remembering, which is an important part of memory. </p>",

      "<p style='font-size: 150%'><b>Example Trial</b></p>" +
      "<p>So, your answer along the slider should represent <b>1) which face was in Part 1,</b> and <b>2) your confidence in your decision.</b></p>" +
      "<p>For the trial below, you might be pretty sure that you saw the <b>left face</b> in the part 1 (this face was in fact in the Part 1 Instructions).</p>" +
      "<p>So, you might put the slider around here (and be correct, because your answer is left of the midpoint '|'):" + 
      "<p><img style = 'width:26%' src='utils/examples/retrieval-old.png'></img><img style = 'width:30%' src='utils/examples/retrieval-new.png'></img></p>" +
      '<br><input type="range" class="jspsych-slider" value=25 style="width:30%"></input>' +
      "<p style='font-size: 75%'>&#x2190; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &#x2192;</p>",
      

      // timing information
      "<p style='font-size: 150%'><b>More information</b></p>" +
      "<p><b>Timing</b></p>" +
      "<p>You will have " + params.retrieval_max_trial_time/1000 + " seconds to complete each trial, before the trial is marked as incorrect.</p>" +
      "<p><b>Other issues</b></p>" +
      "<p>If you have any glitches or issues (e.g., both faces aren't showing), please contact the experimenter!</p>",

      // practice trials 
      "<p style='font-size: 150%'><b>Part 3 Practice</b></p>" + 
      "<p>We'll give you a few practice trials now, to get familiar with the task.</p>" + 
      "<p>The practice trials will give you feedback and repeat trials until you get them right, but the real task will not.</p>" +
      "<p>Press 'Next' to continue to the practice, and then to the task itself.</p>"
      ]

      if (params.show_pay) {
        pages[5] += "<p><b>Bonus</b></p>You'll earn a big bonus of <b>$" + params.retrieval_bonus.toFixed(2) + "</b> for every correct answer; you'll lose <b>$" + params.retrieval_penalty.toFixed(2) + "</b> for every wrong one.<br>"
      }
      return pages
    } else { // params.retrieval_probe_type == 'sequential'
        pages = [
      "<p style='font-size: 150%'><b>Memory Test</b></p>" +
      "<p>We will now move on to the final part of the experiment.</p>" +
      "<p>This part will last approximately " + params.retrieval_completion_time + " minute(s).</p>", 

      "<p style='font-size: 150%'><b>Part 3 Instructions</b></p>" +
      "<p>In this part, you will see a series of faces, now <b>one at a time, like the one below.</b></p>" +
      "<p><img style = 'width:30%' src='utils/examples/retrieval-old.png'></img></p>" +
      "<p>Your task will be to determine <b>if the face was present in Part 1 or not.</b></p>",

      "<p style='font-size: 150%'><b>Part 3 Instructions</b></p>" +
      "<p>Once you decide if the face was present or not in Part 1, you will indicate your decision on a slider like the one below.</p>" +
      "<p><img style = 'width:20%' src='utils/examples/retrieval-old.png'></img>" +
      '<br><input type="range" class="jspsych-slider" value=50 style="width:30%"></input>' +
      "<p style='font-size: 75%'>definitely didn't see &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; definitely saw </p>" + 
      "<p>The slider will always start at the midpoint. Feel free to drag this slider around to see how it works.", 
      
      "<h2>We use the slider for <b>two reasons</b>:</h2>" +
      "<p>" + 
      "<br>1. <b>To evaluate your accuracy:</b> when calculating your bonus we determine whether your decision on each trial was on the appropriate side. <br> For example, if the face was in part one (i.e. you've seen it before), you should place the slider to the right of the midpoint (i.e. right of the '|')" +
      "<br><br>2. <b>It tells us how confident you are in your decision.</b> This wont be used to evaluate your performance, but it's very important!<br>Where you put the slider helps us understand your subjective experience of remembering, which is an important part of memory. </p>",

      "<p style='font-size: 150%'><b>Example Trials</b></p>" +
      "<p>So, your answer along the slider should represent your confidence in your decision.</p>" +
      "<p>For the trial below, you might be pretty sure that you saw this face in the Part 1 (this face was in fact in the Part 1 Instructions).</p>" +
      "<p>So, you might put the slider around here (and be correct!):" + 
      "<p><img style = 'width:20%' src='utils/examples/retrieval-old.png'></img>" +
      '<p style="font-size: 75%""><input type="range" class="jspsych-slider" value=85 style="width:30%"></input>' +
      "<br>definitely didn't see &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; definitely saw </p>",

      "<p style='font-size: 150%'><b>Example Trials</b></p>" +
      "<p>For this trial, you might think that this face was not present in Part 1, but you're not sure.</p>" +
      "<p>So, you might put the slider around here (and also be correct!):" + 
      "<p><img style = 'width:30%' src='utils/examples/retrieval-new.png'></img>" +
      '<br><input type="range" class="jspsych-slider" value=35 style="width:30%"></input></p>' +
      "<p style='font-size: 75%'>definitely didn't see &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; definitely saw </p>",

      // timing information
      "<p style='font-size: 150%'><b>More information</b></p>" +
      "<p><b>Timing</b></p>" +
      "<p>You will have " + params.retrieval_max_trial_time/1000 + " seconds to complete each trial, before the trial is marked as incorrect.</p>",

      // practice trials 
      "<p style='font-size: 150%'><b>Part 3 Practice</b></p>" + 
      "<p>We'll give you a few practice trials now, to get familiar with the slider task.</p>" + 
      "<p>The practice trials will give you feedback and repeat trials until you get them right, but the real task will not.</p>" +
      "<p>Press 'Next' to begin.</p>"
      ]

      if (params.show_pay) {
        pages[6] += "<p><b>Bonus</b></p>" +
        "<p>For faces you saw in Part 1, any answer closer to the <b>right side</b> of the slider is correct. <br> For faces you didn\'t see in Part 1, any answer closer to the <b>left side</b> is correct.<br>" + 
        "You'll earn a <b>big bonus of $" + params.retrieval_bonus.toFixed(2) + "</b> for every correct answer; you'll lose <b>$" + params.retrieval_penalty.toFixed(2) + "</b> for every wrong one.<br>"
      }
      return pages
    }
  },
  show_clickable_nav: true,
  show_page_number: false,
  post_trial_gap: 500,
  on_start: function(){  //turns un-gray
    document.body.style.backgroundColor = params.background
  },
  on_finish: function(){  //turns gray
    document.body.style.backgroundColor = params.stim_background
  }
};


// 7. RETRIEVAL PRACTICE ///////////////

// practice trial feedback
var retrieval_practice_inter_trial_screen  = {
  type: 'image-keyboard-response',
  stimulus: '',
  // prompt is conditional -- changes once they meet criterion
  prompt: function() {
    // feedback about whether they got the answer right
    emoji = ['incorrect D:', 'correct :D'][jsPsych.data.get().last(1).filter({correct:true}).count()]

   	//counts number of correct retrieval_practice trials
    var all_done = jsPsych.data.get().filterCustom(function(trial) {
    	return (trial.trial_type == 'retrieval_practice' && trial.correct); //counts number of correct retrieval_practice trials completed
    });

    // determines exit string based on 1) if practice trials are done and 2) if they got it right
    if (all_done >= params.retrieval_practice_n_trials) {
    	exit = '<p>Press the space bar to end the practice trials</p>' 
    } else if (emoji == 'incorrect D:') {
    	exit = '<p>Press the space bar to repeat this trial</p>' 
    } else {
    	exit = '<p>Press the space bar to begin the next trial</p>' 
    }
    // set complete feedback string to present to subjects
    display = '<p style="font-size:200%"><b>'+emoji+'</b></p>'+exit
    return display
  }, 
  choices: [' '], 
}

// practice trials - 
var retrieval_practice_blocks = [];
for (let i=0; i < params.retrieval_practice_n_trials; i++) {

  if (params.retrieval_probe_type == 'afc') {
    var practice_trial = return_afc_trial(retrieval_stimuli[i], 'retrieval_practice')
  } else {
    var practice_trial  = return_slider_trial(retrieval_stimuli[i], 'retrieval_practice') 
  }

	// loop that trial if they get it wrong
	var block_loop = {
		timeline:[practice_trial, retrieval_practice_inter_trial_screen],
		loop_function: function(data) {
			return (!jsPsych.data.get().last(2).values()[0].correct); //if correct, don't repeat loop. if incorrect, loop.
		} 
	}
	retrieval_practice_blocks.push(block_loop)
} //end for loop


//final reminder
var part3_ready = {
  type: 'html-button-response',
  stimulus: function() {
    var output = '<p style="font-size:150%"><b>Now you\'re ready to start Part 3!</b></p>' + 
    "<p>You'll have " + params.retrieval_max_trial_time/1000 + " seconds for each trial" 

    if (params.show_pay) {
      output += ", and remember:</p><p>There's a bonus (+$" + params.retrieval_bonus.toFixed(2) + ") for each correct choice you make, " +
    "and a big penalty (-$" + params.retrieval_penalty.toFixed(2) + ") for each mistake!<p>"
    } else {
      output += ".</p>"
    }
    
    output += "<p>This part will last approximately " + params.retrieval_completion_time + "  minute(s).</p>"
    return output
  },
  button_label: '<p style="color:"><b>Click to enter full screen and begin part 3</b></p>', 
  choices: ['Click to begin part 3'],
  on_start: function(){  //turns un-gray
    document.body.style.backgroundColor = params.background
  },
  on_finish: function(){  //turns gray
    document.body.style.backgroundColor = params.stim_background
  }
};



// 8. RETRIEVAL TASK ////////////////////////////////////////////////////////

var retrieval_trials = [];

for (let i = params.retrieval_practice_n_trials; i < retrieval_stimuli.length; i++) { // start after practice trials

  if (params.retrieval_probe_type == 'afc') {
    var this_trial = return_afc_trial(retrieval_stimuli[i], 'retrieval')
  } else {
    var this_trial  = return_slider_trial(retrieval_stimuli[i], 'retrieval') 
  }

  retrieval_trials.push(this_trial)
}

// experimental screens between trials
var retrieval_inter_trial_screen  = {
  type: 'image-keyboard-response',
  stimulus: '',
  prompt: function() { 
    if (params.retrieval_feedback) { 
      emoji = ['D:', ':D'][jsPsych.data.get().last(1).filter({correct:true}).count()]
    } else { emoji = '' 
    } 
    feedback = '<p><b>' + emoji + '</b></p><p>Press the space bar to begin the next trial</p>' 
    return feedback}, 
  choices: [' '], 
}




// 9. EXPERIMENT DEBRIEF + SURVEY QUESTIONS ///////////////////////////////////////////////////////////////////////////////////////
var experiment_debrief = {
  type: 'html-button-response',
  stimulus: function() {
    var encoding_trials = jsPsych.data.get().filter({trial_type: 'encoding'});
    var encoding_correct = encoding_trials.filter({correct: true});
    var encoding_incorrect = encoding_trials.filter({correct: false});
    var encoding_bonus = encoding_correct.count() * params.encoding_bonus - encoding_incorrect.count() * params.encoding_penalty;
    n_encoding = encoding_trials.count();
    encoding_accuracy = Math.round(encoding_correct.count() / encoding_trials.count() * 100);
    encoding_rt = (Math.round(encoding_trials.select('rt').mean())/1000).toFixed(2)

    var filler_trials = jsPsych.data.get().filter({trial_type: 'filler'});
    var filler_correct = filler_trials.filter({correct: true});
    var filler_incorrect = filler_trials.filter({correct: false});
    var filler_bonus = filler_correct.count() * params.filler_bonus - filler_incorrect.count() * params.filler_penalty;
    n_filler = filler_trials.count();
    filler_accuracy = Math.round(filler_correct.count() / filler_trials.count() * 100);
    filler_rt = (Math.round(filler_trials.select('rt').mean())/1000).toFixed(2)

    var retrieval_trials = jsPsych.data.get().filter({trial_type: 'retrieval'});
    var retrieval_correct = retrieval_trials.filter({correct: true});
    var retrieval_incorrect = retrieval_trials.filter({correct: false});
    var retrieval_bonus = retrieval_correct.count() * params.retrieval_bonus - retrieval_incorrect.count() * params.retrieval_penalty;
    n_retrieval = retrieval_trials.count();
    retrieval_accuracy = Math.round(retrieval_correct.count() / retrieval_trials.count() * 100)
    retrieval_rt = (Math.round(retrieval_trials.select('rt').mean())/1000).toFixed(2)

    time_elapsed = (jsPsych.data.getLastTrialData().values()[0].time_elapsed / 1000 / 60).toFixed(2)
    total_bonus = Math.max(0, encoding_bonus + filler_bonus + retrieval_bonus)
    pretty_bonus = Math.max(total_bonus,0).toFixed(2)
    total_payment = (total_bonus + params.base_payment).toFixed(2)
    console.log("ALKDJFKLDSJFDSF", total_payment)

    var short_debrief = "<p style='font-size: 150%'><b>Nice Work!</b></p>" +
      "<p>In part 1, you responded correctly on " + encoding_accuracy + "% of the trials"+
      " with an average response time of " + encoding_rt + " seconds.</p>"+
      "<p>In part 2, you responded correctly on " + filler_accuracy + "% of the trials"+
      " with an average response time of " + filler_rt + " seconds.</p>"+
      "<p>In part 3, you responded correctly on " + retrieval_accuracy + "% of the trials"+
      " with an average response time of " + retrieval_rt + " seconds.</p>"
      if (params.show_pay) {
        short_debrief += "<p><b>You earned a bonus of <b>$" + pretty_bonus + "</b> for a total of <b>$" + total_payment + "</b> in " + time_elapsed  + " minutes!</b></p>" 
      }
      
      short_debrief += "<p>Before you finish, please press 'Continue' to answer a couple questions so you receive credit for your participation."
    return short_debrief
  },
  choices: ['Continue'],
  response_ends_trial: true,
  on_start: function(){  
    document.body.style.backgroundColor = params.background
  },
  on_finish:  function(data) {
    //data = {} // this line was supremely messing me up for some reason
    data.params = params

    data.trial_type = 'summary'
    data.experimental_duration = time_elapsed
    data.total_bonus = pretty_bonus
    data.total_payment = total_payment

    data.encoding_n_trials = n_encoding
    data.encoding_accuracy = encoding_accuracy
    data.encoding_avg_rt = encoding_rt

    data.filler_n_trials = n_filler
    data.filler_accuracy = filler_accuracy
    data.filler_avg_rt = filler_rt


    data.retrieval_n_trials = n_retrieval
    data.retrieval_accuracy = retrieval_accuracy
    data.retrieval_avg_rt = retrieval_rt

    data.experiment_id = experiment_id
    data.datetime = new Date().toLocaleString();
  
    data = format_data_for_server(data, params) 
    if (!params.local) {
      save_trial_to_database(data)  
    }
    console.log('Summary data:', data)
  }
}

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
  '<p>If other, fill in here: <input type="text" id="gender_other" name="gender_other" ></p>' +

  '<p><b>Age: </b><br><input type="text" id="age" name="age"></p><br>',

  button_label: "Click to submit your data and end the experiment.",
  on_finish: function(data) {
    data.trial_type = 'demographics'
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



// OTHER //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// these updates will happen after parts 1 and 2 to give an update on performance
var bonus_update_1 = {
	type: 'html-button-response',
	stimulus: function() {
		var display = "<p style='font-size: 150%'><b>You have finished Part 1!</b></p>"

		var last_trials = jsPsych.data.get().filter({trial_type: 'encoding'});
		var correct = last_trials.filter({correct: true})
		var incorrect = last_trials.filter({correct: false})
		encoding_accuracy = correct.count() / last_trials.count() //global
		var pretty_accuracy = Math.round(encoding_accuracy * 100)

		if (pretty_accuracy <= params.encoding_cutoff) { //earning no bonus
			projected_bonus = 0;
			curr_bonus = 0; // for later
			display += "<p>On this section, you averaged <b>" + pretty_accuracy + "% accuracy</b>.</p>"
      if (params.show_pay) {
        display += "<p>At this rate, you won't earn any bonus above the base rate.<br>Take your time on the next parts to make sure you can make a bonus!</p>"
      }
				
		} else {
			// still calculating bonus predictions to inform if I ever re-implement them. But, not showing them to the subject
			curr_bonus = correct.count()*params.encoding_bonus + incorrect.count()*params.encoding_penalty //global
			var filler_projected = encoding_accuracy*params.filler_n_trials*params.filler_bonus - (1-encoding_accuracy)*params.filler_n_trials*params.filler_penalty
			var retrieval_projected = encoding_accuracy*params.retrieval_n_trials*params.retrieval_bonus - (1-encoding_accuracy)*params.retrieval_n_trials*params.retrieval_penalty

			projected_bonus = curr_bonus + filler_projected + retrieval_projected
			var projected_total = projected_bonus + params.base_payment

			display += "<p>Nice job! On this section, you averaged <b>" + pretty_accuracy + "% accuracy</b>.</p>"
      if (params.show_pay) {
        display += "<p>You're on track to earn a good bonus. Keep up the good work!</p>" 
      }
		}
		display += "<p>Click 'Next' to continue to Part 2.</p>"
		return display
	},
	choices:['Next'],
	on_finish: function(data) {
		//save to later check if the predictions are good
		data.trial_type = 'bonus_update'
		data.last_trial_type = 'encoding'
		data.prediction = projected_bonus
    data.experiment_id = experiment_id
    data.datetime = new Date().toLocaleString();
		data = format_data_for_server(data, params)
		console.log('Bonus update data:', data)
    if (!params.local) {
      save_trial_to_database(data)  
    }
	}
}

var bonus_update_2 = {
	type: 'html-button-response',
	stimulus: function() {
		var display = "<p style='font-size: 150%'><b>You have finished Part 2!</b></p>"

		var previous_bonus = curr_bonus

		var last_trials = jsPsych.data.get().filter({trial_type: 'filler'});
		var correct = last_trials.filter({correct: true})
		var incorrect = last_trials.filter({correct: false})
		filler_accuracy = correct.count() / last_trials.count() 
		var pretty_accuracy = Math.round(filler_accuracy * 100)

		if (pretty_accuracy <= params.filler_cutoff) { //earning no bonus
			projected_bonus = 0;
			display += "<p>On this section, you averaged <b>" + pretty_accuracy + "% accuracy</b>.</p>"
      if (params.show_pay) {
        display += "<p>At this rate, you won't earn any bonus above the base rate.<br>Take your time on the next parts to make sure you can make a bonus!</p>"
      }
		} else {
			curr_bonus = correct.count()*params.filler_bonus + incorrect.count()*params.filler_penalty
			var mean_accuracy = (encoding_accuracy + filler_accuracy)/2
			var retrieval_projected = mean_accuracy*params.retrieval_n_trials*params.retrieval_bonus - (1-mean_accuracy)*params.retrieval_n_trials*params.retrieval_penalty

			projected_bonus = previous_bonus + curr_bonus + retrieval_projected
			var projected_total = projected_bonus + params.base_payment

			display += "<p>Nice job! On this section, you averaged <b>" + pretty_accuracy + "% accuracy</b>.</p>"
			if (params.show_pay) {
        display += "<p>You're on track to earn a good bonus. Keep up the good work!</p>" 
      }
		}
		display += "<p>Click 'Next' to continue to Part 3.</p>"
		return display
	},
	choices:['Next'],
	on_finish: function(data) {
		//save to later check if the predictions are good
		data.trial_type = 'bonus_update'
		data.last_trial_type = 'filler'
		data.prediction = projected_bonus
    data.experiment_id = experiment_id
    data.datetime = new Date().toLocaleString();
		data = format_data_for_server(data, params)
		console.log('Bonus update data:', data)
    if (!params.local) {
      save_trial_to_database(data)  
    }
	}
}


var full_screen_close = {
  type: 'fullscreen',
  fullscreen_mode:false,
}

var end_screen = {
  type: 'html-keyboard-response',
  stimulus: '<p>Thank you for completing the experiment! Press any key to be redirected back to Prolific.</p>',
  response_ends_trial: true
}


// 10. POPULATING THE TIMELINE ////////////////////////////////////////////////////////////////////////////////////////////////////

var timeline = []


if (get_browser_type() != 'Chrome') {
	timeline.push(wrong_browser)
}
if (params.local) {
  timeline.push(local_alert)
}

timeline.push(instructions_retrieval)
timeline.push(welcome_fullscreen)

// ENCODING
timeline.push(instructions_encoding)
timeline.push(practice_block)
timeline.push(part1_ready) //final reminder

for (let i=0; i < encoding_trials.length; i++) {
  timeline.push(encoding_trials[i], encoding_inter_trial_screen)
}

timeline.push(bonus_update_1)


if (params.include_filler) {
  // FILLER
  timeline.push(instructions_filler)
  // filler practice
  for (let i=0; i < filler_practice_blocks.length; i++) {
    timeline.push(filler_practice_blocks[i])
  }
  timeline.push(part2_ready) // final reminder

  // filler trials
  for (let i=params.filler_practice_criterion; i < filler_trials.length; i++) {
    timeline.push(filler_trials[i], encoding_inter_trial_screen)
  }
  timeline.push(bonus_update_2)
}

// RETREIVAL
timeline.push(instructions_retrieval)
// retrieval practice
for (let i=0; i < retrieval_practice_blocks.length; i++) {
  timeline.push(retrieval_practice_blocks[i])
}
timeline.push(part3_ready) //final reminder
// memory trials
for (let i=0; i < retrieval_trials.length; i++) {
  timeline.push(retrieval_trials[i], retrieval_inter_trial_screen)
}

// debrief block/questionnaires
timeline.push(experiment_debrief)
timeline.push(demographics_form)
timeline.push(full_screen_close)

//ending screen
timeline.push(end_screen)

// initialize jsPsych experiment  
jsPsych.init({
  timeline: timeline,
  on_finish: function() {
    console.log('pew pew!')
    window.location = params['prolific_redirect_link'] 
  }
});
