export const findReferencesTool = {
  type: "function",
  name: "findReferences",
  description:
    "Находит все упоминания и вызовы определенного символа (функции, класса, переменной) в кодовой базе проекта. Помогает оценить влияние изменений перед модификацией кода.",
  parameters: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Имя функции, интерфейса, переменной или класса для поиска (например, 'creategroup' или 'ClientProfile').",
      },
    },
    required: ["symbol"],
  },
};

export const searchCodeTool = {
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

export const readFileTool = {
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

export const getStructure = {
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

export const tools = [searchCodeTool,readFileTool,getStructure,findReferencesTool];