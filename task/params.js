 params = {

  prolific_redirect_link: 'https://app.prolific.co/submissions/complete?cc=7FEF15D8',

  // GENERAL
  local: true, // CHANGE THIS

  stimulus_version: 'version1_gray_lm',
  stimulus_path: '../stimuli/version1_gray_lm/',
  filler_path: '../stimuli/objectome/',
  
  database : 'chris', 
  collection : 'main_task_3',
  iteration : 'prolific_afc3', // change this across different iterations

  base_pay_per_hour: 12.00, // in dollars
  show_pay: true, 
  inform_memory: false,

  background: 'lightgray',
  stim_background: 'lightgray',
  filler_background: "#808080",
  text_color: 'black',

  possible_tilts_LR: ['00C', '25L', '25R', '50L', '50R'],
  possible_tilts_UD: ['C', 'U', 'D'], // phase this out?
  categories: ['white', 'black'],


  // ENCODING
  encoding_n_trials_unique: 40, //per repeat, total is changed below
  encoding_repeats: 1, //how many times are all the encoding trials repeated
  encoding_max_trial_time: 10000, // max decision time until marked incorrect: 10 seconds

  encoding_practice_criterion: 3, // number of trials correct in a row before practice is over
  encoding_practice_n_faces: 3, // repeats with 4 faces

  encoding_feedback: false, //correct vs. incorrect
  encoding_bonus: .02, // bonus for each correct response (if params.bonus == true)
  encoding_penalty: .06, // penalty for each incorrect response

  can_typicals_repeat: false, // can the same typical be used in multiple trials?
  
  encoding_seconds_per_trial: 2, // helping to tell subjects the time
  encoding_good_performance: 0.9, // arbitrarily chosen, used to incentivize/scale total pay

  typicals_strategy: ['behavior_group_gender_hairmatch_bin', 'behavior_group_gender', 'behavior_group', 'behavior_similar'], //  rank order. Also have behavior_similar_hairmatch, behavior_group_gender_hairmatch, behavior_group_hairmatch(_bin)
  search_chunk: 20, //randomly selects out of first 20 in the chosen list of pairs
  miniblock_size: 4,

  //FILLER
  include_filler: true,
  filler_time: 1, //minutes
  filler_max_trial_time: 10000,
  filler_practice_criterion: 3,
  reference_categories: ['animals', 'chairs', 'planes'], // categories to draw the typicals from
  
  //copied from previous task; not all being used
  between_frequency : undefined, // between-category frequency is every between_frequency -1 trials
  control_frequency : 10, // control frequency
  // variation level for trial types
  experimental_variation_level : 'V3', 
  control_variation_level : 'V0', 
  n_objects_per_trial: 3, 

  filler_bonus: 0.02,
  filler_penalty: 0.06,
  filler_feedback: false,
  
  filler_seconds_per_trial: 3, // for estimating time
  filler_good_performance: 0.9, // used to incentivize/scale total pay


  // RETRIEVAL
  retrieval_probe_type: 'afc', // "afc" for alternative forced-choice, "sequential" for slider
  afc_pair: 'same', // vs. same-race

  retrieval_practice_n_trials: 3,
  retrieval_max_trial_time: 10000, //10 seconds

  retrieval_bonus: 0.05, // bonus for hit/cr
  retrieval_penalty: 0.08, // penalty for miss/fa

  portion_new: 0.445, // portion_old = 1-portion_new    // just to get 72 trials lol
  tilt_strategy: 'uniform_symmetric', // n/2 faces are un-rotated (0 degrees), n/2 faces are rotated (50 degrees); uniform_random also implemented
  possible_tilt_changes: [0, 50], //25

  test_on_oddities: true,
  test_on_typicals: false,

  retrieval_seconds_per_trial: 4, // help to tell subjects time
  retrieval_good_performance: 0.6, // used to incentivize/scale total pay

  key_: {37:1, 40:3, 39:2}, //for button presses
}

params.encoding_n_trials = params.encoding_n_trials_unique * params.encoding_repeats

// number of trials
params.filler_n_trials = Math.round(params.filler_time * 60 / params.filler_seconds_per_trial); //number of filler trials dependent on time

params.retrieval_n_old = params.encoding_n_trials_unique*params.test_on_oddities + params.encoding_n_trials_unique*params.test_on_typicals

if (params.retrieval_probe_type == 'afc') {
  params.retrieval_n_trials = params.retrieval_n_old
} else {
  params.retrieval_n_trials = Math.round(params.retrieval_n_old / (1-params.portion_new))
  params.retrieval_n_new = params.retrieval_n_trials - params.retrieval_n_old
}

// completion time estimates
params.encoding_completion_time = Math.ceil((params.encoding_n_trials * params.encoding_seconds_per_trial)/60);
params.filler_completion_time = Math.ceil((params.filler_n_trials * params.filler_seconds_per_trial)/60);
params.retrieval_completion_time = Math.ceil((params.retrieval_n_trials * params.retrieval_seconds_per_trial)/60);
params.total_other_time = 6; //estimate of minutes for instructions/practices/forms
params.total_completion_time = Math.ceil(params.encoding_completion_time + params.filler_completion_time + params.retrieval_completion_time + params.total_other_time);


// pay
params.base_payment = Math.round((params.base_pay_per_hour / 60 * params.total_completion_time)*10)/10 //base payment to shoot for $12/hour base, to nearest 10 cents

params.total_good_performance = (params.encoding_good_performance + params.filler_good_performance + params.retrieval_good_performance)/3
params.encoding_good_bonus = params.encoding_n_trials*params.encoding_good_performance*params.encoding_bonus - params.encoding_n_trials*(1-params.encoding_good_performance)*params.encoding_penalty
params.filler_good_bonus = params.filler_n_trials*params.filler_good_performance*params.filler_bonus - params.filler_n_trials*(1-params.filler_good_performance)*params.filler_penalty
params.retrieval_good_bonus = params.retrieval_n_trials*params.retrieval_good_performance*params.retrieval_bonus - params.retrieval_n_trials*(1-params.retrieval_good_performance)*params.retrieval_penalty
params.good_payment = params.base_payment + params.encoding_good_bonus + params.filler_good_bonus + params.retrieval_good_bonus


// cutoffs to be able to eart any bonus
params.encoding_cutoff = (100 * ( ( params.encoding_penalty ) / ( params.encoding_bonus + params.encoding_penalty) )).toFixed(0)
params.filler_cutoff = (100 * ( ( params.filler_penalty ) / ( params.filler_bonus + params.filler_penalty) )).toFixed(0)
params.retrieval_cutoff = (100 * ( ( params.retrieval_penalty ) / ( params.retrieval_bonus + params.retrieval_penalty) )).toFixed(0)

params.total_cutoff = Math.round(100 * (
  (params.encoding_n_trials*params.encoding_penalty + params.filler_n_trials*params.filler_penalty + params.retrieval_n_trials*params.retrieval_penalty) / 
  (params.encoding_n_trials*params.encoding_bonus+params.encoding_n_trials*params.encoding_penalty + params.filler_n_trials*params.filler_bonus+params.filler_n_trials*params.filler_penalty + params.retrieval_n_trials*params.retrieval_bonus+params.retrieval_n_trials*params.retrieval_penalty) 
  ))

params.max_bonus = params.encoding_n_trials*params.encoding_bonus + params.filler_n_trials*params.filler_bonus + params.retrieval_n_trials*params.retrieval_bonus //max possible bonus

