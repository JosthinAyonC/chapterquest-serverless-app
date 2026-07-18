/** Book as shown in the UI — mapped from GET /library. */
export interface Book {
  id: string;
  key?: string;
  title: string;
  author: string;
  language: string;
  level: string;
  audience?: string;
  summary: string;
  description?: string;
  coverColor: string;
  coverUrl?: string;
}
