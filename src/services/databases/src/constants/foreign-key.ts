export const FOREIGN_KEY_ACTIONS = [
  'NO ACTION',
  'RESTRICT',
  'CASCADE',
  'SET NULL',
  'SET DEFAULT',
] as const;

export const FOREIGN_KEY_UPDATE_ACTIONS = [
  'NO ACTION',
  'RESTRICT',
  'CASCADE',
] as const;

export const DEFAULT_FOREIGN_KEY_ACTION = 'NO ACTION' as const;

export type ForeignKeyAction = (typeof FOREIGN_KEY_ACTIONS)[number];
export type ForeignKeyUpdateAction = (typeof FOREIGN_KEY_UPDATE_ACTIONS)[number];
