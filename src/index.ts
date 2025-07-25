import { NeuroLink } from '@juspay/neurolink';
import { registerCalculateTaxSlabTool } from '../tools/calculateTaxSlab';
import { registerProcessCsvAndStoreContextTool } from '../tools/processCsvAndStoreContext';
import { registerAnalyzeTransactionsTool } from '../tools/analyzeTransactions';
import * as fs from 'fs';
import * as readline from 'readline'; // Import readline

// Initialize NeuroLink
const neurolink = new NeuroLink();

// Register custom tools
registerCalculateTaxSlabTool(neurolink);
registerProcessCsvAndStoreContextTool(neurolink);
registerAnalyzeTransactionsTool(neurolink);

console.log("NeuroLink initialized and tools registered.");
console.log("You can now use the 'neurolink' instance to interact with AI and registered tools.");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, ans => resolve(ans)));
}

async function interactiveCli() {
  console.log("\n--- Financial Assistant CLI ---");
  console.log("Please ensure your GOOGLE_AI_API_KEY is set as an environment variable.");

  let csvFilePath: string;
  let contextName: string;

  // Step 1: Get CSV file path and process it
  while (true) {
    csvFilePath = await askQuestion("Enter the path to your transaction CSV file (e.g., 'transactions.csv'): ");
    if (fs.existsSync(csvFilePath)) {
      contextName = await askQuestion("Enter a name for this transaction context (e.g., 'my_transactions'): ");
      console.log(`Processing CSV file: ${csvFilePath} with context name: ${contextName}...`);
      try {
        const processResult = await neurolink.generate({
          input: { text: `Process the CSV file at ${csvFilePath} and store its context as '${contextName}'.` },
          provider: "google-ai"
        });
        console.log("CSV Processing Result:", processResult.content);
        if (processResult.content.includes("successfully processed")) {
          break; // Exit loop if successful
        } else {
          console.error("Failed to process CSV. Please try again.");
        }
      } catch (error: any) {
        console.error("Error during CSV processing:", error.message);
        console.error("Please ensure your AI provider API key is correctly set and try again.");
      }
    } else {
      console.log("File not found. Please enter a valid path.");
    }
  }

  console.log("\nCSV processed. You can now ask questions about your financial data.");
  console.log("Try questions like: 'How much did I spend on coffee last week from my_transactions?'");
  console.log("Or: 'What is my tax slab if my income is 1500000 under the new regime?'");
  console.log("Type 'exit' to quit.");

  // Step 2: Enter interactive query loop
  while (true) {
    const query = await askQuestion("\nYour query: ");
    if (query.toLowerCase() === 'exit') {
      break;
    }

    try {
      const aiResponse = await neurolink.generate({
        input: { text: query },
        provider: "google-ai"
      });
      console.log("AI Response:", aiResponse.content);
    } catch (error: any) {
      console.error("Error during AI generation:", error.message);
      console.error("Please ensure your AI provider API key is correctly set and try again.");
    }
  }

  rl.close();
  console.log("Exiting Financial Assistant CLI. Goodbye!");
}

// Start the interactive CLI
interactiveCli();
