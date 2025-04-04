import { ApolloServer } from "@apollo/server";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { startStandaloneServer } from '@apollo/server/standalone';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const NEO4J_HOST = process.env.NEO4J_HOST;
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const JWT_KEY = process.env.JWT_KEY;


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

const driver = neo4j.driver(
  `bolt://${NEO4J_HOST}:${NEO4J_PORT}`,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);

const neoSchema = new Neo4jGraphQL({ typeDefs, driver ,
	 config: {
    	mutations: false, // Disables all mutations
  }, });


/* neoSchema.getSchema().then((schema) => {
  const server = new ApolloServer({
	schema,
  });
  server.listen().then(({ url }) => {
	console.log(`GraphQL server ready at ${url}`);
  });
}); */


/* neoSchema.getSchema()
    .then(schema => {
        const server = new ApolloServer({
            schema: schema,
        });

        return startStandaloneServer(server, {
            context: ({ req }) => ({ 
				req 
			}),
            listen: { port: 4000 },
        });
    })
    .then(({ url }) => {
      console.log(`🚀 Server ready at ${url}`);
    })
    .catch(error => {
        console.error('Error starting the server:', error);
    }); */

	const resolvers = {
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


	  const server = new ApolloServer({
		typeDefs,
		resolvers,
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