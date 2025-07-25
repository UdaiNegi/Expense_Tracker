import { z } from 'zod';
import { NeuroLink } from '@juspay/neurolink';
import * as fs from 'fs';
import * as path from 'path';

// Define the structure for a tax slab
interface TaxSlab {
  min_income: number;
  max_income: number;
  rate: number;
  base_tax: number;
}

// Define the structure for tax regime data
interface TaxRegime {
  [key: string]: TaxSlab[];
}

// Define the overall tax data structure
interface TaxData {
  regimes: {
    old: TaxRegime;
    new: TaxRegime;
  };
  rebate_87A: {
    old: { max_income: number; max_rebate: number };
    new: { max_income: number; max_rebate: number };
  };
  cess_rate: number;
}

// Function to calculate tax based on income, age, and regime
function calculateTax(income: number, age: number, regime: 'old' | 'new', taxData: TaxData): { tax: number; slab: string; effectiveRate: number } {
  let applicableSlabs: TaxSlab[] = [];
  let ageCategory: string = 'less_than_60';

  if (regime === 'old') {
    if (age >= 80) {
      ageCategory = 'above_80';
    } else if (age >= 60) {
      ageCategory = 'between_60_and_80';
    }
    applicableSlabs = taxData.regimes.old[ageCategory];
  } else { // new regime
    applicableSlabs = taxData.regimes.new.all_ages;
  }

  let tax = 0;
  let currentSlab: TaxSlab | undefined;

  for (const slab of applicableSlabs) {
    if (income >= slab.min_income && income <= slab.max_income) {
      currentSlab = slab;
      tax = slab.base_tax + (income - slab.min_income) * slab.rate;
      break;
    }
    // Handle cases where income is above the current slab but below the next,
    // meaning it falls into the current slab's rate for the portion above min_income
    else if (income > slab.max_income && slab.max_income === 9007199254740991) { // Check for the "Infinity" equivalent
        currentSlab = slab;
        tax = slab.base_tax + (income - slab.min_income) * slab.rate;
        break;
    }
  }

  if (!currentSlab) {
    // Fallback if no slab is matched (should not happen with correct data and logic)
    // This might indicate income is below the lowest slab, or an error in slab definition
    currentSlab = applicableSlabs[0]; // Default to the lowest slab
    tax = 0; // No tax for income below the first slab
  }


  // Apply Rebate u/s 87A
  if (regime === 'old' && income <= taxData.rebate_87A.old.max_income) {
    tax = Math.max(0, tax - taxData.rebate_87A.old.max_rebate);
  } else if (regime === 'new' && income <= taxData.rebate_87A.new.max_income) {
    tax = Math.max(0, tax - taxData.rebate_87A.new.max_rebate);
  }

  // Add Health & Education Cess
  tax += tax * taxData.cess_rate;

  const effectiveRate = income > 0 ? (tax / income) * 100 : 0;
  const slabDescription = `Income between ₹${currentSlab.min_income.toLocaleString('en-IN')} and ₹${currentSlab.max_income === 9007199254740991 ? 'above' : currentSlab.max_income.toLocaleString('en-IN')}`;

  return { tax, slab: slabDescription, effectiveRate };
}

export function registerCalculateTaxSlabTool(neurolink: NeuroLink) {
  neurolink.registerTool("calculateTaxSlab", {
    description: "Calculates the income tax liability and identifies the tax slab based on income, age, and chosen tax regime for India (AY 2025-26 / FY 2024-25).",
    parameters: z.object({
      incomeAmount: z.number().min(0).describe("The total taxable income in Indian Rupees (INR)."), // Ensure income is a non-negative number
      age: z.number().int().min(0).optional().describe("The age of the individual. Defaults to less than 60 if not provided."),
      taxRegime: z.enum(["old", "new"]).optional().describe("The tax regime to use: 'old' or 'new'. Defaults to 'new'.")
    }),
    execute: async (args: any) => { // Use any for args and context for now
      const { incomeAmount, age = 30, taxRegime = "new" } = args;

      if (typeof incomeAmount !== 'number' || incomeAmount < 0) {
        return {
          error: "Invalid incomeAmount provided. Must be a non-negative number.",
        } as any; // Cast to any to satisfy JsonValue type
      }

      try {
        const taxDataPath = path.join(process.cwd(), 'data', 'tax_slabs_india_2024_25.json');
        const taxDataRaw = fs.readFileSync(taxDataPath, 'utf8');
        const taxData: TaxData = JSON.parse(taxDataRaw);

        const { tax, slab, effectiveRate } = calculateTax(incomeAmount, age, taxRegime, taxData);

        return {
          message: `For an income of ₹${incomeAmount.toLocaleString('en-IN')}, under the ${taxRegime} tax regime (age ${age}), the estimated tax is ₹${tax.toLocaleString('en-IN')}. You fall under the slab: ${slab}. The effective tax rate is ${effectiveRate.toFixed(2)}%.`,
          taxAmount: tax,
          taxSlab: slab,
          effectiveTaxRate: effectiveRate
        } as any; // Cast to any to satisfy JsonValue type
      } catch (error: any) {
        return {
          error: `Failed to calculate tax slab: ${error.message}`,
          details: error.stack
        } as any; // Cast to any to satisfy JsonValue type
      }
    },
  });
}
