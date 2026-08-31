export interface PortfolioExperience {
  company: string;
  role: string;
  period: string;
  year: string;
  location: string;
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
    highlights: [
      'Built AI-driven workflows that reduced frontend workload by 40%, improving team productivity and delivery speed. The solution is now open-sourced at: https://github.com/ngocsangyem/MeowKit',
      'Developed customer-facing and internal business applications using React.js, TypeScript, and modern frontend architecture patterns.',
      'Architected modular frontend features using Vue.js 3 and TypeScript, improving UI responsiveness and reducing state-management related defects through structured Pinia store design.',
      'Led full Vue 2 to Vue 3 migration for a multi-year codebase, removing legacy code and improving application maintainability while reducing initial load time by 20%.',
      'Collaborated closely with backend engineers to integrate APIs and deliver scalable frontend solutions across accounting and business operation modules.',
      'Mentored junior developers, accelerating onboarding time from 6 weeks to 4 weeks through pair-programming and internal training.',
      'Implemented Jest unit tests and Cypress/Playwright end-to-end testing to improve release confidence and reduce production defects.',
      'Participated in Agile ceremonies including sprint planning, backlog refinement, technical design discussions, and peer code reviews within distributed teams.',
    ],
    skills: ['React', 'Vuejs', 'Typescript', 'Laravel', 'PHP', 'CSS', 'HTML5', 'AI-workflow', 'E2E/Playwright/Cypress', 'Unit test'],
  },
  {
    company: 'GForces',
    role: 'Frontend Developer',
    period: 'Sep 2020 to Jun 2022',
    year: '2020',
    location: 'Ho Chi Minh City, Vietnam',
    highlights: [
      'Developed and maintained React.js and Vue.js applications supporting global automotive dealership platforms with high availability requirements.',
      'Built reusable drag-and-drop UI components, reducing project setup time across multiple client implementations.',
      'Collaborated with international delivery teams in Agile environments to deliver customer-facing features and enhancements.',
      'Contributed architectural input during sprint planning and technical design discussions, improving development efficiency and delivery predictability.',
      'Authored and maintained reusable component documentation, reducing onboarding time for new engineers.',
    ],
    skills: ['JavaScript', 'Sass', 'Vuejs', 'Reactjs', 'Typescript', 'Unit test'],
  },
  {
    company: 'Kyanon Digital',
    role: 'Frontend Developer',
    period: 'Jul 2019 to Sep 2020',
    year: '2019',
    location: 'Vietnam',
    highlights: [
      'Delivered mobile-first web applications using Angular, improving performance through lazy loading and code splitting techniques.',
      'Developed responsive SASS/BEM-based user interfaces serving high-traffic consumer platforms.',
      'Implemented WCAG 2.1 accessibility standards across multiple client projects.',
      'Improved maintainability and performance of legacy web applications through systematic refactoring and frontend optimization.',
    ],
    skills: ['JavaScript', 'Sass', 'Angular', 'HTML5', 'Unit test'],
  },
];
