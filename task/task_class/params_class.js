params = { 

  prolific_redirect_link: 'https://app.prolific.co/submissions/complete?cc=561DDF44',

  // GENERAL
  local: false,
  stimulus_path: '../stimuli/version1_gray_lm/',
  background: 'lightgray',
  text_color: 'black',

  base_pay_per_hour: 10.00,
  bonus: false, //not currently implemented

  possible_tilts_LR: ['00C', '25L', '25R', '50L', '50R'], // hopefully phase this out?
  possible_tilts_UD: ['C', 'U', 'D'], // phase this out?

  key_: {37:1, 40:3, 39:2}, //for button presses
  database : 'faces',
  collection : 'classification_task',
  iteration : 'non_prolific', // change this across different iterations

  n_trials: 20,
  seconds_per_trial: 10,
  instructions_time: 2,

}

params.stim_background = params.background

params.time_raw = params.instructions_time + params.n_trials * params.seconds_per_trial / 60
params.time = 6 //Math.round(params.instructions_time + params.n_trials * params.seconds_per_trial / 60)  // estimate of how long it will take in minutes, to 1 decimal

params.pay = 1.0 //Math.round((params.base_pay_per_hour/ 60 * params.time_raw) * 100) / 100 // pay, to 2 decimals

console.log(params.stimulus_path)
