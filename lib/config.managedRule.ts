import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as config from 'aws-cdk-lib/aws-config';


export class ConfigManagedRuleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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

    // Amazon EBS snapshot should be private only
    const ebsSnapshotPrivateRestorableConfig = new config.ManagedRule(this, 'ebs-snapshot-public-restorable-check', {
        identifier: config.ManagedRuleIdentifiers.EBS_SNAPSHOT_PUBLIC_RESTORABLE_CHECK
    }); 

    // Amazon VPC Flow logs should be enabled
    const vpcFlowlogsEnabledConfig = new config.ManagedRule(this, 'vpc-flow-logs-enabled', {
        identifier: config.ManagedRuleIdentifiers.VPC_FLOW_LOGS_ENABLED
    }); 

    // Amazon IAM users MFA should be enabled
    const iamUserMFAEnabledConfig = new config.ManagedRule(this, 'iam-user-mfa-enabled', {
        identifier: config.ManagedRuleIdentifiers.IAM_USER_MFA_ENABLED
    }); 

    // ROOT Account MFA should be enabled
    const rootAccountMFAEnabledConfig = new config.ManagedRule(this, 'root-account-mfa-enabled', {
        identifier: config.ManagedRuleIdentifiers.ROOT_ACCOUNT_MFA_ENABLED
    }); 

    // Amazon RDS storage should be encrypted
    const rdsStorageEncryptedEnabledConfig = new config.ManagedRule(this, 'rds-storage-encrypted', {
        identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED
    }); 

    // For more, please refer to the list of AWS Config Managed Rules: https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html

  }
}
