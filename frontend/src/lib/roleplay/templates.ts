import type { RoleId } from '../../mocks/roles';

export type RoleplayMode = 'online' | 'download';

export interface RoleplayTemplate {
  roleId: RoleId;
  pdfPath: string;
  downloadName: string;
}

export const ROLEPLAY_TEMPLATES: Record<RoleId, RoleplayTemplate> = {
  facilitator: {
    roleId: 'facilitator',
    pdfPath: '/reviews/FACILITATOR.pdf',
    downloadName: 'Facilitator-Role-Review.pdf',
  },
  'discussion-director': {
    roleId: 'discussion-director',
    pdfPath: '/reviews/DISCUSSION_DIRECTOR.pdf',
    downloadName: 'Discussion-Director-Role-Review.pdf',
  },
  investigator: {
    roleId: 'investigator',
    pdfPath: '/reviews/INVESTIGATOR.pdf',
    downloadName: 'Investigator-Role-Review.pdf',
  },
  connector: {
    roleId: 'connector',
    pdfPath: '/reviews/CONNECTOR.pdf',
    downloadName: 'Connector-Role-Review.pdf',
  },
  illustrator: {
    roleId: 'illustrator',
    pdfPath: '/reviews/ILLUSTRATOR.pdf',
    downloadName: 'Illustrator-Role-Review.pdf',
  },
  'vocabulary-inspector': {
    roleId: 'vocabulary-inspector',
    pdfPath: '/reviews/VOCABULARY_INSPECTOR.pdf',
    downloadName: 'Vocabulary-Inspector-Role-Review.pdf',
  },
};

export function getRoleplayTemplate(roleId: RoleId): RoleplayTemplate {
  return ROLEPLAY_TEMPLATES[roleId];
}
