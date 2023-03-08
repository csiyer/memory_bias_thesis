var jsPsychChoiceArrayFiller = (function (jspsych) {
  "use strict";

  const info = {
    name: "choice-array-filler",
    parameters: {
      stimulus: {
        type: jspsych.ParameterType.IMAGE,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The image to be displayed'
      },
      choices: {
        type: jspsych.ParameterType.KEYCODE,
        array: true,
        pretty_name: 'Choices',
        default: 'ALL_KEYS', 
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      prompt: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
      },
      stimulus_duration: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Stimulus duration',
        default: null,
        description: 'How long to hide the stimulus.'
      },
      trial_duration: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show trial before it ends.'
      },
      response_ends_trial: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, trial will end when subject makes a response.'
      },
      correct_resonse: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'The correct response XD',
        default: null,
        description: 'Data to pass along.'
      },
      stim_info: {
        type: jspsych.ParameterType.STRING,
        pretty_name: '',
        default: null,
        description: 'Data to save.'
      },
    },
  };

  /**
   * **choice-array-filler**
   *
   * Choice array used in filler 3-way oddity task.
   *
   * @author tyler bonnen
   */
  class ChoiceArrayFillerPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {
      var new_html = trial.prompt
      new_html += '<br><div>' + 
        '<div>' + // style="text-align:center;  display: flex" >' + 
          '<img style="flex: 1"  src="'+trial.stimulus[0]+'" id="choice-array-stimulus" width="350" height="350"></img>'+
          '<img style="flex: 2" src="'+trial.stimulus[1]+'" id="choice-array-stimulus" width="350" height="350"></img>'+
        '</div>' + 
        '<div style="text-align:center" >' +
          '<img style="" src="'+trial.stimulus[2]+'" id="choice-array-stimulus" width="350" height="350"></img>'+
        '</div>'+ 
        '</div>'

      // draw
      display_element.innerHTML = new_html;

      // store response
      var response = {
        rt: null,
        key: null,
        correct_response: trial.correct_response
      };

      // function to end trial when it is time
      const end_trial = () => {
        // kill any remaining setTimeout handlers
        this.jsPsych.pluginAPI.clearAllTimeouts();

        // kill keyboard listeners
        if (typeof keyboardListener !== "undefined") {
          this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
        }

        // gather the data to store for the trial
        stim_info = trial.stimulus_info
        var trial_data = {
          "rt": Math.round(response.rt),
          "timed_out": response.rt == undefined, 
          "stimulus": trial.stimulus,
          "key_press": response.key,
          'correct_response': trial.correct_response, 
          'typical_category': stim_info.typical_category, 
          'oddity_category': stim_info.oddity_category,
          'typical_indices': stim_info.typical_indices, 
          'oddity_index': stim_info.oddity_index,
          'variation_level': stim_info.variation_level, 
          'typical_rotation': stim_info.typical_rotation, 
          'oddity_rotation': stim_info.oddity_rotation,
          'typical_name': stim_info.typical_identity, 
          'oddity_name': stim_info.oddity_identity, 
        };

        // clear the display
        display_element.innerHTML = "";

        // move on to the next trial
        this.jsPsych.finishTrial(trial_data);
      };

      // function to handle responses by the subject
      var after_response = (info) => {
        // after a valid response, the stimulus will have the CSS class 'responded'
        // which can be used to provide visual feedback that a response was recorded
        display_element.querySelector("#choice-array-stimulus").className +=
          " responded";
        // only record the first response
        if (response.key == null) {
          response = info;
        }
        if (trial.response_ends_trial) {
          end_trial();
        }
      };

      // start the response listener
      if (trial.choices != "NO_KEYS") {
        var keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_response,
          valid_responses: trial.choices,
          rt_method: "performance",
          persist: false,
          allow_held_key: false,
        });
      }
      // hide stimulus if stimulus_duration is set
      if (trial.stimulus_duration !== null) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          display_element.querySelector("#choice-array-stimulus").style.visibility = "hidden";
        }, trial.stimulus_duration);
      }
      // end trial if trial_duration is set
      if (trial.trial_duration !== null) {
        this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
      }
    }
  }
  ChoiceArrayFillerPlugin.info = info;

  return ChoiceArrayFillerPlugin;
})(jsPsychModule);