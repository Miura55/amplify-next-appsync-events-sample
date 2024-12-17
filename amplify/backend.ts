import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

// import CDK resources:
import {
  CfnApi,
  CfnChannelNamespace,
  AuthorizationType,
} from 'aws-cdk-lib/aws-appsync';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
});

// create a new stack for our Event API resources:
const customResources = backend.createStack('custom-resources');

// add a new Event API to the stack:
const cfnEventAPI = new CfnApi(customResources, 'CfnEventAPI', {
  name: 'todo-event-api',
  eventConfig: {
    authProviders: [
      {
        authType: AuthorizationType.USER_POOL,
        cognitoConfig: {
          awsRegion: customResources.region,
          // configure Event API to use the Cognito User Pool provisioned by Amplify:
          userPoolId: backend.auth.resources.userPool.userPoolId,
        },
      },
    ],
    // configure the User Pool as the auth provider for Connect, Publish, and Subscribe operations:
    connectionAuthModes: [{ authType: AuthorizationType.USER_POOL }],
    defaultPublishAuthModes: [{ authType: AuthorizationType.USER_POOL }],
    defaultSubscribeAuthModes: [{ authType: AuthorizationType.USER_POOL }],
  },
});

// create a default namespace for our Event API:
new CfnChannelNamespace(
  customResources,
  'CfnEventAPINamespace',
  {
    apiId: cfnEventAPI.attrApiId,
    name: 'default',
  }
);

// attach a policy to the authenticated user role in our User Pool to grant access to the Event API:
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  new Policy(customResources, 'AppSyncEventPolicy', {
    statements: [
      new PolicyStatement({
        actions: [
          'appsync:EventConnect',
          'appsync:EventSubscribe',
          'appsync:EventPublish',
        ],
        resources: [`${cfnEventAPI.attrApiArn}/*`, `${cfnEventAPI.attrApiArn}`],
      }),
    ],
  })
);

// finally, add the Event API configuration to amplify_outputs:
backend.addOutput({
  custom: {
    events: {
      url: `https://${cfnEventAPI.getAtt('Dns.Http').toString()}/event`,
      aws_region: customResources.region,
      default_authorization_type: AuthorizationType.USER_POOL,
    },
  },
});
