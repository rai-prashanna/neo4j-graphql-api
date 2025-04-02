import { toGraphQLTypeDefs } from "@neo4j/introspector";
import neo4j from "neo4j-driver";
import fs from "fs";

const NEO4J_HOST = process.env.NEO4J_HOST;
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(
    `bolt://${NEO4J_HOST}:${NEO4J_PORT}`, 
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
const sessionFactory = () => driver.session({ defaultAccessMode: neo4j.session.READ });
// We create a async function here until "top level await" has landed
// so we can use async/await
async function main() {
    const typeDefs = await toGraphQLTypeDefs(sessionFactory);
    fs.writeFileSync("schema.graphql", typeDefs);
    await driver.close();
}
main();