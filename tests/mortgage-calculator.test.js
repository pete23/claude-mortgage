const {
  calculateMonthlyPayment,
  calculateCashAfterSelling,
  calculateRequiredLoanAmount,
  calculateLoanToValueRatio,
  calculateFinalCashInHand,
  isMortgageEligible
} = require('../src/mortgage-calculator');

describe('calculateMonthlyPayment', () => {
  test('calculates the correct monthly payment with interest', () => {
    // £200,000 loan at 4.5% over 25 years (300 months)
    const result = calculateMonthlyPayment(200000, 4.5, 300);
    // Expected monthly payment around £1,111.41
    expect(result).toBeCloseTo(1111.41, 0); // Allow some margin for rounding differences
  });

  test('calculates the correct monthly payment with 0% interest', () => {
    // £150,000 loan at 0% over 20 years (240 months)
    const result = calculateMonthlyPayment(150000, 0, 240);
    // Expected monthly payment should be exactly £625
    expect(result).toBe(625);
  });
});

describe('calculateCashAfterSelling', () => {
  test('calculates the correct cash after selling', () => {
    const sellingPrice = 350000;
    const currentMortgage = 200000;
    const agentFeePercentage = 1.5;
    const otherFees = 3000;
    const initialCashInHand = 20000;
    
    // Agent fee amount: 350000 * 0.015 = 5250
    // Cash after selling: 350000 - 200000 - 5250 - 3000 + 20000 = 161750
    const result = calculateCashAfterSelling(sellingPrice, currentMortgage, agentFeePercentage, otherFees, initialCashInHand);
    expect(result).toBe(161750);
  });

  test('handles zero values correctly', () => {
    const result = calculateCashAfterSelling(0, 0, 0, 0, 0);
    expect(result).toBe(0);
  });
});

describe('calculateRequiredLoanAmount', () => {
  test('calculates the correct required loan amount', () => {
    const buyingPrice = 450000;
    const cashAfterSelling = 161750;
    
    // Required loan amount: 450000 - 161750 = 288250
    const result = calculateRequiredLoanAmount(buyingPrice, cashAfterSelling);
    expect(result).toBe(288250);
  });

  test('handles negative loan amount (cash surplus)', () => {
    const buyingPrice = 100000;
    const cashAfterSelling = 150000;
    
    // Required loan amount: 100000 - 150000 = -50000 (cash surplus)
    const result = calculateRequiredLoanAmount(buyingPrice, cashAfterSelling);
    expect(result).toBe(-50000);
  });
});

describe('calculateLoanToValueRatio', () => {
  test('calculates the correct loan to value ratio', () => {
    const requiredLoanAmount = 288250;
    const buyingPrice = 450000;
    
    // LTV: (288250 / 450000) * 100 = 64.05...%
    const result = calculateLoanToValueRatio(requiredLoanAmount, buyingPrice);
    expect(result).toBeCloseTo(64.06, 2);
  });

  test('handles zero buying price safely', () => {
    const requiredLoanAmount = 200000;
    const buyingPrice = 0;
    
    // Should return Infinity
    const result = calculateLoanToValueRatio(requiredLoanAmount, buyingPrice);
    expect(result).toBe(Infinity);
  });
});

describe('calculateFinalCashInHand', () => {
  test('calculates the correct final cash in hand', () => {
    const cashAfterSelling = 161750;
    const buyingPrice = 450000;
    const requiredLoanAmount = 288250;
    const arrangementFee = 999;
    
    // Final cash in hand: 161750 - 450000 + 288250 - 999 = -999
    const result = calculateFinalCashInHand(cashAfterSelling, buyingPrice, requiredLoanAmount, arrangementFee);
    expect(result).toBe(-999);
  });

  test('calculates positive cash in hand', () => {
    const cashAfterSelling = 161750;
    const buyingPrice = 400000;
    const requiredLoanAmount = 240000;
    const arrangementFee = 999;
    
    // Final cash in hand: 161750 - 400000 + 240000 - 999 = 751
    const result = calculateFinalCashInHand(cashAfterSelling, buyingPrice, requiredLoanAmount, arrangementFee);
    expect(result).toBe(751);
  });
});

describe('isMortgageEligible', () => {
  const testMortgage = {
    name: "Test Mortgage",
    initialRate: 4.5,
    initialPeriodYears: 2,
    standardVariableRate: 8.99,
    overallTermYears: 25,
    maxLoanToValue: 75,
    arrangementFee: 999,
    minLoanAmount: 25000,
    maxLoanAmount: 1000000
  };

  test('mortgage is eligible when all conditions are met', () => {
    const requiredLoanAmount = 200000;
    const loanToValueRatio = 70;
    const buyingPrice = 285714; // 200000 / 0.7
    
    const result = isMortgageEligible(requiredLoanAmount, loanToValueRatio, testMortgage, buyingPrice);
    expect(result).toBe(true);
  });

  test('mortgage is ineligible when loan amount is too small', () => {
    const requiredLoanAmount = 20000; // Below 25000 minimum
    const loanToValueRatio = 50;
    const buyingPrice = 40000;
    
    const result = isMortgageEligible(requiredLoanAmount, loanToValueRatio, testMortgage, buyingPrice);
    expect(result).toBe(false);
  });

  test('mortgage is ineligible when loan amount is too large', () => {
    const requiredLoanAmount = 1200000; // Above 1000000 maximum
    const loanToValueRatio = 60;
    const buyingPrice = 2000000;
    
    const result = isMortgageEligible(requiredLoanAmount, loanToValueRatio, testMortgage, buyingPrice);
    expect(result).toBe(false);
  });

  test('mortgage is ineligible when LTV is too high', () => {
    const requiredLoanAmount = 500000;
    const loanToValueRatio = 80; // Above 75% maximum
    const buyingPrice = 625000;
    
    const result = isMortgageEligible(requiredLoanAmount, loanToValueRatio, testMortgage, buyingPrice);
    expect(result).toBe(false);
  });

  test('mortgage is ineligible when buying price is zero', () => {
    const requiredLoanAmount = 200000;
    const loanToValueRatio = 70;
    const buyingPrice = 0;
    
    const result = isMortgageEligible(requiredLoanAmount, loanToValueRatio, testMortgage, buyingPrice);
    expect(result).toBe(false);
  });

  test('mortgage is ineligible when required loan amount is non-positive', () => {
    const requiredLoanAmount = 0;
    const loanToValueRatio = 0;
    const buyingPrice = 300000;
    
    const result = isMortgageEligible(requiredLoanAmount, loanToValueRatio, testMortgage, buyingPrice);
    expect(result).toBe(false);
  });
});