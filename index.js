import { ApolloServer } from "@apollo/server";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

dotenv.config();
const NEO4J_HOST = process.env.NEO4J_HOST;
const NEO4J_PORT = process.env.NEO4J_PORT;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

const typeDefs = /* GraphQL */ `
type Query {
      findBusinessWithCustomEndpointParameters(farmName: String): Farm
      @cypher(
        statement: """
        match(f:Farm { name: $farmName }) return f
        """,columnName: "f")

findUnservicedDevicesOrComponentsOrSubComponents(hardwareVersion: Float!,subscriptionType: String!,deviceType: String!,serviceDate: Date!): [UnServiceDeviceOrComponentOrSubComponent!]!
      @cypher(statement: """
MATCH (f:Farm)-[:holds_subscription]->(s:DeLavalSubscription {type: $subscriptionType})
USING INDEX s:DeLavalSubscription(type)
WITH f 
MATCH (f)-[:has_device]->(d:Device)-[:has_device_type]->(dt:DeviceType {name: $deviceType})
USING INDEX dt:DeviceType(name)
USING INDEX d:Device(hardware_version)  
WHERE d.hardware_version > $hardwareVersion
OPTIONAL MATCH (d)-[:has_component]->(component:Component)-[:has_sub_component*1..9]->(subComponent:Component)
WHERE d.serviced_at < date($serviceDate) OR component.serviced_at < date($serviceDate) OR subComponent.serviced_at < date($serviceDate)
RETURN {device_serial_number:d.serial_number, component_serial_number:component.serial_number, subcomponent_serial_number:subComponent.serial_number } as result
        """, columnName: "result")


		findUnservicedDevicesOrComponentsOrSubComponentsWithHardCodedParameters: [UnServiceDeviceOrComponentOrSubComponent!]!
      @cypher(statement: """
MATCH (f:Farm)-[:holds_subscription]->(s:DeLavalSubscription {type: "DeLaval Alerts"})
USING INDEX s:DeLavalSubscription(type)
WITH f 
MATCH (f)-[:has_device]->(d:Device)-[:has_device_type]->(dt:DeviceType {name: "VMS™ V300"})
USING INDEX dt:DeviceType(name)
USING INDEX d:Device(hardware_version)  
WHERE d.hardware_version > 2.1
OPTIONAL MATCH (d)-[:has_component]->(component:Component)-[:has_sub_component*1..9]->(subComponent:Component)
WHERE d.serviced_at < date("2017-01-20") OR component.serviced_at < date("2017-01-20") OR subComponent.serviced_at < date("2017-01-20")
RETURN {device_serial_number:d.serial_number, component_serial_number:component.serial_number, subcomponent_serial_number:subComponent.serial_number } as result
        """, columnName: "result")

  }

type UnServiceDeviceOrComponentOrSubComponent @node{
  device_serial_number: BigInt
  component_serial_number: BigInt
  subcomponent_serial_number: BigInt
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

type DeLavalSubscription @node {
	expiry_date: Date!
	farmsholdsSubscription: [Farm!]! @relationship(type: "holds_subscription", direction: IN)
	license_number: BigInt!
	type: String!
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
	holdsSubscriptionDeLavalSubscriptions: [DeLavalSubscription!]! @relationship(type: "holds_subscription", direction: OUT)
	name: String!
	region: String!
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



