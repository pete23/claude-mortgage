/**
 * Calculate the monthly payment for a loan
 * @param {number} loanAmount - The loan amount
 * @param {number} annualInterestRate - The annual interest rate (percentage)
 * @param {number} loanTermMonths - The loan term in months
 * @returns {number} The monthly payment
 */
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

/**
 * Calculate cash available after selling a property
 * @param {number} sellingPrice - The selling price of the property
 * @param {number} currentMortgage - The current mortgage
 * @param {number} agentFeePercentage - The estate agent fee percentage
 * @param {number} otherFees - Other fees
 * @param {number} initialCashInHand - Initial cash in hand
 * @returns {number} The cash available after selling
 */
function calculateCashAfterSelling(sellingPrice, currentMortgage, agentFeePercentage, otherFees, initialCashInHand) {
  const agentFeeAmount = sellingPrice * (agentFeePercentage / 100);
  return sellingPrice - currentMortgage - agentFeeAmount - otherFees + initialCashInHand;
}

/**
 * Calculate required loan amount
 * @param {number} buyingPrice - The buying price of the new property
 * @param {number} cashAfterSelling - The cash available after selling
 * @returns {number} The required loan amount
 */
function calculateRequiredLoanAmount(buyingPrice, cashAfterSelling) {
  return buyingPrice - cashAfterSelling;
}

/**
 * Calculate loan to value ratio
 * @param {number} requiredLoanAmount - The required loan amount
 * @param {number} buyingPrice - The buying price of the new property
 * @returns {number} The loan to value ratio as a percentage
 */
function calculateLoanToValueRatio(requiredLoanAmount, buyingPrice) {
  return (requiredLoanAmount / buyingPrice) * 100;
}

/**
 * Calculate final cash in hand after the process
 * @param {number} cashAfterSelling - The cash available after selling
 * @param {number} buyingPrice - The buying price of the new property
 * @param {number} actualLoanAmount - The actual loan amount based on the mortgage's LTV
 * @param {number} arrangementFee - The mortgage arrangement fee
 * @returns {number} The final cash in hand
 */
function calculateFinalCashInHand(cashAfterSelling, buyingPrice, actualLoanAmount, arrangementFee) {
  return cashAfterSelling + actualLoanAmount - buyingPrice - arrangementFee;
}

/**
 * Calculate the actual loan amount based on the mortgage's max LTV
 * @param {number} requiredLoanAmount - The loan amount required by the buyer
 * @param {number} buyingPrice - The buying price of the new property
 * @param {number} maxLoanToValue - The maximum loan-to-value ratio of the mortgage
 * @param {number} maxLoanAmount - The maximum loan amount of the mortgage
 * @param {number} minLoanAmount - The minimum loan amount of the mortgage
 * @returns {number|null} The actual loan amount or null if below minimum
 */
function calculateActualLoanAmount(requiredLoanAmount, buyingPrice, maxLoanToValue, maxLoanAmount, minLoanAmount) {
  const actualLoanAmount = Math.min(
    requiredLoanAmount,
    (buyingPrice * maxLoanToValue / 100),
    maxLoanAmount
  );
  
  if (actualLoanAmount < minLoanAmount) {
    return null;
  }
  
  return actualLoanAmount;
}

/**
 * Check if a mortgage is eligible based on loan amount and LTV
 * @param {number} requiredLoanAmount - The required loan amount
 * @param {number} loanToValueRatio - The loan to value ratio
 * @param {object} mortgage - The mortgage details
 * @param {number} buyingPrice - The buying price of the new property
 * @returns {boolean} Whether the mortgage is eligible
 */
function isMortgageEligible(requiredLoanAmount, loanToValueRatio, mortgage, buyingPrice) {
  return requiredLoanAmount >= mortgage.minLoanAmount &&
         requiredLoanAmount <= mortgage.maxLoanAmount &&
         loanToValueRatio <= mortgage.maxLoanToValue &&
         buyingPrice > 0 &&
         requiredLoanAmount > 0;
}

module.exports = {
  calculateMonthlyPayment,
  calculateCashAfterSelling,
  calculateRequiredLoanAmount,
  calculateLoanToValueRatio,
  calculateFinalCashInHand,
  calculateActualLoanAmount,
  isMortgageEligible
};