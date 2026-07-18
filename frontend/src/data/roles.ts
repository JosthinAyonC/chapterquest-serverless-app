import type { Role, RoleId } from '../types/role';

/** Fixed product catalog — the six literature circle roles. */
export const ROLES: Role[] = [
  {
    id: 'facilitator',
    nameEn: 'Facilitator',
    nameEs: 'Facilitador',
    wheelLabel: 'Facilitator',
    description:
      'Opens discussion, summarizes, shares an interesting passage, asks questions, and keeps the group focused.',
    color: '#800000',
    icon: '🎯',
  },
  {
    id: 'discussion-director',
    nameEn: 'Discussion Director',
    nameEs: 'Director de discusión',
    wheelLabel: 'Director',
    description:
      'Prepares thoughtful questions that invite everyone to talk about the text.',
    color: '#633A2C',
    icon: '💬',
  },
  {
    id: 'investigator',
    nameEn: 'Investigator',
    nameEs: 'Investigador',
    wheelLabel: 'Investigator',
    description:
      'Brings extra information: author background, context, setting, and interesting facts.',
    color: '#B88A2C',
    icon: '🔍',
  },
  {
    id: 'connector',
    nameEn: 'Connector',
    nameEs: 'Conector',
    wheelLabel: 'Connector',
    description:
      'Finds connections text-to-self, text-to-world, and text-to-text.',
    color: '#B8860B',
    icon: '🔗',
  },
  {
    id: 'illustrator',
    nameEn: 'Illustrator',
    nameEs: 'Ilustrador',
    wheelLabel: 'Illustrator',
    description:
      'Creates a drawing or visual of an event, character, or central idea from the reading.',
    color: '#9a5c28',
    icon: '🎨',
  },
  {
    id: 'vocabulary-inspector',
    nameEn: 'Vocabulary Inspector',
    nameEs: 'Inspector de vocabulario',
    wheelLabel: 'Vocabulary',
    description:
      'Highlights key words, meanings, and descriptive expressions from the text.',
    color: '#6b4226',
    icon: '📖',
  },
];

export function getRoleById(id: RoleId): Role {
  const role = ROLES.find((r) => r.id === id);
  if (!role) throw new Error(`Unknown role: ${id}`);
  return role;
}

export function shuffleRoles(): Role[] {
  const copy = [...ROLES];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
