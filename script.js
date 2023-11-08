// src/index.mjs
import fs from "fs/promises";
import inquirer from "inquirer";
import knex from "knex";
import path from "path";
const moduleDir = process.cwd();

async function importIfFileExists(filePath) {
  try {
    await fs.access(filePath); // Check if the file exists
    const importedModule = await import(filePath); // Dynamically import the module
    return importedModule;
  } catch (error) {
    console.error(`The file at ${filePath} does not exist.`);
    return null; // Return null or handle the case when the file doesn't exist
  }
}
const connectionPath = "./src/db/connection.js";

async function promptUser() {
  const tableData = await inquirer.prompt([
    {
      type: "input",
      name: "tableName",
      message: "Enter the table name:",
    },
    {
      type: "input",
      name: "numColumns",
      message: "Enter the number of columns:",
      validate: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num > 0 ? true : "Please enter a valid number.";
      },
    },
  ]);

  const columns = [];
  let firstIntColumn = true; // Flag to track the first "int" column

  for (let i = 0; i < parseInt(tableData.numColumns); i++) {
    const columnData = await inquirer.prompt([
      {
        type: "input",
        name: "columnName",
        message: `Enter column ${i + 1} name:`,
      },
      {
        type: "list",
        name: "dataType",
        message: `Select column ${i + 1} data type:`,
        choices: ["int", "varchar", "double"],
      },
    ]);

    const column = {
      columnName: columnData.columnName,
      columnType: columnData.dataType,
    };

    // If it's the first column with 'int' type, set primaryKey and autoIncrement
    if (columnData.dataType === "int") {
      if (firstIntColumn) {
        column.primaryKey = true;
        column.autoIncrement = true;
        firstIntColumn = false; // Set the flag to false after the first "int" column
      }
    }

    columns.push(column);
  }

  const tableConfig = {
    tableName: tableData.tableName,
    columns,
  };

  const tableFolderPath = path.join(moduleDir, `src/${tableData.tableName}`);
  await fs.mkdir(tableFolderPath, { recursive: true });

  const entitesFilePath = path.join(
    tableFolderPath,
    `${tableData.tableName}entites.js`
  );
  const jsFileContentEntities = generateTableConfigJS(tableConfig);
  await fs.writeFile(entitesFilePath, jsFileContentEntities);
  console.log(`Table configuration saved to ${entitesFilePath}`);

  const controllerFilePath = path.join(
    tableFolderPath,
    `${tableData.tableName}controller.js`
  );
  const jsFileContentController = generateControllerJs(tableConfig);
  await fs.writeFile(controllerFilePath, jsFileContentController);
  console.log(`Controller saved to ${controllerFilePath}`);

  const routesFilePath = path.join(
    tableFolderPath,
    `${tableData.tableName}.router.js`
  );
  const jsFileContentRoutes = generateRoutesJs(tableConfig);
  await fs.writeFile(routesFilePath, jsFileContentRoutes);
  console.log(`Routes saved to ${routesFilePath}`);

  // api
  const apiFolderPath = path.join(moduleDir, `src/api`);
  const apiFilePath = path.join(apiFolderPath, `index.js`);

  try {
    await fs.mkdir(apiFolderPath, { recursive: true });

    const jsFileContentApi = await generateApiContent(); // Wait for the promise to resolve
    await fs.writeFile(apiFilePath, jsFileContentApi); // Write the resolved content
    console.log(`API content saved to ${apiFilePath}`);
  } catch (error) {
    console.error(`Error: ${error}`);
  }

  const createTableStatement = generateCreateTableStatement(tableConfig);
  console.log("\nGenerated CREATE TABLE statement:\n");
  console.log(createTableStatement);
}

async function dbConnectionPrompt() {
  const dbCred = await inquirer.prompt([
    {
      type: "input",
      name: "username",
      message: "Enter your database username:",
    },
    {
      type: "password",
      name: "password",
      message: "Enter your database password:",
    },
    {
      type: "input",
      name: "host",
      message: "Enter your host:",
    },
    {
      type: "input",
      name: "dbName",
      message: "Enter the name of the database:",
    },
  ]);
  const DataBaseConnectionfilePath = path.join(
    moduleDir,
    `src/db/connection.js`
  );
  // Create the directory if it doesn't exist
  await fs.mkdir(path.dirname(DataBaseConnectionfilePath), { recursive: true });
  const jsFileContentDatabase = generateConnectionJs(dbCred);
  await fs.writeFile(DataBaseConnectionfilePath, jsFileContentDatabase);
  dbConfig = dbCred;
  return dbCred;
}

