# Budget Tracker - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React.js PWA (Progressive Web App) budget tracking application with the following stack:

## Tech Stack
- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS with dark mode support
- **Charts**: Chart.js with react-chartjs-2
- **PDF Export**: jsPDF
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **PWA**: Service Worker + Web App Manifest

## Architecture
- Context API for state management (BudgetContext)
- Component-based architecture with proper separation of concerns
- Responsive design with mobile-first approach
- Dark mode implementation with system preference detection
- Offline-first PWA capabilities

## Key Features
1. **Expense Management**: Add, edit, delete expenses with categories
2. **Category Management**: Custom categories with color coding
3. **Recurring Expenses**: Monthly/weekly/yearly recurring transactions
4. **Analytics**: Charts and visualizations using Chart.js
5. **PDF Export**: Generate monthly/weekly reports
6. **Dark Mode**: Full dark theme support with smooth transitions
7. **PWA**: Offline support, installable, responsive

## Coding Guidelines
- Use functional components with hooks
- Implement proper TypeScript-like prop validation where needed
- Follow Tailwind CSS utility-first approach
- Use semantic HTML and accessibility best practices
- Implement smooth transitions and animations
- Ensure responsive design for all screen sizes
- Use proper error handling and user feedback
- Implement loading states where appropriate

## File Structure
- `/src/components/` - Reusable UI components
- `/src/context/` - React Context providers
- `/src/hooks/` - Custom React hooks
- `/src/services/` - API and external service calls
- `/public/` - Static assets and PWA files

## Styling Conventions
- Use Tailwind CSS classes for all styling
- Implement dark mode with `dark:` prefix
- Use gradient backgrounds and glass morphism effects
- Follow consistent spacing and color schemes
- Use custom CSS classes in index.css for complex components

When making changes:
1. Maintain dark mode compatibility
2. Ensure responsive design
3. Keep accessibility in mind
4. Update related components if state structure changes
5. Test PWA functionality after major changes
