# Financial Assistant with NeuroLink

This project demonstrates a financial assistant built using the NeuroLink SDK, leveraging custom Model Context Protocol (MCP) tools to interact with AI models. The assistant can process transaction data, analyze spending/income, and calculate income tax slabs based on Indian tax rules.

## Features

*   **Data Ingestion**: Process transaction data from CSV files and store it in a structured format.
*   **Financial Analysis**: Query and analyze stored transaction data for insights into spending habits, income, and more.
*   **Tax Calculation**: Determine income tax liability and applicable tax slabs based on Indian tax regulations (AY 2025-26 / FY 2024-25).
*   **Interactive CLI**: A command-line interface for easy interaction, allowing users to provide CSV files and ask natural language queries.

## Project Structure

*   `src/index.ts`: The main entry point for the application, initializing NeuroLink and registering all custom MCP tools. It also contains the interactive CLI logic.
*   `tools/`: Contains the implementation of custom MCP tools:
    *   `calculateTaxSlab.ts`: Calculates income tax based on provided income, age, and tax regime.
    *   `processCsvAndStoreContext.ts`: Reads and parses CSV files, storing the data as JSON for persistent context.
    *   `analyzeTransactions.ts`: Analyzes stored transaction data to answer financial queries.
*   `data/`: Stores data files:
    *   `tax_slabs_india_2024_25.json`: Contains the Indian income tax slab rates.
    *   `context/`: Directory where processed CSV data is stored as JSON files.
*   `transactions.csv`: A demo CSV file with sample transaction data for testing.
*   `package.json`: Defines project metadata and dependencies.
*   `tsconfig.json`: TypeScript configuration file.
*   `.gitignore`: Specifies files and directories to be ignored by Git.

## Setup

1.  **Clone the repository (if applicable) or ensure you have all project files.**

2.  **Install Dependencies:**
    Navigate to the project root directory in your terminal and run:
    ```bash
    npm install
    ```

3.  **Set up Google AI API Key:**
    This project uses Google AI as the provider. You need to set your Google AI API key as an environment variable.

    *   **Get your API Key:** Obtain your `GOOGLE_AI_API_KEY` from Google AI Studio.
    *   **Set Environment Variable (macOS/Linux example):**
        Add the following line to your shell's configuration file (e.g., `~/.zshrc`, `~/.bashrc`):
        ```bash
        export GOOGLE_AI_API_KEY="YOUR_API_KEY_HERE"
        ```
        Replace `YOUR_API_KEY_HERE` with your actual key. After adding, run `source ~/.zshrc` (or your respective file) to apply changes.

## Usage

To start the interactive Financial Assistant CLI:

1.  **Ensure your `GOOGLE_AI_API_KEY` is set** as an environment variable.
2.  **Run the application** from your terminal:
    ```bash
    npm start
    ```
    or
    ```bash
    npx ts-node src/index.ts
    ```

### Interactive Session

The CLI will guide you through the following steps:

1.  **CSV File Input**:
    *   You will be prompted to enter the path to your transaction CSV file. You can use the provided `transactions.csv` demo file.
    *   You will then be asked to provide a name for this transaction context (e.g., `my_transactions`). This name will be used to refer to your data in subsequent queries.

2.  **Asking Queries**:
    Once the CSV is processed, you can ask natural language questions. The AI will intelligently use the registered tools to answer.

    **Example Queries:**

    *   **Financial Analysis:**
        *   "How much did I spend on Food last week from `my_transactions`?"
        *   "What was my total income last month from `my_transactions`?"
        *   "How many transactions are there for Transport in `my_transactions`?"
        *   "What is the average expense on Food in `my_transactions`?"

    *   **Tax Calculation (demonstrates tool chaining):**
        *   "Calculate my tax slab. My income for this calculation should be my total income from `my_transactions` for last month. Assume I am 30 years old and using the new tax regime."

3.  **Exiting**:
    Type `exit` to quit the application.

## Troubleshooting

*   **`Error: GOOGLE_AI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set`**: Ensure your API key is correctly set as an environment variable and your terminal session has loaded it.
*   **`Unknown file extension ".ts"` or `command not found: ts-node`**: Use `npx ts-node src/index.ts` or `npm start` to run the TypeScript files.
*   **Inaccurate results for time-based queries**: Ensure the dates in your CSV file are current relative to when you are running the application. The provided `transactions.csv` has been updated to July 2025 dates. Remember to re-process the CSV if you update it.
*   **AI asking for clarification**: For complex queries involving tool chaining, try to provide all necessary information in a single, comprehensive prompt as shown in the tax calculation example above.

---

**Built with NeuroLink SDK**
