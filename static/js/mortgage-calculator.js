document.addEventListener('DOMContentLoaded', () => {
  // Get all input elements
  const sellingPriceInput = document.getElementById('selling-price');
  const cashInHandInput = document.getElementById('cash-in-hand');
  const currentMortgageInput = document.getElementById('current-mortgage');
  const agentFeeInput = document.getElementById('agent-fee');
  const otherFeesInput = document.getElementById('other-fees');
  const buyingPriceInput = document.getElementById('buying-price');
  const resultsContainer = document.getElementById('results-container');
  
  // Add event listeners to all inputs
  const allInputs = [
    sellingPriceInput, 
    cashInHandInput, 
    currentMortgageInput, 
    agentFeeInput, 
    otherFeesInput, 
    buyingPriceInput
  ];
  
  allInputs.forEach(input => {
    input.addEventListener('input', calculateMortgages);
  });
  
  // Initial calculation
  calculateMortgages();
  
  function calculateMortgages() {
    // Get values from inputs
    const sellingPrice = parseFloat(sellingPriceInput.value) || 0;
    const initialCashInHand = parseFloat(cashInHandInput.value) || 0;
    const currentMortgage = parseFloat(currentMortgageInput.value) || 0;
    const agentFeePercentage = parseFloat(agentFeeInput.value) || 0;
    const otherFees = parseFloat(otherFeesInput.value) || 0;
    const buyingPrice = parseFloat(buyingPriceInput.value) || 0;
    
    // Calculate agent fee amount
    const agentFeeAmount = sellingPrice * (agentFeePercentage / 100);
    
    // Calculate cash available after selling
    const cashAfterSelling = sellingPrice - currentMortgage - agentFeeAmount - otherFees + initialCashInHand;
    
    // Calculate required loan amount
    const requiredLoanAmount = buyingPrice - cashAfterSelling;
    
    // Calculate loan to value ratio
    const loanToValueRatio = (requiredLoanAmount / buyingPrice) * 100;
    
    // Filter eligible mortgages
    const eligibleMortgages = mortgageRates.filter(mortgage => {
      return requiredLoanAmount >= mortgage.minLoanAmount &&
             requiredLoanAmount <= mortgage.maxLoanAmount &&
             loanToValueRatio <= mortgage.maxLoanToValue &&
             buyingPrice > 0 &&
             requiredLoanAmount > 0;
    });
    
    // For each eligible mortgage, calculate details
    const mortgageDetails = eligibleMortgages.map(mortgage => {
      // Calculate monthly payment in initial period
      const monthlyInitialPayment = calculateMonthlyPayment(
        requiredLoanAmount,
        mortgage.initialRate,
        mortgage.overallTermYears * 12
      );
      
      // Calculate cash in hand at end of process
      const finalCashInHand = cashAfterSelling - buyingPrice + requiredLoanAmount - mortgage.arrangementFee;
      
      return {
        ...mortgage,
        requiredLoanAmount,
        monthlyInitialPayment,
        finalCashInHand,
        loanToValueRatio
      };
    });
    
    // Filter out mortgages with negative cash in hand
    const validMortgageDetails = mortgageDetails.filter(mortgage => mortgage.finalCashInHand >= 0);
    
    // Sort by cash in hand at end of process (descending)
    validMortgageDetails.sort((a, b) => b.finalCashInHand - a.finalCashInHand);
    
    // Display results
    displayResults(validMortgageDetails, requiredLoanAmount, loanToValueRatio);
  }
  
  function calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermMonths) {
    // Convert annual interest rate to monthly decimal
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    
    // Calculate monthly payment using the formula: P × (r × (1 + r)^n) / ((1 + r)^n - 1)
    // Where P = principal, r = monthly rate, n = number of payments
    if (monthlyInterestRate === 0) {
      return loanAmount / loanTermMonths;
    }
    
    const compoundFactor = Math.pow(1 + monthlyInterestRate, loanTermMonths);
    return loanAmount * (monthlyInterestRate * compoundFactor) / (compoundFactor - 1);
  }
  
  function displayResults(mortgages, requiredLoanAmount, loanToValueRatio) {
    let html = '';
    
    if (mortgages.length === 0) {
      if (requiredLoanAmount <= 0) {
        html = '<div class="no-results">Complete the form to see mortgage options</div>';
      } else {
        html = `<div class="no-results">
                  <p>No eligible mortgages found for:</p>
                  <p>Loan amount: £${requiredLoanAmount.toLocaleString('en-GB', {maximumFractionDigits: 2})}</p>
                  <p>Loan to value ratio: ${loanToValueRatio.toFixed(1)}%</p>
                  <p>Note: Options with negative cash in hand are filtered out</p>
                </div>`;
      }
    } else {
      html = '<div class="table-responsive"><table class="mortgage-table">';
      
      // Table header
      html += `
        <thead>
          <tr>
            <th>Mortgage Type</th>
            <th>Initial Rate</th>
            <th>Period</th>
            <th>Term</th>
            <th>Arrangement Fee</th>
            <th>Loan Amount</th>
            <th>LTV</th>
            <th>Max LTV</th>
            <th class="highlight">Monthly Payment</th>
            <th class="highlight">Cash in Hand</th>
          </tr>
        </thead>
        <tbody>
      `;
      
      // Table rows
      mortgages.forEach(mortgage => {
        html += `
          <tr>
            <td>${mortgage.name}</td>
            <td>${mortgage.initialRate}%</td>
            <td>${mortgage.initialPeriodYears} years</td>
            <td>${mortgage.overallTermYears} years</td>
            <td>£${mortgage.arrangementFee.toLocaleString('en-GB')}</td>
            <td>£${mortgage.requiredLoanAmount.toLocaleString('en-GB', {maximumFractionDigits: 2})}</td>
            <td>${mortgage.loanToValueRatio.toFixed(1)}%</td>
            <td>${mortgage.maxLoanToValue}%</td>
            <td class="highlight">£${mortgage.monthlyInitialPayment.toLocaleString('en-GB', {maximumFractionDigits: 2})}</td>
            <td class="highlight">£${mortgage.finalCashInHand.toLocaleString('en-GB', {maximumFractionDigits: 2})}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div>';
    }
    
    resultsContainer.innerHTML = html;
  }
});