#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ConfigManagedRuleStack,
         TrustedAdvisorLowUtilizationEC2Instances } from '../lib/';

const app = new cdk.App();
new ConfigManagedRuleStack(app, 'ConfigManagedRuleStack');

new TrustedAdvisorLowUtilizationEC2Instances(app, 'TrustedAdvisorLowUtilizationEC2Instances');