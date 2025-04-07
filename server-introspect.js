import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';
import { Neo4jGraphQL } from "@neo4j/graphql";
import { toGraphQLTypeDefs } from "@neo4j/introspector";
import neo4j from "neo4j-driver";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const NEO4J_HOST = process.env.NEO4J_HOST;
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const JWT_KEY = process.env.JWT_KEY;

const driver = neo4j.driver(
    `neo4j://${NEO4J_HOST}:${NEO4J_PORT}`, 
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));

const sessionFactory = () =>
    driver.session({ defaultAccessMode: neo4j.session.READ });

// We create a async function here until "top level await" has landed
// so we can use async/await
async function main() {
    const readonly = true; // We don't want to expose mutations in this case
    const typeDefs = await toGraphQLTypeDefs(sessionFactory, readonly);

    const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    const server = new ApolloServer({
        schema: await neoSchema.getSchema(),
    });

startStandaloneServer(server, {
        context: async ({ req }) => {
          let decoded = null;
          if (req && req.headers && req.headers.authorization) {
            try {
              decoded = jwt.verify(
                req.headers.authorization.slice(7),
                JWT_KEY
              );
            } catch (e) {
              // token not valid
              console.log(e);
            }
          }
          return { user: decoded };
        },
        listen: { port: 4000 },
      }).then(({ url }) => {
        console.log(`🚀 Server ready at ${url}`);
      }).catch(error => {
        console.error('Error starting the server:', error);
    });
}

main().then(() => {
    console.log("Server is running");
}
).catch((error) => {
    console.error("Error starting server:", error);
});