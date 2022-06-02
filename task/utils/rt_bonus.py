from __future__ import print_function
from builtins import input
import datetime, os, json, boto, pymongo, numpy as np
from boto.mturk.connection import MTurkConnection

###### EXPERIMENT SPECIFIC PARAMETERS #######

# credential location
credential_location = '../../credentials/'
# aws key name
aws_rootkey = 'aws_keys.json'
# mongo key name
mongo_keys = 'mongo_keys'
mongo_database = 'oddity'
mongo_collection = 'reaction_time'
# live=1 for live, live=0 for sandbox
live=1
submission_file = 'HIT_submission_records_%s.npy'%(['sandbox', 'live'][live])

# REQUIRED data_tags = {'bonus': <your_bonus_name_in_summary>}
data_tags = {'bonus': 'total_bonus',
             # remaining arguments here are optional: will only be used to print out subject info in manual mode
             'feedback': 'worker_feedback', 'time': 'experiment_duration',
             'high_accuracy': 'high_average_accuracy', 'low_accuracy': 'low_average_accuracy', 
             'size_accuracy': 'size_average_accuracy' 
            }

# set to true if you want the option to manually bonus each subject after showing their summary data
manual_bonus_for_each_subject = True 
# set to true if you want a printout when subjects have already been bonused and what HIT you're working on 
verbose = True 

###### END EXPERIMENT SPECIFIC PARAMETERS #######

def extract_submission_info(submission_file):
    """
    extract hit info saved at the time of submission
    mturk_platform='live' or mturk_platform='sandbox'
    """
    return np.load(submission_file).item()

def establish_mturk_connection(location, keyname, live=1):
    """
    connect with mturk using credentials. returns mturk connection.
    """
    key_info = json.load(open(os.path.join(location, keyname), 'rb'))

    # extract account info and define platform
    if live:
        host = 'mechanicalturk.amazonaws.com'
        mturk_platform = 'live'
    else:
        host = 'mechanicalturk.sandbox.amazonaws.com'
        mturk_platform = 'sandbox'

    # establish mturk connection
    mturk = MTurkConnection(aws_access_key_id=key_info['access_key_id'],
                            aws_secret_access_key=key_info['secret_access_key'],
                            host=host)

    return mturk

def establish_mongo_connection(location, keyname, mongo_database, mongo_collection):
    """connect with server side database"""

    access_info = json.load(open(location + keyname))

    # requires established connection--$ ssh -fNL 27017:localhost:27017 tyler@stanfordmemorylab.com
    mongo_tunnel = 'mongodb://' + access_info['user'] + ':' + access_info['pwd'] + '@127.0.0.1'

    # conect, define collection and database
    connection = pymongo.MongoClient(mongo_tunnel)
    data_base = connection[mongo_database]
    collection = data_base[mongo_collection]

    return collection

def get_hit_and_worker_ids(submissions, i_submission):

    submission_info = submissions[i_submission]
    hit_id = submission_info['hit_id']
    subject_ids = np.array(collection.find({'hit_id':hit_id}).distinct('worker_id'))

    return hit_id, subject_ids

def determine_if_worker_needs_bonus(submissions, i_submission, i_subject):
    try:
        # check if they already have an 'assigned_bonus' variable in the hit submission info
        submissions[i_submission]['subject_info'][i_subject]
        if submissions[i_submission]['subject_info'][i_subject]['assigned_bonus'] == 1 :
            needs_bonus = 0
        else:
            needs_bonus = 1
    except:
        needs_bonus = 1

    return needs_bonus

def generate_record_for_inventory(subject_ids, submissions, i_submission):
    
    if len(subject_ids):

        try: submissions[i_submission]['subject_info']
        except: submissions[i_submission]['subject_info'] = {}

        for i_subject in subject_ids:

            try: submissions[i_submission]['subject_info'][i_subject]
            except: submissions[i_submission]['subject_info'][i_subject] = {}
    else:

        print('\n no subject data for this HIT\n')

    return submissions

