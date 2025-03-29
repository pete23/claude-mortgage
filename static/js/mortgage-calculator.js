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
    
    // Sort by cash in hand at end of process (descending)
    mortgageDetails.sort((a, b) => b.finalCashInHand - a.finalCashInHand);
    
    // Display results
    displayResults(mortgageDetails, requiredLoanAmount, loanToValueRatio);
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
                </div>`;
      }
    } else {
      html = '<div class="mortgage-cards">';
      
      mortgages.forEach(mortgage => {
        html += `
          <div class="mortgage-card">
            <h3>${mortgage.name} (${mortgage.initialRate}%)</h3>
            <div class="mortgage-details">
              <p><strong>Initial period:</strong> ${mortgage.initialPeriodYears} years</p>
              <p><strong>Overall term:</strong> ${mortgage.overallTermYears} years</p>
              <p><strong>Arrangement fee:</strong> £${mortgage.arrangementFee.toLocaleString('en-GB')}</p>
              <p><strong>Loan amount:</strong> £${mortgage.requiredLoanAmount.toLocaleString('en-GB', {maximumFractionDigits: 2})}</p>
              <p><strong>Loan to value:</strong> ${mortgage.loanToValueRatio.toFixed(1)}%</p>
              <p><strong>Max loan to value:</strong> ${mortgage.maxLoanToValue}%</p>
              <p class="highlight">Monthly payment: £${mortgage.monthlyInitialPayment.toLocaleString('en-GB', {maximumFractionDigits: 2})}</p>
              <p class="highlight">Cash in hand: £${mortgage.finalCashInHand.toLocaleString('en-GB', {maximumFractionDigits: 2})}</p>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    resultsContainer.innerHTML = html;
  }
});