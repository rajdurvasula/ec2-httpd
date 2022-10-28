import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import * as path from 'path';

export interface Ec2InstStackProps {
    inboundCidr: string;
    keyPair: string;
}

export class Ec2Inst extends Construct {
    
    public readonly ec2Instance: ec2.Instance;
    
    constructor(scope: Construct, id: string, props: Ec2InstStackProps) {
        super(scope, id);
        
        // create vpc
        const vpc = new ec2.Vpc(this, 'sample-vpc', {
            cidr: '192.168.0.0/16',
            natGateways: 0,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'sample-vpc',
                    subnetType: ec2.SubnetType.PUBLIC
                }
            ]
        });
        
        // Allow SSH
        const securityGroup = new ec2.SecurityGroup(this, 'sample-sg', {
            vpc,
            description: 'Security Group for sample-vpc',
            allowAllOutbound: true
        });
        securityGroup.addIngressRule(ec2.Peer.ipv4(props.inboundCidr), ec2.Port.tcp(22), 'Allow SSH');
        // Role for EC2 instance
        const ec2Role = new iam.Role(this, 'ec2-role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            description: 'Role for EC2 instance'
        });
        ec2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        ec2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'));
        
        const accountId = cdk.Stack.of(this).account;
        const region = cdk.Stack.of(this).region;
        
        // Use latest Amazon Linux 2 AMI
        const ami = new ec2.AmazonLinuxImage({
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            cpuType: ec2.AmazonLinuxCpuType.X86_64
        });
        
        this.ec2Instance = new ec2.Instance(this, 'sample-inst', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            keyName: props.keyPair,
            machineImage: ami,
            securityGroup: securityGroup,
            role: ec2Role
        });
        
        // Create Asset for User Data
        const asset = new Asset(this, 'user-data-asset', {
            path: path.join(__dirname, '../src/config.sh')
        });
        
        const localPath = this.ec2Instance.userData.addS3DownloadCommand({
            bucket: asset.bucket,
            bucketKey: asset.s3ObjectKey
        });
        
        this.ec2Instance.userData.addExecuteFileCommand({
            filePath: localPath,
            arguments: '--verbose -y'
        });
        asset.grantRead(this.ec2Instance.role);
        
    }
}