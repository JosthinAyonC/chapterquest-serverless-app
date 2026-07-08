import type { RoleId } from './roles';

export interface MockReview {
  id: string;
  participantName: string;
  roleId: RoleId;
  message: string;
}

export const EXTRA_MOCK_REVIEWS: Omit<MockReview, 'id'>[] = [
  {
    participantName: 'Sofia',
    roleId: 'connector',
    message:
      'This story reminded me of when my family moved to a new city — change can be scary but also full of possibility.',
  },
  {
    participantName: 'Diego',
    roleId: 'investigator',
    message:
      'I looked up the author and learned the book was inspired by real events from their childhood.',
  },
  {
    participantName: 'Emma',
    roleId: 'illustrator',
    message:
      'I drew the moment the main character finally speaks up — the colors were warm gold and deep red.',
  },
  {
    participantName: 'Lucas',
    roleId: 'vocabulary-inspector',
    message:
      'Words I loved: "perseverance", "resilience", and "wonder" — they capture the whole theme.',
  },
  {
    participantName: 'Mia',
    roleId: 'discussion-director',
    message:
      'What would you do differently if you were in the protagonist\'s shoes at the climax?',
  },
  {
    participantName: 'Noah',
    roleId: 'facilitator',
    message:
      'Our circle agreed the friendship theme was the heart of the story. Great discussion everyone!',
  },
];

export const INITIAL_MOCK_REVIEWS: MockReview[] = [
  {
    id: 'seed-1',
    participantName: 'Ana',
    roleId: 'facilitator',
    message:
      'I loved how the author opened with a question that made us all want to keep reading.',
  },
  {
    id: 'seed-2',
    participantName: 'Carlos',
    roleId: 'connector',
    message:
      'The main character\'s courage connects to how we feel before presenting in class.',
  },
];
