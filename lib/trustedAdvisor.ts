import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class TrustedAdvisorPractices extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Low utilization for Amazon EC2
    const lowUtilizationMonitorInstanceRole = new iam.Role(this, 'low-utilization-ec2-instance-role', {
        roleName: 'AWSLambdaLowUtilizationEC2Instance',
        assumedBy: new iam.ServicePrincipal('lambda'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
        ],
        inlinePolicies: {
            InstanceCredentialExfiltration: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            'ec2:StopInstances',
                            'ec2:DescribeTags'
                        ],
                        resources: ['*'],
                    })
                ]
            })
        }
    });

    const lowUtilizationMonitorInstanceLambda = new lambda.Function(this, "stop-low-utilization-ec2-instance-lambda", {
        code: new lambda.AssetCode("./lambda/stop-low-utilization-ec2-instances"),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_14_X,
        timeout: Duration.seconds(60),
        role: lowUtilizationMonitorInstanceRole
    });

    const lowUtilizationMonitorInstanceRule = new events.Rule(this, 'low-utilization-ec2-instance-event-rule', {
        ruleName: 'TrustedAdvisorLowUtilizationEC2Instances',
        enabled: true,
        eventPattern: {
            source: ["aws.trustedadvisor"],
            detailType: ["Trusted Advisor Check Item Refresh Notification"],
            detail: {
                status: ['WARN'],
                'check-name': ["Low Utilization Amazon EC2 Instances"]
            }
        },
    });
    lowUtilizationMonitorInstanceRule.addTarget(new targets.LambdaFunction(lowUtilizationMonitorInstanceLambda));
    // End of Low utilization for Amazon EC2
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    



  }
}
