import type { Comment } from '../../common/models';

/** Repository skeleton — implement in MVP iteration */
export class CommentRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findByBook(_bookId: string): Promise<Comment[]> {
    return [];
  }
}
