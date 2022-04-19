import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as config from 'aws-cdk-lib/aws-config';


export class ConfigManagedRuleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'result-bucket', {
        bucketName: 'cost-utilization-monitoring-store-' + this.region + '-' + this.account,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true
    });

    const automationRole = new iam.Role(this, 'automation-service-role', {
        roleName: 'AWSSystemManagerAutomationServiceRole',
        assumedBy: new iam.ServicePrincipal('ssm'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonSSMAutomationRole')
        ],
        inlinePolicies: {
            Remediation: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            'ec2:ReleaseAddress' // For eip release
                        ],
                        resources: ['*'],
                    })
                ]
            })
        }
    });

    // Elastic IP should be attached, release IP if not.
    const eipAttachedConfig = new config.ManagedRule(this, 'eip-attached', {
        identifier: config.ManagedRuleIdentifiers.EIP_ATTACHED
    }); 
    const eipAttachedConfigRemediation = new config.CfnRemediationConfiguration(this, "eip-attached-remediation", {
        configRuleName: eipAttachedConfig.configRuleName,
        targetId: "AWS-ReleaseElasticIP",
        targetType: "SSM_DOCUMENT",
        automatic: true,
        parameters: {
            "AutomationAssumeRole": {StaticValue: {Values: [automationRole.roleArn]}},
            "AllocationId": {ResourceValue: {Value: 'RESOURCE_ID'}}
        },
        maximumAutomaticAttempts: 2,
        retryAttemptSeconds: 60,
    });

    // 

  }
}
