# PPSR B2G Portal

A secure, SOAP-based client interface to connect with the PPSR B2G channel, enabling automated registration, search, and notification functionalities as per the guidelines provided by the Australian Financial Security Authority (AFSA).

## Development

### Setup
1. Clone the repository
2. Install backend dependencies: `cd backend && poetry install`
3. Install frontend dependencies: `cd frontend && npm install`

### Running the application
1. Start the backend server: `cd backend && poetry run uvicorn app.main:app --reload`
2. Start the frontend server: `cd frontend && npm run dev`

### Troubleshooting
- If the frontend isn't working, try restarting the development server with `npm run dev`
- For quicker restarts, use the provided script: `./restart_servers.sh`
- Check browser console for any JavaScript errors
- Verify that the backend API is accessible at http://localhost:8000/healthz

## Features

### B2G Operations
- **Change Password**: Update your B2G channel password
- **Connection Status**: Check your B2G connection status
- **Vehicle Search**: Search for vehicle details by VIN, Chassis, or Registration number
- **PDF Reports**: Generate professional PDF reports for vehicle searches

### Technical Details
- Backend implementation uses the SOAP client structure with mock responses for testing
- ReportLab library for PDF generation with custom document templates
- Frontend uses React, TypeScript, and shadcn/ui components
- Form validation with React Hook Form and Zod
- Responsive design with Tailwind CSS
