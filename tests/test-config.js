/**
 * Test Suite for Config Module
 * Tests calculation functions and tier logic
 */

import {
    calculateBuyAmount,
    calculateSellAmount,
    getCurrentTier,
    formatNumber,
    CONFIG
} from '../js/config.js';

// Simple test framework
class TestRunner {
    constructor(name) {
        this.name = name;
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(description, fn) {
        this.tests.push({ description, fn });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    assertClose(actual, expected, tolerance = 0.01, message) {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(message || `Expected ${expected}, got ${actual} (tolerance: ${tolerance})`);
        }
    }

    async run() {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Running ${this.name}`);
        console.log('='.repeat(60));

        for (const { description, fn } of this.tests) {
            try {
                await fn.call(this);
                console.log(`✅ ${description}`);
                this.passed++;
            } catch (error) {
                console.error(`❌ ${description}`);
                console.error(`   Error: ${error.message}`);
                this.failed++;
            }
        }

        console.log(`\n${'-'.repeat(60)}`);
        console.log(`Results: ${this.passed} passed, ${this.failed} failed`);
        console.log('='.repeat(60)\n);

        return { passed: this.passed, failed: this.failed };
    }
}

// Test Suite
const testSuite = new TestRunner('Config Module Tests');

// Test: Buy Amount Calculation
testSuite.test('calculateBuyAmount: Basic calculation', function() {
    const result = calculateBuyAmount(100, 80); // 100 USDT at 80 USDT/ARUB
    this.assertClose(result.fee, 0.5, 0.01, 'Fee should be 0.5 USDT (0.5% of 100)');
    this.assertClose(result.amountAfterFee, 99.5, 0.01, 'Amount after fee should be 99.5');
    this.assertClose(result.arubReceived, 1.24375, 0.01, 'ARUB received should be ~1.24');
});

testSuite.test('calculateBuyAmount: Minimum amount', function() {
    const result = calculateBuyAmount(1, 80);
    this.assertClose(result.fee, 0.005, 0.001);
    this.assert(result.arubReceived > 0, 'Should receive some ARUB');
});

testSuite.test('calculateBuyAmount: Large amount', function() {
    const result = calculateBuyAmount(10000, 80);
    this.assertClose(result.fee, 50, 0.1);
    this.assertClose(result.amountAfterFee, 9950, 1);
});

// Test: Sell Amount Calculation
testSuite.test('calculateSellAmount: Basic calculation', function() {
    const result = calculateSellAmount(10, 80); // 10 ARUB at 80 USDT/ARUB
    this.assertClose(result.valueBeforeFee, 800, 0.1);
    this.assertClose(result.fee, 8, 0.1, 'Fee should be 1% of 800 = 8');
    this.assertClose(result.usdtReceived, 792, 0.1);
});

testSuite.test('calculateSellAmount: Small amount', function() {
    const result = calculateSellAmount(0.1, 80);
    this.assert(result.usdtReceived > 0, 'Should receive some USDT');
});

// Test: Tier System
testSuite.test('getCurrentTier: Tier 1 (0 - $100k)', function() {
    const tier = getCurrentTier(50000); // $50k staked
    this.assertEqual(tier.tier, 0, 'Should be tier 0 (first tier)');
    this.assertEqual(tier.apy, 2400, 'APY should be 2400 basis points (24%)');
    this.assertEqual(tier.threshold, 100000, 'Next threshold should be $100k');
});

testSuite.test('getCurrentTier: Tier 2 ($100k - $200k)', function() {
    const tier = getCurrentTier(150000); // $150k staked
    this.assertEqual(tier.tier, 1);
    this.assertEqual(tier.apy, 2000, 'APY should be 2000 basis points (20%)');
});

testSuite.test('getCurrentTier: Tier 5 (max tier)', function() {
    const tier = getCurrentTier(1000000); // $1M staked
    this.assertEqual(tier.tier, 4, 'Should be tier 4 (last tier)');
    this.assertEqual(tier.apy, 800, 'APY should be 800 basis points (8%)');
    this.assertEqual(tier.threshold, null, 'No next threshold for max tier');
});

testSuite.test('getCurrentTier: Edge case at threshold', function() {
    const tierJustBefore = getCurrentTier(99999);
    const tierAtThreshold = getCurrentTier(100000);

    this.assertEqual(tierJustBefore.tier, 0);
    this.assertEqual(tierAtThreshold.tier, 1, 'Should move to next tier at threshold');
});

// Test: Number Formatting
testSuite.test('formatNumber: Basic formatting', function() {
    const formatted = formatNumber(1234.56, 2);
    this.assertEqual(formatted, '1,234.56');
});

testSuite.test('formatNumber: Large number', function() {
    const formatted = formatNumber(1234567.89, 2);
    this.assertEqual(formatted, '1,234,567.89');
});

testSuite.test('formatNumber: Decimal places', function() {
    const formatted = formatNumber(1234.56789, 4);
    this.assertEqual(formatted, '1,234.5679');
});

// Test: Fee Percentages
testSuite.test('CONFIG: Buy fee is 0.5%', function() {
    this.assertEqual(CONFIG.FEES.BUY_FEE, 0.005);
});

testSuite.test('CONFIG: Sell fee is 1%', function() {
    this.assertEqual(CONFIG.FEES.SELL_FEE, 0.01);
});

// Test: Tier Thresholds
testSuite.test('CONFIG: Tier thresholds are correct', function() {
    this.assertEqual(CONFIG.STAKING.TIER_THRESHOLDS_USD.length, 4);
    this.assertEqual(CONFIG.STAKING.TIER_THRESHOLDS_USD[0], 100000);
    this.assertEqual(CONFIG.STAKING.TIER_THRESHOLDS_USD[3], 800000);
});

testSuite.test('CONFIG: APY tiers are correct', function() {
    this.assertEqual(CONFIG.STAKING.TIER_APYS.length, 5);
    this.assertEqual(CONFIG.STAKING.TIER_APYS[0], 2400); // 24%
    this.assertEqual(CONFIG.STAKING.TIER_APYS[4], 800);  // 8%
});

// Test: Contract Addresses
testSuite.test('CONFIG: Contract addresses are valid', function() {
    this.assert(CONFIG.USDT_ADDRESS.startsWith('0x'), 'USDT address should start with 0x');
    this.assertEqual(CONFIG.USDT_ADDRESS.length, 42, 'USDT address should be 42 characters');

    this.assert(CONFIG.TOKEN_ADDRESS.startsWith('0x'), 'TOKEN address should start with 0x');
    this.assertEqual(CONFIG.TOKEN_ADDRESS.length, 42, 'TOKEN address should be 42 characters');

    this.assert(CONFIG.STAKING_ADDRESS.startsWith('0x'), 'STAKING address should start with 0x');
    this.assertEqual(CONFIG.STAKING_ADDRESS.length, 42, 'STAKING address should be 42 characters');
});

// Run tests
testSuite.run().then(results => {
    if (results.failed > 0) {
        console.error(`\n⚠️ ${results.failed} test(s) failed!`);
        window.testResults = { success: false, ...results };
    } else {
        console.log('\n✅ All tests passed!');
        window.testResults = { success: true, ...results };
    }
});

export default testSuite;
