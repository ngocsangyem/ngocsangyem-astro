export interface PortfolioExperience {
  company: string;
  role: string;
  period: string;
  year: string;
  location: string;
  skills: string[];
}

export const PORTFOLIO_EXPERIENCE: PortfolioExperience[] = [
  {
    company: 'Aspire',
    role: 'Software Engineer',
    period: 'Jun 2022 to present',
    year: '2022',
    location: 'Vietnam',
    skills: ['React', 'Vuejs', 'Typescript', 'Laravel', 'PHP', 'CSS', 'HTML5', 'AI-workflow', 'E2E/Playwright/Cypress', 'Unit test'],
  },
  {
    company: 'GForces',
    role: 'Frontend Developer',
    period: 'Sep 2020 to Jun 2022',
    year: '2020',
    location: 'Ho Chi Minh City, Vietnam',
    skills: ['JavaScript', 'Sass', 'Vuejs', 'Reactjs', 'Typescript', 'Unit test'],
  },
  {
    company: 'Kyanon Digital',
    role: 'Frontend Developer',
    period: 'Jul 2019 to Sep 2020',
    year: '2019',
    location: 'Vietnam',
    skills: ['JavaScript', 'Sass', 'Angular', 'HTML5', 'Unit test'],
  },
];
