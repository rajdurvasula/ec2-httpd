import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
export interface Ec2InstStackProps {
    inboundCidr: string;
    keyPair: string;
}
export declare class Ec2Inst extends Construct {
    readonly ec2Instance: ec2.Instance;
    constructor(scope: Construct, id: string, props: Ec2InstStackProps);
}
