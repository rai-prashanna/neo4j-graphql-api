import { ApolloServer } from "@apollo/server";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { startStandaloneServer } from '@apollo/server/standalone';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();
const NEO4J_HOST = process.env.NEO4J_HOST;
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const JWT_KEY = process.env.JWT_KEY;

/* try {

  } catch (err) {
    console.error('Error reading schema.graphql file:', err);
} */

const graphqlTypeDef = readFileSync('./schema.graphql', 'utf-8');  // Replace with your file path
const graphqlTypeDefs=`\`${graphqlTypeDef}\``
console.log(graphqlTypeDefs);  // Prints the content of the file
const peopleArray = [
	{
	  name: "Bob",
	},
	{
	  name: "Lindsey",
	},
  ];
  
const typeDefs = /* GraphQL */ `
	type Query {
	  people: [Person]
	}
  
	type Person {
	  name: String
	}
  `;

/* const resolvers = {
	Query: {
	  people: (obj, args, context, info) => {
		if (context.user) {
		  return peopleArray;
		} else {
		  throw new Error("You are not authorized");
		}
	  },
	},
}; 

:param subscriptionType=>"DeLaval Alerts";
:param deviceType=>"VMS™ V300";
:param hardwareVersion=>2.1;
:param serviceDate=>"2012-01-5"; 

*/

const driver = neo4j.driver(
  `bolt://${NEO4J_HOST}:${NEO4J_PORT}`,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);

	  const server = new ApolloServer({
		graphqlTypeDefs
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
		console.log(`🚀 GraphQL Server ready at ${url}`);
	  }).catch(error => {
        console.error('Error starting the GraphQL Server:', error);
    });