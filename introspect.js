import { toGraphQLTypeDefs } from "@neo4j/introspector";
import neo4j from "neo4j-driver";
import fs from "fs";
import dotenv from 'dotenv';
import { unlinkSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const NEO4J_HOST = process.env.NEO4J_HOST;
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const schema_file="schema.graphql"
const filePath = path.join(__dirname, schema_file);

try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
    } else {
      console.log(`File does not exist: ${filePath}`);
    }
  } catch (error) {
    console.error('Error while deleting file:', error);
  }

  
const driver = neo4j.driver(
    `neo4j://${NEO4J_HOST}:${NEO4J_PORT}`, 
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
const sessionFactory = () => driver.session({ defaultAccessMode: neo4j.session.READ });
// We create a async function here until "top level await" has landed
// so we can use async/await
async function main() {
    const typeDefs = await toGraphQLTypeDefs(sessionFactory);
    fs.writeFileSync(schema_file, typeDefs);
    console.log("Schema is written to file:", schema_file);
    await driver.close();
}
main();