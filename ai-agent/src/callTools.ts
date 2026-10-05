const searchCodeTool = {
  type: "function",
  name: "searchCode",
  description:
    "Searches the CRM source code for a text, function name, class name, variable, route, SQL query, or other code-related term. Use this when you need to find where something is implemented in the CRM.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Text or code symbol to search for in the CRM source code.",
      },
    },
    required: ["query"],
  },
};

const readFileTool = {
  type: "function",
  name: "readFile",
  description:
    "Reads a source file from the CRM. Use this after searchCode when you need to inspect the actual implementation.",
  parameters: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Path to the file relative to the CRM root.",
      },
      startLine: {
        type: "number",
        description:
          "Optional first line to read. Defaults to the beginning of the file.",
      },
      endLine: {
        type: "number",
        description:
          "Optional last line to read. Defaults to the end of the file.",
      },
    },
    required: ["filePath"],
  },
};

const getStructure = {
  type: 'function',
  name: 'getStructure', 
  description: 'Get the project structure and output a clear tree view.',
  parameters: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the directory relative to the CRM root. Use empty string "" for root.'
      }
    },
    required: ['filePath']
  }
};

const findReferencesTool = {
  type: "function",
  name: "findReferences",
  description: "Finds all references and calls of a specific symbol in the codebase.",
  parameters: {
    type: "object",
    properties: {
      symbol: { type: "string", description: "The name of the function, class or variable." }
    },
    required: ["symbol"],
  },
};

const getFileInfoTool = {
  type: "function",
  name: "getFileInfo",
  description: "Возвращает метаданные о файле в CRM (существование, размер, расширение, пути). Помогает агенту оценить файлы перед чтением.",
  parameters: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Путь к файлу относительно корня CRM (например, 'backend/package.json').",
      },
    },
    required: ["filePath"],
  },
};


export const toolsConfig = [searchCodeTool, readFileTool, getStructure, findReferencesTool, getFileInfoTool];
