export const ROLE_REVIEW_TITLE = 'What is a Review?';

export const ROLE_REVIEW_BODY = `A review is your personal opinion about a book. Before creating it, think about your audience. You can make your review for classmates your age or for adults, using language and ideas that fit your readers or viewers. Share your review as a video, infographic, or short written post.`;

export const ROLE_REVIEW_OBJECTIVE_TITLE = 'Objective';

export const ROLE_REVIEW_OBJECTIVE = `To express your ideas in English, reflect on your reading, and communicate effectively by adapting your review to a specific audience through a creative format.`;

export const ROLEPLAY_HOST_STEPS = [
  'Scan the QR code or open the link on your phone or tablet.',
  'Choose your name from the circle roster.',
  'Pick online review (fill on screen) or download the PDF template.',
  'Complete your worksheet, then record and upload your review video.',
  'Tap Finish when your video upload is complete.',
] as const;

export const ROLEPLAY_ALREADY_RESPONDED = `You already completed this review. Thank you for taking part in the circle!`;

export const UPLOAD_VIDEO_TITLE = 'Upload your review video';

export const UPLOAD_VIDEO_SUBTITLE =
  'Record a short video review in English. This step is required before you can finish.';

export const UPLOAD_VIDEO_DROP_HINT =
  'Drag and drop your video here, or tap to choose a file';

export const UPLOAD_VIDEO_FORMATS = 'Accepted formats: MP4, MOV, WebM · Max 200 MB';

export const WORKSHEET_CONTINUE_BUTTON = 'Continue to next step';

export const WORKSHEET_COMPLETE_NOTE =
  'This worksheet has 2 pages. Complete both before printing or continuing.';

export const UPLOAD_VIDEO_REQUIRED_MODAL_TITLE = 'Video required';

export const UPLOAD_VIDEO_REQUIRED_MODAL_BODY =
  'You must upload your review video before finishing. Record your review, upload the file, then tap Finish review.';

export const LEGAL_PAGE_TITLE = 'Terms and Conditions';

export const LEGAL_PAGE_SECTIONS = [
  {
    title: 'Use of LitCircle',
    body: `LitCircle is a classroom tool for literary circle activities. By using this site you agree to participate responsibly and to follow your teacher's instructions.`,
  },
  {
    title: 'Review videos and privacy',
    body: `Videos you upload are stored temporarily and can be viewed by anyone who has the session access code. LitCircle and its developers do not guarantee the privacy or confidentiality of uploaded content. You are responsible for what you record and share. Do not include personal information you would not want others to see.`,
  },
  {
    title: 'Minors and classroom supervision',
    body: `If you are under 18, your teacher or tutor is responsible for supervising use of this tool and for obtaining any consent required by your school or local law.`,
  },
  {
    title: 'Cookies and local storage',
    body: `LitCircle uses browser local storage to remember your progress, host sessions, and cookie consent choice. We do not use third-party advertising cookies. Essential storage is required for the app to work during a review session.`,
  },
  {
    title: 'Disclaimer',
    body: `The developers of LitCircle are not liable for the content of user-uploaded videos, how they are shared, or any harm arising from their use. The service is provided "as is" without warranties. Video files may be deleted automatically after 30 days.`,
  },
] as const;

export const COOKIE_BANNER_TEXT =
  'We use cookies to improve your experience and keep your session running. By continuing, you agree to our';

export const COOKIE_BANNER_TERMS_LINK = 'Terms and Conditions';

export const COOKIE_BANNER_ACCEPT = 'Accept all cookies';

export const COOKIE_BANNER_EXIT = 'Exit';

export const HOST_TAB_INSTRUCTIONS = 'Instructions';

export const HOST_TAB_VIDEOS = 'Video reviews';

export const HOST_VIDEOS_EMPTY =
  'No review videos yet. Videos appear here after participants upload and finish.';

export const HOST_VIDEOS_LOADING = 'Loading review videos…';

export const HOST_VIDEOS_ERROR = 'Could not load review videos. Try again in a moment.';
