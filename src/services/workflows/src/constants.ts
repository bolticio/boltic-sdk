/** Polling interval in milliseconds between execution status checks */
export const POLLING_INTERVAL_MS = 1000;

/** Maximum number of polling attempts before a timeout error is returned */
export const MAX_POLLING_ATTEMPTS = 30;

/** Default retry configuration applied to every activity execution */
export const DEFAULT_RETRY_CONFIG = {
  maximum_attempts: 1,
  backoff_coefficient: 2,
  initial_interval: 1000,
  maximum_interval: 100000,
} as const;

/** Whether activity execution should continue on failure */
export const CONTINUE_ON_FAILURE = true;

export const SCHEMA_TYPE_MAPPING = {
  string: { type: 'string', fallback_value: '' },
  number: { type: 'number', fallback_value: '' },
  boolean: { type: 'boolean', secondary_type: 'string', fallback_value: '' },
  int: { type: 'number', fallback_value: '' },
  integer: { type: 'number', fallback_value: '' },
  'date-time': { type: 'date-time', secondary_type: 'string', fallback_value: '' },
  date: { type: 'date', secondary_type: 'string', fallback_value: '' },
  json: { type: 'object', fallback_value: {} },
  text: { type: 'string', fallback_value: '' },
  email: { type: 'string', fallback_value: '' },
  password: { type: 'string', fallback_value: '' },
  url: { type: 'string', fallback_value: '' },
  textarea: { type: 'string', fallback_value: '' },
  select: { type: 'string', fallback_value: '' },
  multiselect: { type: 'string', fallback_value: '' },
  autocomplete: { type: 'array', fallback_value: [] },
  radio: { type: 'string', fallback_value: '' },
  radiobuttons: { type: 'string', fallback_value: '' },
  checkbox: { type: 'array', fallback_value: [] },
  toggle: { type: 'boolean', fallback_value: '' },
  hidden: { type: 'string', fallback_value: '' },
  slider: { type: 'number', fallback_value: '' },
  datepicker: { type: 'string', fallback_value: '' },
  phoneinput: { type: 'string', fallback_value: '' },
  time: { type: 'string', fallback_value: '' },
  datetime: { type: 'string', fallback_value: '' },
  code: { type: 'string', fallback_value: '' },
  multitext: { type: 'array', fallback_value: [] },
  array: { type: 'array', fallback_value: [] },
  keyvalue: { type: 'object', fallback_value: {} },
  object: { type: 'object', fallback_value: {} },
  phone: { type: 'string', fallback_value: '' },
  'number[]': { type: 'string', fallback_value: '' },
  'number []': { type: 'string', fallback_value: '' },
  'object | any': { type: 'string', fallback_value: '' },
}
