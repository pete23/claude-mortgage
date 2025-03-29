const {
  calculateMonthlyPayment,
  calculateCashAfterSelling,
  calculateRequiredLoanAmount,
  calculateLoanToValueRatio,
  calculateFinalCashInHand,
  isMortgageEligible
} = require('../src/mortgage-calculator');

const mortgageRates = require('./mortgage-data');

describe('Mortgage Calculation Integration Tests', () => {
  // Test scenario 1: User with good financials
  test('User with good financials can find eligible mortgages', () => {
    // Input values
    const sellingPrice = 300000;
    const initialCashInHand = 50000;
    const currentMortgage = 150000;
    const agentFeePercentage = 1.5;
    const otherFees = 2000;
    const buyingPrice = 350000;
    
    // Calculate intermediate values
    const cashAfterSelling = calculateCashAfterSelling(
      sellingPrice, 
      currentMortgage, 
      agentFeePercentage, 
      otherFees, 
      initialCashInHand
    );
    
    const requiredLoanAmount = calculateRequiredLoanAmount(buyingPrice, cashAfterSelling);
    const loanToValueRatio = calculateLoanToValueRatio(requiredLoanAmount, buyingPrice);
    
    // Filter eligible mortgages
    const eligibleMortgages = mortgageRates.filter(mortgage => 
      isMortgageEligible(requiredLoanAmount, loanToValueRatio, mortgage, buyingPrice)
    );
    
    // Calculate details for eligible mortgages
    const mortgageDetails = eligibleMortgages.map(mortgage => {
      const monthlyInitialPayment = calculateMonthlyPayment(
        requiredLoanAmount,
        mortgage.initialRate,
        mortgage.overallTermYears * 12
      );
      
      const finalCashInHand = calculateFinalCashInHand(
        cashAfterSelling,
        buyingPrice,
        requiredLoanAmount,
        mortgage.arrangementFee
      );
      
      return {
        ...mortgage,
        requiredLoanAmount,
        monthlyInitialPayment,
        finalCashInHand,
        loanToValueRatio
      };
    });
    
    // Filter mortgages with positive cash in hand
    const validMortgageDetails = mortgageDetails.filter(mortgage => mortgage.finalCashInHand >= 0);
    
    // Sort by cash in hand
    validMortgageDetails.sort((a, b) => b.finalCashInHand - a.finalCashInHand);
    
    // Assertions
    expect(cashAfterSelling).toBeGreaterThan(0);
    expect(requiredLoanAmount).toBeGreaterThan(0);
    expect(loanToValueRatio).toBeLessThan(90); // Should be eligible for all LTV ranges
    expect(eligibleMortgages.length).toBe(3); // All mortgages should be eligible
    expect(mortgageDetails.length).toBe(3);
    
    // All mortgages should have cash in hand >= -999 (arrangement fee)
    mortgageDetails.forEach(mortgage => {
      expect(mortgage.finalCashInHand).toBe(-999);
    });
    
    // Since all have -999 final cash, none should be valid
    expect(validMortgageDetails.length).toBe(0);
  });

  // Test scenario 2: User with high LTV needing filtering
  test('Only shows eligible mortgages for high LTV scenario', () => {
    // Input values - buying an expensive property with less equity
    const sellingPrice = 250000;
    const initialCashInHand = 10000;
    const currentMortgage = 200000;
    const agentFeePercentage = 2;
    const otherFees = 3000;
    const buyingPrice = 400000;
    
    // Calculate intermediate values
    const cashAfterSelling = calculateCashAfterSelling(
      sellingPrice, 
      currentMortgage, 
      agentFeePercentage, 
      otherFees, 
      initialCashInHand
    );
    
    const requiredLoanAmount = calculateRequiredLoanAmount(buyingPrice, cashAfterSelling);
    const loanToValueRatio = calculateLoanToValueRatio(requiredLoanAmount, buyingPrice);
    
    // Filter eligible mortgages
    const eligibleMortgages = mortgageRates.filter(mortgage => 
      isMortgageEligible(requiredLoanAmount, loanToValueRatio, mortgage, buyingPrice)
    );
    
    // Assertions
    expect(loanToValueRatio).toBeGreaterThan(80); // Should be a high LTV case
    expect(eligibleMortgages.length).toBe(1); // Only the 90% LTV mortgage should be eligible
    expect(eligibleMortgages[0].maxLoanToValue).toBe(90); // Confirm it's the 90% LTV mortgage
  });

  // Test scenario 3: User with cash surplus (negative loan amount)
  test('Handles cash surplus scenario correctly', () => {
    // Input values - selling an expensive property and buying cheaper
    const sellingPrice = 500000;
    const initialCashInHand = 100000;
    const currentMortgage = 200000;
    const agentFeePercentage = 1;
    const otherFees = 5000;
    const buyingPrice = 350000;
    
    // Calculate intermediate values
    const cashAfterSelling = calculateCashAfterSelling(
      sellingPrice, 
      currentMortgage, 
      agentFeePercentage, 
      otherFees, 
      initialCashInHand
    );
    
    const requiredLoanAmount = calculateRequiredLoanAmount(buyingPrice, cashAfterSelling);
    
    // Assertions
    expect(cashAfterSelling).toBeGreaterThan(buyingPrice); // More cash than needed
    expect(requiredLoanAmount).toBeLessThan(0); // No loan needed, cash surplus
    
    // No eligible mortgages since loan amount is negative
    const eligibleMortgages = mortgageRates.filter(mortgage => 
      isMortgageEligible(requiredLoanAmount, 0, mortgage, buyingPrice)
    );
    
    expect(eligibleMortgages.length).toBe(0); // No mortgages should be eligible
  });
});