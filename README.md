# Statement Analyzer

This project provides an AI-powered tool to analyze financial transactions from a CSV file and answer specific questions based on the data. It leverages the NeuroLink library to act as a "NeuroLink" for data analysis.

## Features

*   Reads transaction data from a CSV file.
*   Uses AI to answer natural language questions about your financial data.
*   Focuses on providing answers *only* from the provided CSV data, ensuring data privacy and relevance.

## Setup

To get this project up and running, follow these steps:

### 1. Node.js Installation

Ensure you have Node.js (version 18 or higher recommended) installed on your system. You can download it from the official Node.js website: [nodejs.org](https://nodejs.org/).

### 2. Google AI API Key

The `@juspay/neurolink` library requires a `GOOGLE_AI_API_KEY` to interact with Google's Generative AI models.

*   Obtain your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
*   Create a file named `.env` in the root directory of this project (i.e., `/Users/udai.negi/Documents/pysvr/.env`).
*   Add your API key to the `.env` file in the following format:
    ```
    GOOGLE_AI_API_KEY=YOUR_API_KEY_HERE
    ```
    Replace `YOUR_API_KEY_HERE` with your actual API key.

### 3. Install Dependencies

Navigate to the project directory in your terminal and install the required Node.js packages:

```bash
cd /Users/udai.negi/Documents/pysvr
npm install
```

*(If `npm install` fails, ensure Node.js and npm are correctly installed and in your system's PATH. You can verify by running `node -v` and `npm -v`.)*

## Usage

### 1. Prepare your CSV file

Ensure your CSV file has the following column headers (case-insensitive, order does not strictly matter as `csv-parse` will map them):

*   `date`
*   `description`
*   `amount`

Example `transactions.csv`:

```csv
date,description,amount
2024-01-01,Coffee Shop,15.50
2024-01-02,Groceries,75.20
2024-01-03,Salary,2500.00
2024-01-04,Coffee Shop,4.00
2024-01-05,Restaurant,50.00
2024-02-01,Coffee Shop,3.50
2024-02-05,Rent,1200.00
2024-02-10,Coffee Shop,6.00
2024-02-15,Books,25.00
2024-03-01,Coffee Shop,4.50
```

### 2. Run the analyzer

Execute the `statement_analyzer.js` script from your terminal, providing the path to your CSV file and your question in quotes:

```bash
node statement_analyzer.js <path_to_your_csv_file> "<your_question_here>"
```

**Examples:**

*   How much did I spend on coffee last month?
    ```bash
    node statement_analyzer.js transactions.csv "How much did I spend on coffee last month?"
    ```

*   Which tax slab do I come under? (Note: The AI will only use the provided data. If tax slab information isn't in your CSV, it will state it cannot answer.)
    ```bash
    node statement_analyzer.js transactions.csv "Which tax slab do I come under?"
    ```

*   What was my total income?
    ```bash
    node statement_analyzer.js transactions.csv "What was my total income?"
    ```

## How it Works

The `statement_analyzer.js` script performs the following steps:

1.  **Loads Environment Variables:** Reads your `GOOGLE_AI_API_KEY` from the `.env` file.
2.  **Parses CSV:** Reads the specified CSV file and parses its content into a structured array of transaction objects.
3.  **Constructs AI Prompt:** Creates a detailed prompt for the Google Generative AI model, including:
    *   Instructions for the AI (acting as a financial assistant).
    *   The CSV column headers.
    *   The entire transaction data in JSON format.
    *   Your specific question.
4.  **Generates Response:** Sends the prompt to the NeuroLink library and prints the AI's concise answer to your terminal.
