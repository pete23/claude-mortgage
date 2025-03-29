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
    
    // For first-time buyers, cashAfterSelling is just their initial cash/deposit
    // No need for special handling as the calculation is the same
    
    // Check if we have enough data to calculate eligibility
    // We only need buying price - for first-time buyers who won't have a selling price
    const canCalculateEligibility = buyingPrice > 0;
    
    // Process all mortgages with eligibility information
    const allMortgageDetails = mortgageRates.map(mortgage => {
      // Calculate maximum possible loan amount for this mortgage
      let maxLoanAmount = 0;
      let monthlyInitialPayment = 0;
      let finalCashInHand = 0;
      let loanToValuePercentage = 0;
      let isEligible = false;
      let ineligibleReason = '';
      
      if (canCalculateEligibility && buyingPrice > 0) {
        // Calculate the maximum loan amount based on the product's LTV limit
        maxLoanAmount = Math.min(
          (buyingPrice * mortgage.maxLoanToValue / 100), // LTV limit
          mortgage.maxLoanAmount // Product's maximum loan 
        );
        
        // Check if this mortgage is eligible
        isEligible = maxLoanAmount >= mortgage.minLoanAmount;
        
        // Store the reason for ineligibility
        if (canCalculateEligibility && !isEligible) {
          if (maxLoanAmount < mortgage.minLoanAmount) {
            ineligibleReason = `Property value too low for minimum loan (£${Math.round(mortgage.minLoanAmount).toLocaleString('en-GB')})`;
          }
          // No need to check for maximum as we already capped it
        }
        
        // Even for ineligible mortgages, calculate the values for display
        
        // Calculate monthly payment in initial period
        monthlyInitialPayment = calculateMonthlyPayment(
          maxLoanAmount,
          mortgage.initialRate,
          mortgage.overallTermYears * 12
        );
        
        // Calculate cash in hand at end of process
        // Available cash + mortgage amount - purchase price - arrangement fee
        finalCashInHand = cashAfterSelling + maxLoanAmount - buyingPrice - mortgage.arrangementFee;
        
        // Calculate LTV percentage (will be the max LTV or less)
        loanToValuePercentage = (maxLoanAmount / buyingPrice) * 100;
      }
      
      // Check if cash in hand is negative
      const hasNegativeCashInHand = finalCashInHand < 0;
      
      return {
        ...mortgage,
        isEligible,
        ineligibleReason,
        loanAmount: maxLoanAmount,
        monthlyInitialPayment,
        finalCashInHand,
        loanToValuePercentage,
        hasNegativeCashInHand
      };
    });
    
    // Sort by eligibility first, then by cash in hand (descending)
    allMortgageDetails.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      if (a.isEligible && b.isEligible) return b.finalCashInHand - a.finalCashInHand;
      return 0;
    });
    
    // Display results
    displayResults(allMortgageDetails, requiredLoanAmount, loanToValueRatio, canCalculateEligibility);
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
  
  function displayResults(mortgages, requiredLoanAmount, loanToValueRatio, canCalculateEligibility) {
    let html = '';
    
    // Always show the table with all mortgages
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
          <th>LTV</th>
          <th class="highlight">Monthly Payment</th>
          <th class="highlight">Cash in Hand</th>
          ${canCalculateEligibility ? '<th>Status</th>' : ''}
        </tr>
      </thead>
      <tbody>
    `;
    
    // If we don't have any mortgages (unlikely), show a message
    if (mortgages.length === 0) {
      html += `
        <tr>
          <td colspan="${canCalculateEligibility ? '10' : '9'}" class="no-results">No mortgage data available</td>
        </tr>
      `;
    } else {
      // Table rows for all mortgages
      mortgages.forEach(mortgage => {
        const trClass = (!mortgage.isEligible || mortgage.hasNegativeCashInHand) ? 'ineligible' : '';
        const reason = mortgage.hasNegativeCashInHand && mortgage.isEligible ? 'Negative cash in hand' : mortgage.ineligibleReason;
        
        html += `
          <tr class="${trClass}">
            <td>${mortgage.name}</td>
            <td>${mortgage.initialRate}%</td>
            <td>${mortgage.initialPeriodYears} years</td>
            <td>${mortgage.overallTermYears} years</td>
            <td>£${mortgage.arrangementFee.toLocaleString('en-GB')}</td>
            <td>£${Math.round(mortgage.loanAmount).toLocaleString('en-GB')}</td>
            <td>${mortgage.maxLoanToValue}%</td>
            <td class="highlight">£${Math.round(mortgage.monthlyInitialPayment).toLocaleString('en-GB')}</td>
            <td class="highlight ${mortgage.hasNegativeCashInHand ? 'negative-cash' : ''}">£${Math.round(mortgage.finalCashInHand).toLocaleString('en-GB')}</td>
            ${canCalculateEligibility ? `<td class="ineligible-reason">${(!mortgage.isEligible || mortgage.hasNegativeCashInHand) ? reason : 'Eligible'}</td>` : ''}
          </tr>
        `;
      });
    }
    
    html += '</tbody></table></div>';
    
    // If we don't have enough data to calculate eligibility, show a message
    if (!canCalculateEligibility) {
      html = '<div class="no-results">Enter buying price to see mortgage eligibility</div>' + html;
    }
    
    resultsContainer.innerHTML = html;
  }
});