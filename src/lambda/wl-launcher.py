import os
import sys
import json
import boto3
import botocore
import logging
from datetime import date, datetime

session = boto3.Session()

LOGGER = logging.getLogger()
if 'log_level' in os.environ:
    LOGGER.setLevel(os.environ['log_level'])
    LOGGER.info('Log level set to %s' % LOGGER.getEffectiveLevel())
else:
    LOGGER.setLevel(logging.ERROR)

def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError('Type %s not serializable' % type(obj))

def deploy_stack(stack_name, template_url, InboundCidrParam, KeyPairName):
    response_data = {}
    params = []
    param1 = {
        'ParameterKey': 'InboundCidrParam',
        'ParameterValue': InboundCidrParam
    }
    param2 = {
        'ParameterKey': 'KeyPairName',
        'ParameterValue': KeyPairName
    }
    params.append(param1)
    params.append(param2)
    try:
        cfn_client = session.client('cloudformation')
        stack_id = cfn_client.create_stack(
            StackName=stack_name,
            TemplateURL=template_url,
            Parameters=params,
            Capabilities=[ 'CAPABILITY_NAMED_IAM' ],
            OnFailure='DO_NOTHING'
        )
        LOGGER.info('Stack: {} created with Stack Id: {}'.format(stack_name, stack_id))
        response_data = { 
            'StackId': stack_id,
            'StackName': stack_name,
            'Status': 'Created'
        }
    except botocore.exceptions.ClientError as ce:
        raise ce
    return response_data

def undeploy_stack(stack_name):
    response_data = {}
    try:
        cfn_client = session.client('cloudformation')
        cfn_client.delete_stack(StackName=stack_name)
        LOGGER.info('Stack with Stack Name: {} deleted.'.format(stack_name))
        response_data = {
            'StackName': stack_name,
            'Status': 'Deleted'
        }
    except botocore.exceptions.ClientError as ce:
        raise ce
    return response_data

def create_operation(event, context):
    stack_name = os.environ['StackName']
    template_url = os.environ['TemplateURL']
    param1_value = os.environ['InboundCidrParam']
    param2_value = os.environ['KeyPairName']
    try:
        response_data = deploy_stack(stack_name, template_url, param1_value, param2_value)
        return response_data
    except botocore.exceptions.ClientError as ce:
        response_data = {
            'Error': ce.response['Error']['Code'],
            'Message': ce.response['Error']['Message'],
            'Status': 'Failed'
        }
        return response_data

def delete_operation(event, context):
    stack_name = os.environ['StackName']
    try:
        response_data = undeploy_stack(stack_name)
        return response_data
    except botocore.exceptions.ClientError as ce:
        response_data = {
            'Error': ce.response['Error']['Code'],
            'Message': ce.response['Error']['Message'],
            'Status': 'Failed'
        }
        return response_data

def lambda_handler(event, context):
    print(f"REQUEST RECEIVED: {json.dumps(event, default=str)}")
    response_data = {}
    if 'Operation' in event:
        if event['Operation'] == 'Create':
            response_data = create_operation(event, context)
        elif event['Operation'] == 'Delete':
            response_data = delete_operation(event, context)
    if 'Status' in response_data:
        if response_data['Status'] == 'Created':
            return {
                'statusCode': 200,
                'body': json.dumps(response_data)
            }
        elif response_data['Status'] == 'Deleted':
            return {
                'statusCode': 200,
                'body': json.dumps(response_data)
            }
        elif response_data['Status'] == 'Failed':
            return {
                'statusCode': 500,
                'body': json.dumps(response_data)
            }
    else:
        return {
            'statusCode': 500,
            'body': 'Check Lambda Logs'
        }
