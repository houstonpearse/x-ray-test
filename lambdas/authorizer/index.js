// Create a authorizer function for an api gateway route
const AWSXRay = require("aws-xray-sdk-core");
const AWS = require("aws-sdk"); // can use this to trace calls to dynamoDB
const ddb = AWSXRay.captureAWSClient(new AWS.DynamoDB());
exports.handler = async (event, context) => {
  try {
    ddb.listTables();
  } catch {
    console.log("DynamoDB Error");
  }
  // create X-Ray subsegment for DynamoDB Call
  const segment = AWSXRay.getSegment(); //returns the facade segment
  const subsegment = segment.addNewSubsegment("Mock DynamoDB Call");

  // Wait for half a second
  await new Promise((resolve) => setTimeout(resolve, 500));

  // close X-Ray subsegment for DynamoDB Call
  subsegment.close();

  // check return value from DynamoDB
  let isAuthorized = false;
  if (event.headers.authorization.includes("authorizedtoken")) {
    isAuthorized = true;
  }

  return {
    principalId: "testUser", // The principal user identification associated with the token sent by the client.
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: isAuthorized ? "Allow" : "Deny",
          Resource: event.methodArn,
        },
      ],
    },
  };
};