const executeMigration = async (query) => {
  try {
    const importedModule = await importIfFileExists(connectionPath);
    if (importedModule) {
      const { cred } = importedModule;
      const connection = knex({
        client: "mysql2",
        connection: {
          host: cred.host,
          user: cred.user,
          password: cred.password,
          database: cred.database,
        },
        pool: {
          min: 2,
          max: 10,
        },
      });

      await connection.raw(query);
    }
  } catch (err) {
    throw err;
  }
};
async function generateCreateTableStatement(tableConfig) {
  const columns = tableConfig.columns
    .map((column) => {
      let dataType = column.columnType;
      if (column.primaryKey) {
        dataType = "int AUTO_INCREMENT";
      } else if (dataType === "varchar") {
        dataType = `${dataType}(255)`; // Adjust the length as needed
      }
      const primaryKey = column.primaryKey ? "PRIMARY KEY" : "";
      return `${column.columnName} ${dataType} ${primaryKey}`;
    })
    .join(", ");

  executeMigration(`CREATE TABLE ${tableConfig.tableName} (${columns});`);
  return `CREATE TABLE ${tableConfig.tableName} (${columns});`;
}

function generateTableConfigJS(tableConfig) {
  const columnsString = JSON.stringify(tableConfig.columns, null, 2);
  return `
import  connection  from "../db/connection.js";

const ${tableConfig.tableName} = {
  tableName: '${tableConfig.tableName}',
  columns: ${columnsString},
  insert: async function(data) {
    try {
      const rows = await connection('${tableConfig.tableName}').insert(data);
      console.log('Inserted data into ${tableConfig.tableName}');
      return rows;
    } catch (error) {
      console.error('Error inserting data:', error);
    }
  },
  find: async function(where = {}) {
    try {
      const result = await connection('${tableConfig.tableName}').where(where).select('*');
      console.log(result);
      return result;
    } catch (error) {
      console.error('Error selecting data:', error);
    }
  },
  findById: async function(id) {
    try {
      const result = await connection('${tableConfig.tableName}').select('*').where({ id: id });
      console.log(result);
      return result;
    } catch (error) {
      console.error('Error selecting data:', error);
    }
  },
  update: async function(data, id) {
    try {
      await connection('${tableConfig.tableName}')
        .where('id', id)
        .update(data);
      console.log('Updated data in ${tableConfig.tableName}');
    } catch (error) {
      console.error('Error updating data:', error);
    }
  },
  remove: async function(id) {
    try {
      await connection('${tableConfig.tableName}')
        .where('id', id)
        .del();
      console.log('Deleted data from ${tableConfig.tableName}');
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  }
};

export default ${tableConfig.tableName};
  `;
}
function generateControllerJs(tableConfig) {
  return `
import  ${tableConfig.tableName} from './${tableConfig.tableName}entites.js'
const ${tableConfig.tableName}Controller = {
  create: async (req, res) => {
    try {
      const result = await ${tableConfig.tableName}.insert(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Error inserting data' });
    }
  },

  findAll: async (req, res) => {
    try {
      const result = await ${tableConfig.tableName}.find();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Error selecting data' });
    }
  },

  findById: async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const result = await ${tableConfig.tableName}.findById(id);
      if (result.length > 0) {
        res.json(result[0]);
      } else {
        res.status(404).json({ error: 'Record not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error selecting data' });
    }
  },

  update: async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await ${tableConfig.tableName}.update(req.body, id);
      res.json({ message: 'Record updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error updating data' });
    }
  },

  remove: async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await ${tableConfig.tableName}.remove(id);
      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting data' });
    }
  }
};
export default  ${tableConfig.tableName}Controller
  `;
}

