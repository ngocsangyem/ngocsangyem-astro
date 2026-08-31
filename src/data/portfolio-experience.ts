export interface PortfolioExperience {
  company: string;
  role: string;
  period: string;
  location: string;
  skills: string[];
}

export const PORTFOLIO_EXPERIENCE: PortfolioExperience[] = [
  {
    company: 'Aspire',
    role: 'Senior Frontend Developer',
    period: 'Mar 2025 to present',
    location: 'Vietnam',
    skills: ['CSS', 'HTML5'],
  },
  {
    company: 'Aspire',
    role: 'Frontend Developer',
    period: 'Jun 2022 to Mar 2025',
    location: 'Vietnam',
    skills: ['JavaScript', 'CSS'],
  },
  {
    company: 'GForces',
    role: 'Frontend Developer',
    period: 'Sep 2020 to Jun 2022',
    location: 'Ho Chi Minh City, Vietnam',
    skills: ['JavaScript', 'Sass'],
  },
  {
    company: 'Kyanon Digital',
    role: 'Frontend Developer',
    period: 'Jul 2019 to Sep 2020',
    location: 'Vietnam',
    skills: ['JavaScript', 'Sass'],
  },
];
