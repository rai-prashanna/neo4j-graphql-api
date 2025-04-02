import { ApolloServer } from "@apollo/server";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { startStandaloneServer } from '@apollo/server/standalone';

const NEO4J_HOST = process.env.NEO4J_HOST;
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

const typeDefs = /* GraphQL */ `
type ActedInProperties @relationshipProperties {
	roles: [String]!
}

type Business @node {
	name: String!
	reviewsReviews: [Review!]! @relationship(type: "REVIEWS", direction: IN)
}

type Component @node {
	componentshasSubComponent: [Component!]! @relationship(type: "has_sub_component", direction: IN)
	containsBluePrintComponentBlueprints: [ComponentBlueprint!]! @relationship(type: "contains_blue_print", direction: OUT)
	deviceshasComponent: [Device!]! @relationship(type: "has_component", direction: IN)
	hasSubComponentComponents: [Component!]! @relationship(type: "has_sub_component", direction: OUT)
	installed_at: Date!
	label: String!
	serial_number: BigInt!
	serviced_at: Date!
}

type ComponentBlueprint @node {
	componentBlueprintshasSubComponentBlueprint: [ComponentBlueprint!]! @relationship(type: "has_sub_component_blueprint", direction: IN)
	componentscontainsBluePrint: [Component!]! @relationship(type: "contains_blue_print", direction: IN)
	devicescontainsBluePrint: [Device!]! @relationship(type: "contains_blue_print", direction: IN)
	hasSubComponentBlueprintComponentBlueprints: [ComponentBlueprint!]! @relationship(type: "has_sub_component_blueprint", direction: OUT)
	hotspotsmarksLocationOf: [Hotspot!]! @relationship(type: "marks_location_of", direction: IN)
	id: String!
	label: String!
}

type Device @node {
	containsBluePrintComponentBlueprints: [ComponentBlueprint!]! @relationship(type: "contains_blue_print", direction: OUT)
	farmshasDevice: [Farm!]! @relationship(type: "has_device", direction: IN)
	hardware_version: Float!
	hasComponentComponents: [Component!]! @relationship(type: "has_component", direction: OUT)
	hasDeviceTypeDeviceTypes: [DeviceType!]! @relationship(type: "has_device_type", direction: OUT)
	installed_at: Date!
	label: String!
	serial_number: BigInt!
	serviced_at: Date!
}

type DeviceType @node {
	deviceshasDeviceType: [Device!]! @relationship(type: "has_device_type", direction: IN)
	name: String!
}

type Farm @node {
	hasDeviceDevices: [Device!]! @relationship(type: "has_device", direction: OUT)
	name: String!
}

type Hotspot @node {
	file: String!
	id: String!
	linkId: String!
	marksLocationInImages: [Image!]! @relationship(type: "marks_location_in", direction: OUT)
	marksLocationOfComponentBlueprints: [ComponentBlueprint!]! @relationship(type: "marks_location_of", direction: OUT)
}

type Image @node {
	hotspotsmarksLocationIn: [Hotspot!]! @relationship(type: "marks_location_in", direction: IN)
	path: String!
}

type Movie @node {
	peopleActedIn: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedInProperties")
	peopleDirected: [Person!]! @relationship(type: "DIRECTED", direction: IN)
	peopleProduced: [Person!]! @relationship(type: "PRODUCED", direction: IN)
	peopleReviewed: [Person!]! @relationship(type: "REVIEWED", direction: IN, properties: "ReviewedProperties")
	peopleWrote: [Person!]! @relationship(type: "WROTE", direction: IN)
	released: BigInt!
	tagline: String
	title: String!
}

type Person @node {
	actedInMovies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedInProperties")
	born: BigInt
	directedMovies: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
	followsPeople: [Person!]! @relationship(type: "FOLLOWS", direction: OUT)
	name: String!
	peopleFollows: [Person!]! @relationship(type: "FOLLOWS", direction: IN)
	producedMovies: [Movie!]! @relationship(type: "PRODUCED", direction: OUT)
	reviewedMovies: [Movie!]! @relationship(type: "REVIEWED", direction: OUT, properties: "ReviewedProperties")
	wroteMovies: [Movie!]! @relationship(type: "WROTE", direction: OUT)
}

type Review @node {
	reviewsBusinesses: [Business!]! @relationship(type: "REVIEWS", direction: OUT)
	stars: BigInt!
	text: String!
	usersWrote: [User!]! @relationship(type: "WROTE", direction: IN)
}

type ReviewedProperties @relationshipProperties {
	rating: BigInt!
	summary: String!
}



type User @node {
	name: String!
	wroteReviews: [Review!]! @relationship(type: "WROTE", direction: OUT)
}


`;

const driver = neo4j.driver(
  `bolt://${NEO4J_HOST}:${NEO4J_PORT}`,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

neoSchema.getSchema()
    .then(schema => {
        const server = new ApolloServer({
            schema: schema,
        });

        return startStandaloneServer(server, {
            context: ({ req }) => ({ req }),
            listen: { port: 4000 },
        });
    })
    .then(({ url }) => {
      console.log(`🚀 Server ready at ${url}`);
    })
    .catch(error => {
        console.error('Error starting the server:', error);
    });