def bonus_protocol(subject_ids, hit_id, i_submission, data_tags, manual=False, verbose=False):
    """
    Interactive function to compensate workers that have completed HITs that are in the submission file
    Extracts bonus info from the subject's 'summary' file on the server and uses this to bonus via mturk
    """

    # find all workers data who have completed this hit and get their summary info (from the server)
    w_data = {i['worker_id']: i for i in collection.find({'hit_id':hit_id, "trial_type":"summary"})}

    for i_subject in list(w_data.keys()):

        # format prespecified info to be printed out if you're in manual mode
        info = [tag + ': ' + str(w_data[i_subject][data_tags[tag]]) for tag in data_tags.keys() ]
        # get worker's assignment ID
        assignment_id = w_data[i_subject]['assignment_id']
        # determine amount of bonus subject earned
        bonus_amount =  float( w_data[i_subject][data_tags['bonus']] )
        # convert the bonus into the mturt relevant format
        converted_bonus = boto.mturk.price.Price(bonus_amount)
        # determine whether or not this worker has already been bonused
        needs_bonus = determine_if_worker_needs_bonus(submissions, i_submission, i_subject)
        
        print('\tworker', i_subject, end=' ')

        if needs_bonus:
            
            if manual: 

                # print out infor that might be relevant to manually assignment of bonus
                try: print('\n\t\t'.join(info) + '\n')
                except: print("no feedback data for subject")
                # option to accept manual message
                MSG = input("Enter a custom message? Pressing enter reverts to default. ")
                # otherwise use the default
                if len(MSG) == 0: MSG = "Thanks for participating in our study!"
                # option to accept manual bonus amount
                BONUS = input("Amount to bonus worker? Pressing enter reverts to {} ".format(bonus_amount))
                # otherwise use the default
                if len(BONUS) == 0: BONUS = bonus_amount
                # convert float to the relevant mturk format
                converted_bonus = boto.mturk.price.Price(BONUS)

            else:

                # automated message and bonus assiognment
                MSG = "Thanks for participating in our study!"
                BONUS = float(w_data[i_subject]['total_bonus'])
                converted_bonus = boto.mturk.price.Price(BONUS)

            try:


                if BONUS:
                    # if there's any bonus try to send it via mturk
                    s = mturk.grant_bonus(i_subject, assignment_id,  converted_bonus, MSG);
                    print('success!\n')
                else:
                    # otherwise just note they havne't earned any bonus in the submission file
                    s = 'NO BONUS EARNED'
                    print(s)

                # updata the submission file
                submissions[i_submission]['subject_info'][i_subject]['assigned_bonus'] = 1
                submissions[i_submission]['subject_info'][i_subject]['bonus_amount'] = converted_bonus
                submissions[i_submission]['subject_info'][i_subject]['return_message']  = {type(s): s}
                np.save(submission_file, submissions)

            except Exception as e:

                # updata the submission file
                ERROR = {type(e):e}
                submissions[i_submission]['subject_info'][i_subject]['assigned_bonus'] = 0
                submissions[i_submission]['subject_info'][i_subject]['bonus_amount'] = 0
                submissions[i_submission]['subject_info'][i_subject]['return_message']  = {type(e):e}
                print('ERROR\n') # me"}
                np.save(submission_file, submissions)

        else:

             if verbose: print('has already been bonused ') 

    return submissions


submissions = extract_submission_info(submission_file)
mturk = establish_mturk_connection(credential_location, aws_rootkey, live=live)
collection = establish_mongo_connection(credential_location, mongo_keys, mongo_database, mongo_collection)

for i_submission in list(submissions.keys()):
    hit_id, worker_ids = get_hit_and_worker_ids(submissions, i_submission)
    if verbose: print('\nprocessing workers for hit', hit_id, '\n') 
    submissions = generate_record_for_inventory(worker_ids, submissions, i_submission)
    submissions = bonus_protocol(worker_ids, hit_id, i_submission, data_tags, manual=manual_bonus_for_each_subject, verbose=verbose)

