"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ec2HttpdStack = void 0;
const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const path = require("path");
const aws_s3_assets_1 = require("aws-cdk-lib/aws-s3-assets");
class Ec2HttpdStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const cfnAsset = new aws_s3_assets_1.Asset(this, 'cfn-asset', {
            path: path.join(__dirname, '../src/cfn/ec2-inst.yaml')
        });
        const childStackName = cdk.Stack.of(this).stackName + '-ec2-inst';
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
exports.Ec2HttpdStack = Ec2HttpdStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLWh0dHBkLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWMyLWh0dHBkLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQywyQ0FBMkM7QUFFM0MsaURBQWlEO0FBRWpELDZCQUE2QjtBQUM3Qiw2REFBa0Q7QUFPbEQsTUFBYSxhQUFjLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDMUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ2pFLElBQUksRUFBRSxRQUFRO1lBQ2QsV0FBVyxFQUFFLDZCQUE2QjtZQUMxQyxjQUFjLEVBQUUsNkRBQTZEO1NBQzlFLENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQ3pELElBQUksRUFBRSxRQUFRO1lBQ2QsV0FBVyxFQUFFLGVBQWU7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQzdDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUV2QyxjQUFjO1FBQ2hCLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2xELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUMzRCxXQUFXLEVBQUUsMEJBQTBCO1lBQ3ZDLGVBQWUsRUFBRTtn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LFFBQVEsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDakUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ2xFLFdBQVcsRUFBRSx3Q0FBd0M7WUFDckQsV0FBVyxFQUFFO2dCQUNYLFdBQVcsRUFBRSxNQUFNO2dCQUNuQixXQUFXLEVBQUUsY0FBYztnQkFDM0IsYUFBYSxFQUFFLFFBQVEsQ0FBQyxPQUFPO2dCQUMvQixrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxhQUFhO2dCQUNsRCxhQUFhLEVBQUUsWUFBWSxDQUFDLGFBQWE7YUFDMUM7WUFDRCxZQUFZLEVBQUUsa0JBQWtCO1lBQ2hDLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsSUFBSSxFQUFFLFVBQVU7WUFDaEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUNsQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1NBQ25DLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNIRCxzQ0EySEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnd3YyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djInO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEFzc2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWFzc2V0cyc7XG5cbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuXG5cbmltcG9ydCB7IEVjMkluc3QgfSBmcm9tICcuL2VjMi1pbnN0JztcblxuZXhwb3J0IGNsYXNzIEVjMkh0dHBkU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG4gICAgXG4gICAgY29uc3QgaW5ib3VuZENpZHJQYXJhbSA9IG5ldyBjZGsuQ2ZuUGFyYW1ldGVyKHRoaXMsICdpbmJvdW5kY2lkcicsIHtcbiAgICAgIHR5cGU6ICdTdHJpbmcnLFxuICAgICAgZGVzY3JpcHRpb246ICdDSURSIGZvciBJbmJvdW5kIFNTSCBhY2Nlc3MnLFxuICAgICAgYWxsb3dlZFBhdHRlcm46ICdeKFswLTldezEsM31cXC4pezN9WzAtOV17MSwzfShcXC8oWzAtOV18WzEtMl1bMC05XXwzWzAtMl0pKT8kJ1xuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IGtleVBhaXJQYXJhbSA9IG5ldyBjZGsuQ2ZuUGFyYW1ldGVyKHRoaXMsICdrZXlwYWlyJywge1xuICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICBkZXNjcmlwdGlvbjogJ0tleSBQYWlyIE5hbWUnXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgYWNjb3VudElkID0gY2RrLlN0YWNrLm9mKHRoaXMpLmFjY291bnQ7XG4gICAgY29uc3QgcmVnaW9uID0gY2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbjtcbiAgICBcbiAgICAgIC8vIGxhbWJkYSByb2xlXG4gICAgY29uc3QgbGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnTGFtYmRhUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgZGVzY3JpcHRpb246ICdSb2xlIGZvciBMYW1iZGEgZnVuY3Rpb24nLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uUzNSZWFkT25seUFjY2VzcycpLFxuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkVDMkZ1bGxBY2Nlc3MnKSxcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdJQU1GdWxsQWNjZXNzJyksXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uU1NNUmVhZE9ubHlBY2Nlc3MnKVxuICAgICAgXVxuICAgIH0pO1xuICAgIGNvbnN0IGN3UG9saWN5ID0gbmV3IGlhbS5Qb2xpY3kodGhpcywgJ2N3LXBvbGljeScsIHtcbiAgICAgIHBvbGljeU5hbWU6ICdjdy1wb2xpY3knLFxuICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ0dyb3VwXCIsXG4gICAgICAgICAgICBcImxvZ3M6Q3JlYXRlTG9nU3RyZWFtXCIsXG4gICAgICAgICAgICBcImxvZ3M6UHV0TG9nRXZlbnRzXCJcbiAgICAgICAgICBdLFxuICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgIGBhcm46YXdzOmxvZ3M6JHtyZWdpb259OiR7YWNjb3VudElkfTpsb2ctZ3JvdXA6L2F3cy9sYW1iZGEvKmBcbiAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgICBdXG4gICAgfSk7XG4gICAgY29uc3QgY2ZuUG9saWN5ID0gbmV3IGlhbS5Qb2xpY3kodGhpcywgJ2Nmbi1wb2xpY3knLCB7XG4gICAgICBwb2xpY3lOYW1lOiAnY2ZuLXBvbGljeScsXG4gICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICBhY3Rpb25zOiBbXG5cdFx0XHRcdFx0XHQnY2xvdWRmb3JtYXRpb246U2V0U3RhY2tQb2xpY3knLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOkRlc2NyaWJlU3RhY2tSZXNvdXJjZXMnLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOlNpZ25hbFJlc291cmNlJyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpEZXNjcmliZVN0YWNrUmVzb3VyY2UnLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOkdldFRlbXBsYXRlU3VtbWFyeScsXG5cdFx0XHRcdFx0XHQnY2xvdWRmb3JtYXRpb246RGVzY3JpYmVTdGFja3MnLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOlJvbGxiYWNrU3RhY2snLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOkdldFN0YWNrUG9saWN5Jyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpEZXNjcmliZVN0YWNrRXZlbnRzJyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpDcmVhdGVTdGFjaycsXG5cdFx0XHRcdFx0XHQnY2xvdWRmb3JtYXRpb246R2V0VGVtcGxhdGUnLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOkRlbGV0ZVN0YWNrJyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpUYWdSZXNvdXJjZScsXG5cdFx0XHRcdFx0XHQnY2xvdWRmb3JtYXRpb246VXBkYXRlU3RhY2snLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOlVudGFnUmVzb3VyY2UnLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOkxpc3RTdGFja1Jlc291cmNlcydcbiAgICAgICAgICBdLFxuICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICByZXNvdXJjZXM6IFtcblx0XHRcdFx0XHRcdGBhcm46YXdzOmNsb3VkZm9ybWF0aW9uOiR7cmVnaW9ufToke2FjY291bnRJZH06c3RhY2tzZXQvKmAsXG5cdFx0XHRcdFx0XHRgYXJuOmF3czpjbG91ZGZvcm1hdGlvbjoke3JlZ2lvbn06JHthY2NvdW50SWR9OnN0YWNrLyovKmAsXG5cdFx0XHRcdFx0XHRgYXJuOmF3czpjbG91ZGZvcm1hdGlvbjoke3JlZ2lvbn06JHthY2NvdW50SWR9OmNoYW5nZVNldC8qLypgXG4gICAgICAgICAgXVxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgIGFjdGlvbnM6IFtcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpSZWdpc3RlclR5cGUnLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOkxpc3RTdGFja3MnLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOlNldFR5cGVEZWZhdWx0VmVyc2lvbicsXG5cdFx0XHRcdFx0XHQnY2xvdWRmb3JtYXRpb246RGVzY3JpYmVUeXBlJyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpQdWJsaXNoVHlwZScsXG5cdFx0XHRcdFx0XHQnY2xvdWRmb3JtYXRpb246TGlzdFR5cGVzJyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpEZWFjdGl2YXRlVHlwZScsXG5cdFx0XHRcdFx0XHQnY2xvdWRmb3JtYXRpb246U2V0VHlwZUNvbmZpZ3VyYXRpb24nLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOkRlcmVnaXN0ZXJUeXBlJyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpMaXN0VHlwZVJlZ2lzdHJhdGlvbnMnLFxuXHRcdFx0XHRcdFx0J2Nsb3VkZm9ybWF0aW9uOlRlc3RUeXBlJyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpWYWxpZGF0ZVRlbXBsYXRlJyxcblx0XHRcdFx0XHRcdCdjbG91ZGZvcm1hdGlvbjpMaXN0VHlwZVZlcnNpb25zJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgJyonXG4gICAgICAgICAgXVxuICAgICAgICB9KVxuICAgICAgXVxuICAgIH0pO1xuICAgIGxhbWJkYVJvbGUuYXR0YWNoSW5saW5lUG9saWN5KGN3UG9saWN5KTtcbiAgICBsYW1iZGFSb2xlLmF0dGFjaElubGluZVBvbGljeShjZm5Qb2xpY3kpO1xuXG4gICAgY29uc3QgY2ZuQXNzZXQgPSBuZXcgQXNzZXQodGhpcywgJ2Nmbi1hc3NldCcsIHtcbiAgICAgIHBhdGg6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9zcmMvY2ZuL2VjMi1pbnN0LnlhbWwnKVxuICAgIH0pO1xuXG4gICAgY29uc3QgY2hpbGRTdGFja05hbWUgPSBjZGsuU3RhY2sub2YodGhpcykuc3RhY2tOYW1lKyctZWMyLWluc3QnO1xuICAgIC8vIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGVjMkxhdW5jaGVyID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZWMyLWluc3QtbGF1bmNoZXInLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3NyYy9sYW1iZGEnKSksXG4gICAgICBkZXNjcmlwdGlvbjogJ0xhbWJkYSBmdW5jdGlvbiB0byBsYXVuY2ggZWMyIGluc3RhbmNlJyxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICdsb2dfbGV2ZWwnOiAnSU5GTycsXG4gICAgICAgICdTdGFja05hbWUnOiBjaGlsZFN0YWNrTmFtZSxcbiAgICAgICAgJ1RlbXBsYXRlVVJMJzogY2ZuQXNzZXQuaHR0cFVybCxcbiAgICAgICAgJ0luYm91bmRDaWRyUGFyYW0nOiBpbmJvdW5kQ2lkclBhcmFtLnZhbHVlQXNTdHJpbmcsXG4gICAgICAgICdLZXlQYWlyTmFtZSc6IGtleVBhaXJQYXJhbS52YWx1ZUFzU3RyaW5nXG4gICAgICB9LFxuICAgICAgZnVuY3Rpb25OYW1lOiAnZWMyLWluc3QtaGFuZGxlcicsXG4gICAgICBoYW5kbGVyOiAnd2wtbGF1bmNoZXIubGFtYmRhX2hhbmRsZXInLFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzgsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMDApXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==