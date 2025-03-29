# Mortgage Move Calculator

A simple mortgage calculator for comparing mortgage options when moving houses.

## Features

- Calculate monthly repayments for various mortgage options
- Calculate cash in hand at the end of the process
- Filter eligible mortgages based on loan amount and loan-to-value ratio
- Sort mortgages by cash in hand at the end of process
- Real-time calculations without requiring "calculate" buttons

## How to Use

1. Enter your current property details:
   - Selling price for current property
   - Cash in hand at start of process
   - Current mortgage
   - Estate agent fee percentage
   - Other fees

2. Enter your new property details:
   - Buying price for new property

3. The calculator will automatically display eligible mortgage options sorted by cash in hand at the end of the process.

## Development

### Requirements

- Node.js (for the development server)

### Running the Development Server

To start the development server:

```bash
node server.js
```

Then open your browser and navigate to http://localhost:3000/

### Running Tests

The application uses Jest for unit testing. To run the tests:

```bash
npm test
```

This will run all test suites and display the results.

### Architecture

- Single Page Application
- No external dependencies (pure HTML, CSS, JavaScript)
- Static file structure
- Compatible with latest Chrome, Safari, or Firefox as of March 2025