function generateConnectionJs(payload) {
  return `
  import knex from "knex";
  export  const cred = {      host: '${payload.host}',
   user: '${payload.username}',
   password: '${payload.password}',
   database: '${payload.dbName}',}
  const connection = knex({
    client: 'mysql2',
    connection: {
      host: '${payload.host}',
      user: '${payload.username}',
      password: '${payload.password}',
      database: '${payload.dbName}',
    },
    pool: {
      min: 2,
      max: 10,
    },})
    export default connection
`;
}

function generateRoutesJs(tableConfig) {
  return `
import express from 'express';
import ${tableConfig.tableName}Controller from './${tableConfig.tableName}controller.js';

const router = express.Router();

router.post('/', ${tableConfig.tableName}Controller.create);
router.get('/', ${tableConfig.tableName}Controller.findAll);
router.get('/:id', ${tableConfig.tableName}Controller.findById);
router.put('/:id', ${tableConfig.tableName}Controller.update);
router.delete('/:id', ${tableConfig.tableName}Controller.remove);

export default router;
  `;
}

// ... Previous code ...
async function generateApiContent() {
  const routerImportStatements = [];
  const routerUseStatements = [];

  const rootDirectoryPath = path.join(moduleDir, "src");

  // Read the contents of the root directory
  const subDirectories = await fs.readdir(rootDirectoryPath);

  for (const subDir of subDirectories) {
    const subDirPath = path.join(rootDirectoryPath, subDir);

    // Check if the subdirectory is a directory (not a file)
    const isDirectory = (await fs.stat(subDirPath)).isDirectory();

    if (isDirectory) {
      const routerFiles = await fs.readdir(subDirPath);

      for (const routerFile of routerFiles) {
        if (routerFile.endsWith(".router.js")) {
          const routerName = path.basename(routerFile, ".router.js");
          const importStatement = `import ${routerName} from '../${subDir}/${routerFile}';`;
          const useStatement = `router.use('/${subDir}', ${routerName});`; // Using subDir as route

          routerImportStatements.push(importStatement);
          routerUseStatements.push(useStatement);
        }
      }
    }
  }

  const routerContent = `
import express from 'express';
${routerImportStatements.join("\n")}
const router = express.Router();

${routerUseStatements.join("\n")}

export default router;
`;

  return routerContent;
}

async function createIndexFileForExpress() {
  const indexFilePath = path.join(moduleDir, "index.js");

  // Check if the index file already exists
  const indexFileExists = await fs.access(indexFilePath).then(
    () => true,
    (error) => false
  );

  if (!indexFileExists) {
    // Construct the content for the index file
    const indexFileContent = `

import express from 'express';
import apiRouter from './src/api/index.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const app = express();
app.use(express.json());
// Use the API router
app.use('/api', apiRouter);
const project = process.env?.PROJECT;
const swaggerDefinition = {
  info: {
    title: "Express CLI",
    version: "1.0.0",
    description: "Endpoints to test the user registration routes",
  },
  schemes: project === "DEV" ? ["http"] : ["https"],
  host: project === "DEV" ? "localhost:5000" : "localhost:3000",
  components: {
    schemas: {},
  },
  basePath: "/api",
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "authorization",
      scheme: "bearer",
      in: "header",
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  // import swaggerDefinitions
  swaggerDefinition,
  // path to the API docs
  apis: ["./src/routers/*.js"],
};

const specs = swaggerJsdoc(options);
app.use("/", swaggerUi.serve, swaggerUi.setup(specs));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server is running on port ${3000}');
});

`;

    // Write the content to the index file
    await fs.writeFile(indexFilePath, indexFileContent);
    console.log(`Index file created at ${indexFilePath}`);
  } else {
    console.log(`Index file already exists at ${indexFilePath}`);
  }
}

// Call the function to create the index file if needed

export async function ExpressCLI() {
  const DataBaseConnectionfilePath = path.join(
    moduleDir,
    `src/db/connection.js`
  );
  const dbFileExists = await fs.access(DataBaseConnectionfilePath).then(
    () => true,
    (error) => false
  );
  if (!dbFileExists) {
    await dbConnectionPrompt();
  }
  await promptUser();
  await createIndexFileForExpress();
}
