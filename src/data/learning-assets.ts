/* ==========================================================================
   The eight Coursera learning asset types.

   This supersedes learning-assets-data.json, which the design handoff has
   since removed for the same reason it stopped being read here: it held a
   parallel copy of this content and drifted from the page three times.
   Take card copy from the design's .dc.html, not from a data file.

   Order here drives the hero rail, the cards, and the nav dropdown, so the
   three cannot drift apart.
   ========================================================================== */

export interface LearningAsset {
  /** Also the in-page anchor id. Matches the nav dropdown's href. */
  slug: string;
  /** Card heading, nav dropdown, and hero rail. */
  railLabel: string;
  /** True for the asset types the design speaks of as a set, which take
      "What are they? / When might you use them?" on the card instead of
      the singular pair. */
  plural?: boolean;
  whatIs: string;
  whenToUse: string;
  /** Only where the "Explore …" link is worded differently from the label
      used elsewhere. */
  exploreLabel?: string;
  /** Route for this asset's full-guidance page, once one is published. */
  page?: string;
  /** CTL has not tested this asset type yet. Carries a "Pilot" pill in the
      rail and on the card, a persimmon top rule, and a note asking faculty
      to raise it early. Persimmon is the pilot accent, not an error color. */
  pilot?: string;
  /** Inner geometry of a 24×24 stroked icon, drawn at 19px in the rail and
      26px on the card. */
  icon: string;
}

export const learningAssets: LearningAsset[] = [
  {
    slug: 'video',
    railLabel: 'Video',
    whatIs:
      'A planned audiovisual asset that may combine an instructor’s presence or narration with slides, demonstrations, screen recordings, interviews, animation, or other visuals.',
    whenToUse:
      'When seeing or hearing something adds value. For example, when learners need an introduction, explanation, demonstration, story, expert perspective, or model of how someone approaches a task.',
    page: '/learning-assets/video',
    icon: '<path d="M2 5.5h13v13H2z"/><path d="M15 10l6-3.5v11L15 14z"/>',
  },
  {
    slug: 'reading',
    railLabel: 'Reading',
    whatIs:
      'A Reading can be a short page that introduces a file or external resource or a more developed learning experience that brings together written explanation, examples, graphics, code, media, and links.',
    whenToUse:
      'When learners need time to examine information closely, follow instructions, revisit important material, or use a resource during another part of the Course.',
    page: '/learning-assets/reading',
    icon: '<path d="M3 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H3z"/><path d="M21 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z"/>',
  },
  {
    slug: 'plugin',
    railLabel: 'Interactive Plugin',
    exploreLabel: 'Interactive Plugins',
    whatIs:
      'A Coursera feature that can embed a compatible external webpage, tool, or interactive experience that already exists and is hosted outside the Course.',
    whenToUse:
      'When approved external content supports the learning experience and embedding it gives learners a more connected way to view or interact with it.',
    icon: '<path d="M9 2v6"/><path d="M15 2v6"/><path d="M6 8h12v5a6 6 0 0 1-12 0z"/><path d="M12 19v3"/>',
  },
  {
    slug: 'dialogue',
    railLabel: 'Coach Dialogue',
    whatIs: 'An AI-powered conversation that responds to a learner’s ideas and choices.',
    whenToUse:
      'When learners would benefit from explaining their reasoning, considering alternatives, reflecting, or receiving personalized guidance.',
    icon: '<path d="M21 12a8 8 0 0 1-8 8H4l2.5-3A8 8 0 1 1 21 12z"/><path d="M9 11h6"/><path d="M9 14.5h3.5"/>',
  },
  {
    slug: 'roleplay',
    railLabel: 'Coach Role Play',
    pilot:
      'Our team has not fully tested this AI-supported tool. If you are interested in using it, talk with your CTL team early so we can plan it as a pilot.',
    whatIs:
      'An AI-powered activity in which learners practice a conversation with a simulated persona.',
    whenToUse:
      'When learners need to practice an interpersonal or job-related skill, such as coaching, interviewing, negotiating, or responding to a difficult situation.',
    icon: '<circle cx="8.5" cy="8" r="3.2"/><path d="M3 20a5.5 5.5 0 0 1 11 0"/><path d="M16 6.5a3.2 3.2 0 0 1 0 6.2"/><path d="M17.5 20a5.5 5.5 0 0 0-2.2-4.4"/>',
  },
  {
    slug: 'assessments',
    railLabel: 'Assessments',
    plural: true,
    whatIs:
      'Questions or tasks that allow learners to practice, receive feedback, or demonstrate what they have learned.',
    whenToUse:
      'Throughout a Module to help learners check their understanding, prepare for independent work, and demonstrate achievement of the Module objectives.',
    icon: '<path d="M4 3h13l3.5 3.5V21H4z"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  },
  {
    slug: 'programming',
    railLabel: 'Programming Assignments',
    plural: true,
    whatIs:
      'Code-based tasks that allow learners to write, modify, debug, or evaluate a program and receive feedback on their work.',
    whenToUse:
      'When writing or working with code is part of the capability learners need to develop or demonstrate.',
    icon: '<path d="M8.5 8.5L4 12.5l4.5 4"/><path d="M15.5 8.5l4.5 4-4.5 4"/><path d="M13.5 5l-3 15"/>',
  },
  {
    slug: 'labs',
    railLabel: 'Coursera Labs',
    plural: true,
    whatIs:
      'Configured, in-browser workspaces where learners can use code, data, software, or other technical tools.',
    whenToUse:
      'When learners need hands-on experience in a technical environment without completing extensive setup on their own devices.',
    icon: '<path d="M10 3v6.2L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 9.2V3"/><path d="M8.5 3h7"/><path d="M7.4 14h9.2"/>',
  },
];
