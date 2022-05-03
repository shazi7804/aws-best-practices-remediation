#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ConfigManagedRuleStack,
         TrustedAdvisorPractices } from '../lib/';

const app = new cdk.App();
new ConfigManagedRuleStack(app, 'ConfigManagedRuleStack');

new TrustedAdvisorPractices(app, 'TrustedAdvisorPractices');