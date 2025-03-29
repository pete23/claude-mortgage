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
  
  // Load saved data from localStorage
  function loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('mortgageCalculatorData');
      if (savedData) {
        const data = JSON.parse(savedData);
        sellingPriceInput.value = data.sellingPrice || '';
        cashInHandInput.value = data.cashInHand || '';
        currentMortgageInput.value = data.currentMortgage || '';
        agentFeeInput.value = data.agentFee || '';
        otherFeesInput.value = data.otherFees || '';
        buyingPriceInput.value = data.buyingPrice || '';
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }
  
  // Save data to localStorage
  function saveToLocalStorage() {
    try {
      const data = {
        sellingPrice: sellingPriceInput.value,
        cashInHand: cashInHandInput.value,
        currentMortgage: currentMortgageInput.value,
        agentFee: agentFeeInput.value,
        otherFees: otherFeesInput.value,
        buyingPrice: buyingPriceInput.value
      };
      localStorage.setItem('mortgageCalculatorData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }
  
  // Add event listeners to all inputs
  allInputs.forEach(input => {
    input.addEventListener('input', () => {
      calculateMortgages();
      saveToLocalStorage();
    });
  });
  
  // Add event listener to clear button
  const clearButton = document.getElementById('clear-data');
  clearButton.addEventListener('click', () => {
    // Clear all input fields
    allInputs.forEach(input => {
      input.value = '';
    });
    
    // Remove data from localStorage
    localStorage.removeItem('mortgageCalculatorData');
    
    // Recalculate
    calculateMortgages();
  });
  
  // Load saved data and calculate results
  loadFromLocalStorage();
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
      // Calculate the actual loan amount based on the mortgage's max LTV
      const actualLoanAmount = Math.min(
        requiredLoanAmount,
        (buyingPrice * mortgage.maxLoanToValue / 100),
        mortgage.maxLoanAmount
      );
      
      // Make sure we're not below the minimum loan amount
      if (actualLoanAmount < mortgage.minLoanAmount) {
        return null; // This will be filtered out
      }
      
      // Calculate monthly payment in initial period
      const monthlyInitialPayment = calculateMonthlyPayment(
        actualLoanAmount,
        mortgage.initialRate,
        mortgage.overallTermYears * 12
      );
      
      // Calculate cash in hand at end of process
      const finalCashInHand = cashAfterSelling - buyingPrice + actualLoanAmount - mortgage.arrangementFee;
      
      // Calculate actual LTV for this mortgage
      const actualLoanToValueRatio = (actualLoanAmount / buyingPrice) * 100;
      
      return {
        ...mortgage,
        actualLoanAmount,
        requiredLoanAmount,
        monthlyInitialPayment,
        finalCashInHand,
        actualLoanToValueRatio,
        loanToValueRatio
      };
    }).filter(Boolean); // Remove any null values
    
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
            <th>Total Mortgage</th>
            <th>Actual LTV</th>
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
            <td>£${mortgage.actualLoanAmount.toLocaleString('en-GB', {maximumFractionDigits: 2})}</td>
            <td>${mortgage.actualLoanToValueRatio.toFixed(1)}%</td>
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