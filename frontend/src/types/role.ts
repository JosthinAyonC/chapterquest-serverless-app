export type RoleId =
  | 'facilitator'
  | 'discussion-director'
  | 'investigator'
  | 'connector'
  | 'illustrator'
  | 'vocabulary-inspector';

export interface Role {
  id: RoleId;
  nameEn: string;
  nameEs: string;
  wheelLabel: string;
  description: string;
  color: string;
  icon: string;
}
