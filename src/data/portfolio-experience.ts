export interface PortfolioExperience {
  company: string;
  role: string;
  period: string;
  year: string;
  location: string;
  /** One-line description of what the company does. */
  summary: string;
  highlights: string[];
  skills: string[];
}

export const PORTFOLIO_EXPERIENCE: PortfolioExperience[] = [
  {
    company: 'Aspire',
    role: 'Software Engineer',
    period: 'Jun 2022 to present',
    year: '2022',
    location: 'Vietnam',
    summary:
      'All-in-one finance operating system serving growing businesses across payments, accounting, and business operations.',
    highlights: [
      'Developed and launched a No KYB/KYC onboarding experience using PHP and Vue.js, removing verification barriers to early product exploration and contributing to a 14% increase in new user sign-ups within two months of launch.',
      'Built AI-driven workflows that reduced frontend workload by 40%, improving team productivity and delivery speed. The solution is now open-sourced at: https://github.com/ngocsangyem/MeowKit',
      'Developed production React and TypeScript applications for customer-facing and internal operational workflows, building reusable components and integrating backend APIs across complex business domains.',
      'Architected modular, production-grade frontend applications using Vue 3 and TypeScript, designing reusable UI modules and structured state-management patterns for complex enterprise workflows.',
      'Built a notifier that posts failed end-to-end test runs to the team channel, so developers see a failure and fix it right away instead of missing it among GitHub CI/CD notifications. This cut the time to merge pull requests by about 10%.',
      'Collaborated with backend engineers and product teams to define API contracts, integrate REST services, and deliver end-to-end business capabilities across complex enterprise workflows.',
      'Built automated unit and end-to-end test coverage using Jest, Playwright, and Cypress, improving release confidence and reducing production regressions.',
      'Participated in Agile ceremonies including sprint planning, backlog refinement, technical design discussions, and peer code reviews within distributed teams.',
    ],
    skills: ['React', 'Vue.js', 'TypeScript', 'PHP', 'REST APIs', 'CSS/SCSS', 'HTML5', 'AI workflows', 'Jest', 'Playwright', 'Cypress'],
  },
  {
    company: 'GForces',
    role: 'Software Engineer',
    period: 'Sep 2020 to Jun 2022',
    year: '2020',
    location: 'Ho Chi Minh City, Vietnam',
    summary: 'Global automotive e-commerce platform.',
    highlights: [
      'Implemented internationalized UI features supporting multiple markets and locales across the global dealership platform.',
      'Built reusable drag-and-drop UI components, reducing project setup time across multiple client implementations.',
      'Collaborated with international delivery teams in Agile environments to deliver customer-facing features and enhancements.',
      'Contributed architectural input during sprint planning and technical design discussions, improving development efficiency and delivery predictability.',
      'Authored and maintained reusable component documentation, reducing onboarding time for new engineers.',
    ],
    skills: ['JavaScript', 'TypeScript', 'Vue.js', 'React', 'Sass', 'i18n', 'Documentation'],
  },
  {
    company: 'Kyanon Digital',
    role: 'Software Engineer',
    period: 'Jul 2019 to Sep 2020',
    year: '2019',
    location: 'Vietnam',
    summary: 'Digital agency for custom software solutions.',
    highlights: [
      'Built responsive production web applications using Angular and TypeScript, improving runtime and loading performance through lazy loading and code splitting.',
      'Developed responsive SASS/BEM-based user interfaces serving high-traffic consumer platforms.',
      'Implemented WCAG 2.1 accessibility standards across multiple client projects.',
      'Improved maintainability and performance of legacy web applications through systematic refactoring and frontend optimization.',
    ],
    skills: ['Angular', 'TypeScript', 'JavaScript', 'Sass/BEM', 'HTML5', 'WCAG 2.1'],
  },
];
