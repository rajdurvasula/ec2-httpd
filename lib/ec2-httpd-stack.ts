import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as path from 'path';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';

import { v4 as uuidv4 } from 'uuid';


import { Ec2Inst } from './ec2-inst';

export class Ec2HttpdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const inboundCidrParam = new cdk.CfnParameter(this, 'inboundcidr', {
      type: 'String',
      description: 'CIDR for Inbound SSH access',
      allowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$'
    });
    
    const keyPairParam = new cdk.CfnParameter(this, 'keypair', {
      type: 'String',
      description: 'Key Pair Name'
    });
    
    const accountId = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;
    
      // lambda role
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess')
      ]
    });
    const cwPolicy = new iam.Policy(this, 'cw-policy', {
      policyName: 'cw-policy',
      statements: [
        new iam.PolicyStatement({
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/*`
          ]
        })
      ]
    });
    const cfnPolicy = new iam.Policy(this, 'cfn-policy', {
      policyName: 'cfn-policy',
      statements: [
        new iam.PolicyStatement({
          actions: [
						'cloudformation:SetStackPolicy',
						'cloudformation:DescribeStackResources',
						'cloudformation:SignalResource',
						'cloudformation:DescribeStackResource',
						'cloudformation:GetTemplateSummary',
						'cloudformation:DescribeStacks',
						'cloudformation:RollbackStack',
						'cloudformation:GetStackPolicy',
						'cloudformation:DescribeStackEvents',
						'cloudformation:CreateStack',
						'cloudformation:GetTemplate',
						'cloudformation:DeleteStack',
						'cloudformation:TagResource',
						'cloudformation:UpdateStack',
						'cloudformation:UntagResource',
						'cloudformation:ListStackResources'
          ],
          effect: iam.Effect.ALLOW,
          resources: [
						`arn:aws:cloudformation:${region}:${accountId}:stackset/*`,
						`arn:aws:cloudformation:${region}:${accountId}:stack/*/*`,
						`arn:aws:cloudformation:${region}:${accountId}:changeSet/*/*`
          ]
        }),
        new iam.PolicyStatement({
          actions: [
						'cloudformation:RegisterType',
						'cloudformation:ListStacks',
						'cloudformation:SetTypeDefaultVersion',
						'cloudformation:DescribeType',
						'cloudformation:PublishType',
						'cloudformation:ListTypes',
						'cloudformation:DeactivateType',
						'cloudformation:SetTypeConfiguration',
						'cloudformation:DeregisterType',
						'cloudformation:ListTypeRegistrations',
						'cloudformation:TestType',
						'cloudformation:ValidateTemplate',
						'cloudformation:ListTypeVersions'
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            '*'
          ]
        })
      ]
    });
    lambdaRole.attachInlinePolicy(cwPolicy);
    lambdaRole.attachInlinePolicy(cfnPolicy);

    const cfnAsset = new Asset(this, 'cfn-asset', {
      path: path.join(__dirname, '../src/cfn/ec2-inst.yaml')
    });

    let stack_uuid = uuidv4();
    const childStackName = stack_uuid+'-inst';
    // Lambda function
    const ec2Launcher = new lambda.Function(this, 'ec2-inst-launcher', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda')),
      description: 'Lambda function to launch ec2 instance',
      environment: {
        'log_level': 'INFO',
        'StackName': childStackName,
        'TemplateURL': cfnAsset.httpUrl,
        'InboundCidrParam': inboundCidrParam.valueAsString,
        'KeyPairName': keyPairParam.valueAsString
      },
      functionName: 'ec2-inst-handler',
      handler: 'wl-launcher.lambda_handler',
      role: lambdaRole,
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(300)
    });
  }
}
