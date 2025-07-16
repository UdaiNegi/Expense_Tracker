import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { NeuroLink } from '@juspay/neurolink'; // Import NeuroLink

dotenv.config();

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.error('Error: GOOGLE_AI_API_KEY environment variable is not set.');
  console.error('Please create a .env file with GOOGLE_AI_API_KEY=YOUR_API_KEY');
  process.exit(1);
}

// Initialize NeuroLink
const neurolink = new NeuroLink();

class StatementAnalyzer {
  constructor(csvFilePath, columnHeaders) {
    this.csvFilePath = csvFilePath;
    this.columnHeaders = columnHeaders;
    this.transactions = [];
  }

  async loadAndParseCsv() {
    console.log(`Loading and parsing CSV from: ${this.csvFilePath}`);
    try {
      const fileContent = readFileSync(this.csvFilePath, 'utf8');
      const parser = parse(fileContent, {
        columns: true, // Automatically use the first row as headers
        skip_empty_lines: true,
        trim: true
      });

      for await (const record of parser) {
        this.transactions.push(record);
      }
      console.log(`Successfully parsed ${this.transactions.length} transactions.`);
    } catch (error) {
      console.error(`Error loading or parsing CSV: ${error.message}`);
      process.exit(1);
    }
  }

  async analyze(question) {
    if (this.transactions.length === 0) {
      console.error('No transactions loaded. Please ensure the CSV file is valid.');
      return;
    }

    console.log(`Analyzing statement for question: "${question}"`);

    const prompt = `You are an expert financial assistant.
You will be provided with a list of financial transactions from a CSV file.
Your task is to answer a specific question based *only* on the provided transaction data.
Do not use any external knowledge. If the answer cannot be determined from the data, state that.

CSV Column Headers: ${this.columnHeaders.join(', ')}

Transaction Data (JSON format):
${JSON.stringify(this.transactions, null, 2)}

Question: "${question}"

Provide a concise answer, directly addressing the question. If calculations are needed, show the final result.
Example: "You spent $150 on coffee last month." or "Your total income was $5000."`;

    try {
      // Use neurolink.generateText instead of model.generateContent
      const result = await neurolink.generateText({ prompt: prompt, maxTokens: 1000000 });
      const text = result.content || result.text || result.response || ''; // Adjust based on NeuroLink's actual response structure
      console.log('\n--- AI Response ---');
      console.log(text);
      console.log('-------------------\n');
    } catch (error) {
      console.error(`Error generating AI response: ${error.message}`);
      // NeuroLink error handling might be different, log broadly for now
      console.error(`Full NeuroLink error: ${JSON.stringify(error, null, 2)}`);
    }
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node statement_analyzer.js <csv_file_path> "<your_question>"');
    console.log('Example: node statement_analyzer.js transactions.csv "How much did I spend on coffee last month?"');
    process.exit(0);
  }

  const csvFilePath = args[0];
  const question = args.slice(1).join(' '); // Join remaining args as the question

  // The column headers provided by the user
  const columnHeaders = ['date', 'description', 'amount']; 

  const analyzer = new StatementAnalyzer(csvFilePath, columnHeaders);
  await analyzer.loadAndParseCsv();
  await analyzer.analyze(question);
}

main();
