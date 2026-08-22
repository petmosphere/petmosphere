alter table public.health_logs
drop constraint health_logs_observations_valid;

alter table public.health_logs
add constraint health_logs_observations_valid check (
  cardinality(observations) <= 10
  and array_position(observations, null) is null
  and observations <@ array[
    'ate_well',
    'playful',
    'good_poop',
    'slept_well',
    'friendly',
    'good_energy',
    'shiny_coat',
    'calm_relaxed',
    'drank_normally',
    'enjoyed_walk',
    'ate_less',
    'low_energy',
    'drank_more',
    'soft_poop',
    'scratching',
    'clingy',
    'restless',
    'skipped_treat',
    'slight_limp',
    'bad_breath',
    'vomited',
    'diarrhoea',
    'not_eating',
    'limping',
    'coughing',
    'shaking',
    'lethargic',
    'blood_in_stool',
    'eye_nose_discharge',
    'swelling_lump'
  ]::text[]
  and case status
    when 'doing_well' then observations <@ array[
      'ate_well',
      'playful',
      'good_poop',
      'slept_well',
      'friendly',
      'good_energy',
      'shiny_coat',
      'calm_relaxed',
      'drank_normally',
      'enjoyed_walk'
    ]::text[]
    when 'something_different' then observations <@ array[
      'ate_less',
      'low_energy',
      'drank_more',
      'soft_poop',
      'scratching',
      'clingy',
      'restless',
      'skipped_treat',
      'slight_limp',
      'bad_breath'
    ]::text[]
    when 'concerned' then observations <@ array[
      'vomited',
      'diarrhoea',
      'not_eating',
      'limping',
      'coughing',
      'shaking',
      'lethargic',
      'blood_in_stool',
      'eye_nose_discharge',
      'swelling_lump'
    ]::text[]
    else false
  end
);

comment on column public.health_logs.observations is
  'Optional owner-selected, non-diagnostic observations associated with the selected emotion.';
