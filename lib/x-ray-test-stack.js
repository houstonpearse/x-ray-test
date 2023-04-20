const { Stack, Duration } = require("aws-cdk-lib");
const apiGateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");

class XRayTestStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // create an api gateway with a custom lambda authorizer
    const authorizerFunction = new lambda.Function(this, "CustomAuthorizer", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambdas/authorizer"),
      tracing: lambda.Tracing.ACTIVE,
    });

    const testFunction = new lambda.Function(this, "test", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambdas/helloworld"),
      tracing: lambda.Tracing.ACTIVE,
    });

    const authorizer = new apiGateway.RequestAuthorizer(this, "myauthorizer", {
      handler: authorizerFunction,
      identitySources: [apiGateway.IdentitySource.header("Authorization")],
    });

    const api = new apiGateway.RestApi(this, "xray-test-api", {
      restApiName: "X-Ray-Test-API",
      description: "An X-Ray Test",
      deploy: false,
    });

    const deployment = new apiGateway.Deployment(this, "Deployment", {
      api: api,
    });

    const apiGatewayDevStage = new apiGateway.Stage(this, "prod", {
      deployment: deployment,
      tracingEnabled: true,
    });

    const testLambdaIntegration = new apiGateway.LambdaIntegration(
      testFunction
    );

    api.root.addMethod("GET", testLambdaIntegration, {
      authorizer: authorizer,
      authorizationType: apiGateway.AuthorizationType.CUSTOM,
    });
  }
}

module.exports = { XRayTestStack };
