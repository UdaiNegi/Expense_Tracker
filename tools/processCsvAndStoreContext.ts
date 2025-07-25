import { z } from 'zod';
import { NeuroLink } from '@juspay/neurolink';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

export function registerProcessCsvAndStoreContextTool(neurolink: NeuroLink) {
  neurolink.registerTool("processCsvAndStoreContext", {
    description: "Reads a CSV file, parses its content, and stores the data as a JSON file for later use by other tools. Useful for ingesting structured data like transaction logs.",
    parameters: z.object({
      csvFilePath: z.string().describe("The path to the CSV file to be processed."),
      contextName: z.string().optional().describe("An optional name for this context. If not provided, a name will be derived from the CSV file path. This will be the name of the JSON file (e.g., 'my_data.json').")
    }),
    execute: async (args: any) => {
      const { csvFilePath, contextName } = args;

      if (!csvFilePath) {
        return { error: "csvFilePath is required." } as any;
      }

      const fullCsvPath = path.join(process.cwd(), csvFilePath);
      const resolvedContextName = contextName || path.parse(csvFilePath).name;
      const outputJsonPath = path.join(process.cwd(), 'data', 'context', `${resolvedContextName}.json`);

      try {
        const fileContent = fs.readFileSync(fullCsvPath, 'utf8');

        const records = await new Promise((resolve, reject) => {
          parse(fileContent, {
            columns: true, // Treat the first row as column headers
            skip_empty_lines: true
          }, (err, records) => {
            if (err) {
              return reject(err);
            }
            resolve(records);
          });
        });

        fs.writeFileSync(outputJsonPath, JSON.stringify(records, null, 2), 'utf8');

        return {
          message: `CSV data from '${csvFilePath}' successfully processed and stored as JSON at '${outputJsonPath}'. Context name: '${resolvedContextName}'.`,
          outputFilePath: outputJsonPath,
          contextName: resolvedContextName,
          recordCount: (records as any[]).length
        } as any;
      } catch (error: any) {
        return {
          error: `Failed to process CSV file: ${error.message}`,
          details: error.stack
        } as any;
      }
    },
  });
}
