import { z } from 'zod';
import { NeuroLink } from '@juspay/neurolink';
import * as fs from 'fs';
import * as path from 'path';

// Define the structure for a transaction record
interface Transaction {
  Date: Date; // Changed to Date object
  Description: string;
  Amount: number;
  Category: string;
  Type: string; // "Expense" or "Income"
}

export function registerAnalyzeTransactionsTool(neurolink: NeuroLink) {
  neurolink.registerTool("analyzeTransactions", {
    description: "Analyzes stored transaction data (spending, income, habits). Filters by category, time, type. Aggregates (sum, count, average).",
    parameters: z.object({
      contextName: z.string().describe("The name of the transaction context (JSON file) to analyze, e.g., 'my_transactions'."),
      category: z.string().optional().describe("Filter transactions by a specific category (e.g., 'Food', 'Transport', 'Coffee')."),
      timePeriod: z.string().optional().describe("Filter transactions by a time period (e.g., 'last week', 'last month', 'this year', 'YYYY-MM-DD to YYYY-MM-DD')."),
      transactionType: z.enum(["Expense", "Income"]).optional().describe("Filter transactions by type: 'Expense' or 'Income'."),
      aggregation: z.enum(["sum", "count", "average"]).optional().describe("The type of aggregation to perform: 'sum', 'count', or 'average'. Defaults to 'sum' for Amount, 'count' for transactions."),
      startDate: z.string().optional().describe("Start date for custom time period filter (YYYY-MM-DD). Used with endDate."),
      endDate: z.string().optional().describe("End date for custom time period filter (YYYY-MM-DD). Used with startDate.")
    }),
    execute: async (args: any) => {
      const { contextName, category, timePeriod, transactionType, aggregation = "sum", startDate, endDate } = args;

      if (!contextName) {
        return { error: "contextName is required to analyze transactions." } as any;
      }

      const inputJsonPath = path.join(process.cwd(), 'data', 'context', `${contextName}.json`);

      try {
        const fileContent = fs.readFileSync(inputJsonPath, 'utf8');
        let rawTransactions: any[] = JSON.parse(fileContent); // Parse as any[] first
        // Convert Amount to number and Date to Date object for proper filtering/calculation
        let transactions: Transaction[] = rawTransactions.map(t => ({
          ...t,
          Amount: parseFloat(t.Amount.toString()), // Ensure Amount is a number
          Date: new Date(t.Date) // Convert date string to Date object
        }));

        // Filter by transaction type
        if (transactionType) {
          transactions = transactions.filter(t => t.Type === transactionType);
        }

        // Filter by category
        if (category) {
          transactions = transactions.filter(t => t.Category.toLowerCase() === category.toLowerCase());
        }

        // Filter by time period
        let filterStartDate: Date | undefined;
        let filterEndDate: Date | undefined;
        const now = new Date();

        if (startDate && endDate) {
          filterStartDate = new Date(startDate);
          filterEndDate = new Date(endDate);
        } else if (timePeriod) {
          switch (timePeriod.toLowerCase()) {
            case 'last week':
              filterEndDate = new Date(now);
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 7);
              break;
            case 'last month':
              filterEndDate = new Date(now);
              filterStartDate = new Date(now);
              filterStartDate.setMonth(now.getMonth() - 1);
              break;
            case 'this month':
              filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
              filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              break;
            case 'this year':
              filterStartDate = new Date(now.getFullYear(), 0, 1);
              filterEndDate = new Date(now.getFullYear(), 11, 31);
              break;
            default:
              // Attempt to parse YYYY-MM-DD to YYYY-MM-DD format
              const dateRangeMatch = timePeriod.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
              if (dateRangeMatch) {
                filterStartDate = new Date(dateRangeMatch[1]);
                filterEndDate = new Date(dateRangeMatch[2]);
              }
              break;
          }
        }

        if (filterStartDate && filterEndDate) {
          transactions = transactions.filter(t => t.Date >= filterStartDate! && t.Date <= filterEndDate!);
        }

        let result: number | string;
        let message: string;

        switch (aggregation) {
          case 'sum':
            const sum = transactions.reduce((acc, t) => acc + t.Amount, 0);
            result = sum;
            message = `The total ${transactionType || ''} ${category ? category + ' ' : ''}amount for '${contextName}' ${timePeriod ? 'for ' + timePeriod : ''} is ₹${sum.toLocaleString('en-IN')}.`;
            break;
          case 'count':
            const count = transactions.length;
            result = count;
            message = `There are ${count} ${transactionType || ''} ${category ? category + ' ' : ''}transactions for '${contextName}' ${timePeriod ? 'for ' + timePeriod : ''}.`;
            break;
          case 'average':
            const avg = transactions.length > 0 ? transactions.reduce((acc, t) => acc + t.Amount, 0) / transactions.length : 0;
            result = avg;
            message = `The average ${transactionType || ''} ${category ? category + ' ' : ''}amount per transaction for '${contextName}' ${timePeriod ? 'for ' + timePeriod : ''} is ₹${avg.toLocaleString('en-IN')}.`;
            break;
          default:
            result = "Invalid aggregation type.";
            message = result;
            break;
        }

        return {
          message: message,
          result: result,
          filteredTransactionsCount: transactions.length
        } as any;

      } catch (error: any) {
        return {
          error: `Failed to analyze transactions from context '${contextName}': ${error.message}`,
          details: error.stack
        } as any;
      }
    },
  });
}
