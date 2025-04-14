import { ApolloServer } from "@apollo/server";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { startStandaloneServer } from '@apollo/server/standalone';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { existsSync, unlinkSync } from 'fs';
dotenv.config();
const NEO4J_HOST = process.env.NEO4J_HOST;
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const JWT_KEY = process.env.JWT_KEY;
const typeDefs = readFileSync('./schema.graphql', 'utf-8');  // Replace with your file path

const driver = neo4j.driver(
  `bolt://${NEO4J_HOST}:${NEO4J_PORT}`,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);
const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

const server = new ApolloServer({
    schema: await neoSchema.getSchema(),
	csrfPrevention: false,
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