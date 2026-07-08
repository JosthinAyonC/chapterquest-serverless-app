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

export const MOCK_BOOKS: Book[] = [
  {
    id: 'charlottes-web',
    title: "Charlotte's Web",
    author: 'E.B. White',
    language: 'EN',
    level: '5–6',
    summary:
      'A tender story of friendship between a pig named Wilbur and a wise spider named Charlotte on a farm.',
    coverColor: '#633A2C',
  },
  {
    id: 'bridge-terabithia',
    title: 'Bridge to Terabithia',
    author: 'Katherine Paterson',
    language: 'EN',
    level: '6–8',
    summary:
      'Two friends create an imaginary kingdom in the woods, learning about courage, loss, and imagination.',
    coverColor: '#800000',
  },
  {
    id: 'matilda',
    title: 'Matilda',
    author: 'Roald Dahl',
    language: 'EN',
    level: '4–6',
    summary:
      'A brilliant girl with telekinetic powers stands up to unkind adults and finds refuge in books.',
    coverColor: '#B88A2C',
  },
  {
    id: 'wild-robot',
    title: 'The Wild Robot',
    author: 'Peter Brown',
    language: 'EN',
    level: '3–5',
    summary:
      'A robot stranded on a wilderness island learns to survive and connect with the animals around her.',
    coverColor: '#4a6741',
  },
  {
    id: 'house-on-mango',
    title: 'The House on Mango Street',
    author: 'Sandra Cisneros',
    language: 'EN/ES',
    level: '7–9',
    summary:
      'Vignettes of a young Latina growing up in Chicago, exploring identity, community, and dreams.',
    coverColor: '#B8860B',
  },
  {
    id: 'giver',
    title: 'The Giver',
    author: 'Lois Lowry',
    language: 'EN',
    level: '7–9',
    summary:
      'In a controlled society, a boy receives memories of the past and questions the world he knows.',
    coverColor: '#5c4033',
  },
];

export function getBookById(id: string): Book | undefined {
  return MOCK_BOOKS.find((b) => b.id === id);
}
