#!/usr/bin/env python3
"""
AWS Account Precheck Script
Detects current AWS account and generates terraform.tfvars with VPC, subnets, and security groups.
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def run_aws_command(command: List[str]) -> Optional[Dict]:
    """Run AWS CLI command and return JSON output"""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout) if result.stdout else None
    except subprocess.CalledProcessError as e:
        print(f"{Colors.FAIL}Error running command: {' '.join(command)}{Colors.ENDC}")
        print(f"{Colors.FAIL}{e.stderr}{Colors.ENDC}")
        return None
    except json.JSONDecodeError as e:
        print(f"{Colors.FAIL}Error parsing JSON: {e}{Colors.ENDC}")
        return None


def get_current_account_id() -> Optional[str]:
    """Get current AWS account ID"""
    print(f"{Colors.OKBLUE}Detecting current AWS account...{Colors.ENDC}")
    result = run_aws_command(['aws', 'sts', 'get-caller-identity'])
    if result:
        account_id = result.get('Account')
        print(f"{Colors.OKGREEN}✓ Current AWS Account ID: {account_id}{Colors.ENDC}")
        return account_id
    return None


def get_region() -> Optional[str]:
    """Get current AWS region"""
    try:
        result = subprocess.run(
            ['aws', 'configure', 'get', 'region'],
            capture_output=True,
            text=True,
            check=True
        )
        region = result.stdout.strip()
        if region:
            print(f"{Colors.OKGREEN}✓ Region: {region}{Colors.ENDC}")
            return region
        
        # Fallback to default region
        print(f"{Colors.WARNING}No region configured, using us-east-1{Colors.ENDC}")
        return "us-east-1"
    except subprocess.CalledProcessError:
        print(f"{Colors.WARNING}No region configured, using us-east-1{Colors.ENDC}")
        return "us-east-1"


def get_default_vpc(region: str) -> Optional[Dict]:
    """Get default VPC or first available VPC"""
    print(f"{Colors.OKBLUE}Looking for VPC...{Colors.ENDC}")
    result = run_aws_command(['aws', 'ec2', 'describe-vpcs', '--region', region])
    
    if not result or not result.get('Vpcs'):
        print(f"{Colors.FAIL}No VPCs found in region {region}{Colors.ENDC}")
        return None
    
    # Try to find default VPC first
    for vpc in result['Vpcs']:
        if vpc.get('IsDefault'):
            print(f"{Colors.OKGREEN}✓ Found default VPC: {vpc['VpcId']}{Colors.ENDC}")
            return vpc
    
    # Use first available VPC
    vpc = result['Vpcs'][0]
    print(f"{Colors.OKGREEN}✓ Using VPC: {vpc['VpcId']}{Colors.ENDC}")
    return vpc


def get_subnets(vpc_id: str, region: str, min_count: int = 3) -> List[str]:
    """Get available subnets in the VPC, filtering out unsupported AZs"""
    # MSK doesn't support us-east-1e in us-east-1
    UNSUPPORTED_AZS = {'us-east-1e'}
    
    print(f"{Colors.OKBLUE}Looking for subnets in VPC {vpc_id}...{Colors.ENDC}")
    result = run_aws_command([
        'aws', 'ec2', 'describe-subnets',
        '--region', region,
        '--filters', f'Name=vpc-id,Values={vpc_id}'
    ])
    
    if not result or not result.get('Subnets'):
        print(f"{Colors.FAIL}No subnets found in VPC {vpc_id}{Colors.ENDC}")
        return []
    
    # Filter out subnets in unsupported availability zones
    all_subnets = result['Subnets']
    supported_subnets = [
        subnet for subnet in all_subnets 
        if subnet.get('AvailabilityZone') not in UNSUPPORTED_AZS
    ]
    
    if len(supported_subnets) < len(all_subnets):
        filtered_count = len(all_subnets) - len(supported_subnets)
        print(f"{Colors.WARNING}⚠ Filtered out {filtered_count} subnet(s) in unsupported AZs (us-east-1e){Colors.ENDC}")
    
    subnet_ids = [subnet['SubnetId'] for subnet in supported_subnets[:min_count]]
    
    if len(subnet_ids) < min_count:
        print(f"{Colors.WARNING}⚠ Found only {len(subnet_ids)} supported subnet(s), MSK requires at least 2{Colors.ENDC}")
    else:
        print(f"{Colors.OKGREEN}✓ Found {len(subnet_ids)} supported subnets{Colors.ENDC}")
    
    for i, subnet in enumerate(supported_subnets[:min_count]):
        az = subnet.get('AvailabilityZone', 'unknown')
        print(f"  - {subnet['SubnetId']} ({az})")
    
    return subnet_ids


def get_or_create_security_group(vpc_id: str, region: str, project: str, environment: str) -> Optional[str]:
    """Get existing MSK security group or create a new one"""
    sg_name = f"{project}-{environment}-msk-sg"
    
    print(f"{Colors.OKBLUE}Looking for security group '{sg_name}'...{Colors.ENDC}")
    
    # Check if security group exists
    result = run_aws_command([
        'aws', 'ec2', 'describe-security-groups',
        '--region', region,
        '--filters', f'Name=vpc-id,Values={vpc_id}', f'Name=group-name,Values={sg_name}'
    ])
    
    if result and result.get('SecurityGroups'):
        sg_id = result['SecurityGroups'][0]['GroupId']
        print(f"{Colors.OKGREEN}✓ Found existing security group: {sg_id}{Colors.ENDC}")
        return sg_id
    
    # Create new security group
    print(f"{Colors.OKBLUE}Creating new security group '{sg_name}'...{Colors.ENDC}")
    result = run_aws_command([
        'aws', 'ec2', 'create-security-group',
        '--region', region,
        '--group-name', sg_name,
        '--description', f'Security group for {project} {environment} MSK cluster',
        '--vpc-id', vpc_id
    ])
    
    if not result:
        return None
    
    sg_id = result['GroupId']
    print(f"{Colors.OKGREEN}✓ Created security group: {sg_id}{Colors.ENDC}")
    
    # Add ingress rules for Kafka (9092, 9094, 9096)
    print(f"{Colors.OKBLUE}Adding ingress rules for Kafka ports...{Colors.ENDC}")
    for port in [9092, 9094, 9096]:
        run_aws_command([
            'aws', 'ec2', 'authorize-security-group-ingress',
            '--region', region,
            '--group-id', sg_id,
            '--protocol', 'tcp',
            '--port', str(port),
            '--cidr', '0.0.0.0/0'
        ])
    
    print(f"{Colors.OKGREEN}✓ Security group configured{Colors.ENDC}")
    return sg_id


def get_previous_account_id(tf_dir: Path) -> Optional[str]:
    """Extract account ID from existing terraform.tfvars if it exists"""
    tfvars_path = tf_dir / 'terraform.tfvars'
    if not tfvars_path.exists():
        return None
    
    try:
        content = tfvars_path.read_text()
        # Look for Account = "123456789012" in tags
        for line in content.split('\n'):
            if 'Account' in line and '=' in line:
                # Extract account ID from line like: Account = "723609008063"
                parts = line.split('=')
                if len(parts) == 2:
                    account_id = parts[1].strip().strip('"').strip()
                    if account_id.isdigit():
                        return account_id
    except Exception:
        pass
    return None


def clean_terraform_state(current_account_id: str):
    """Remove old Terraform state files only if account changed"""
    script_dir = Path(__file__).parent
    tf_dir = script_dir.parent
    
    previous_account = get_previous_account_id(tf_dir)
    
    # If same account and state exists, skip cleanup
    if previous_account == current_account_id:
        terraform_dir = tf_dir / '.terraform'
        if terraform_dir.exists():
            print(f"{Colors.OKGREEN}✓ Same AWS account, preserving Terraform state{Colors.ENDC}")
            return
    
    # Account changed or no previous state - clean everything
    if previous_account and previous_account != current_account_id:
        print(f"{Colors.WARNING}AWS account changed: {previous_account} → {current_account_id}{Colors.ENDC}")
    
    print(f"{Colors.OKBLUE}Cleaning old Terraform state files...{Colors.ENDC}")
    
    files_to_remove = [
        '.terraform',
        '.terraform.lock.hcl',
        'terraform.tfstate',
        'terraform.tfstate.backup',
        'plan.out'
    ]
    
    for file_name in files_to_remove:
        file_path = tf_dir / file_name
        if file_path.exists():
            if file_path.is_dir():
                import shutil
                shutil.rmtree(file_path)
                print(f"  - Removed directory: {file_name}")
            else:
                file_path.unlink()
                print(f"  - Removed file: {file_name}")
    
    print(f"{Colors.OKGREEN}✓ Cleanup complete{Colors.ENDC}")


def generate_tfvars(
    account_id: str,
    region: str,
    subnet_ids: List[str],
    security_group_ids: List[str],
    project: str = "kayak",
    environment: str = "dev"
) -> str:
    """Generate terraform.tfvars content"""
    
    tfvars_content = f"""# Auto-generated configuration for AWS Account: {account_id}
# Generated by precheck.py on $(date)

project     = "{project}"
environment = "{environment}"
region      = "{region}"

tags = {{
  Owner   = "data-team"
  Account = "{account_id}"
}}

broker_subnet_ids = [
"""
    
    for subnet_id in subnet_ids:
        tfvars_content += f'  "{subnet_id}",\n'
    
    tfvars_content += """]

broker_security_group_ids = [
"""
    
    for sg_id in security_group_ids:
        tfvars_content += f'  "{sg_id}",\n'
    
    tfvars_content += f"""]

msk_instance_type   = "kafka.t3.small"
msk_broker_count    = {min(len(subnet_ids), 3)}
msk_ebs_volume_size = 10

# Leave empty to use the AWS managed key for MSK encryption
msk_kms_key_arn = ""

log_retention_in_days = 7
"""
    
    return tfvars_content


def main():
    """Main execution function"""
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("=" * 60)
    print("AWS Account Precheck & Terraform Configuration Generator")
    print("=" * 60)
    print(f"{Colors.ENDC}")
    
    # Get current AWS account
    account_id = get_current_account_id()
    if not account_id:
        print(f"{Colors.FAIL}Failed to detect AWS account. Please check your AWS credentials.{Colors.ENDC}")
        sys.exit(1)
    
    # Get region
    region = get_region()
    if not region:
        print(f"{Colors.FAIL}Failed to detect AWS region.{Colors.ENDC}")
        sys.exit(1)
    
    # Clean old Terraform state (only if account changed)
    clean_terraform_state(account_id)
    
    # Get VPC
    vpc = get_default_vpc(region)
    if not vpc:
        print(f"{Colors.FAIL}Failed to find VPC.{Colors.ENDC}")
        sys.exit(1)
    
    vpc_id = vpc['VpcId']
    
    # Get subnets
    subnet_ids = get_subnets(vpc_id, region)
    if len(subnet_ids) < 2:
        print(f"{Colors.FAIL}MSK requires at least 2 subnets. Found {len(subnet_ids)}.{Colors.ENDC}")
        sys.exit(1)
    
    # Get or create security group
    project = "kayak"
    environment = "dev"
    sg_id = get_or_create_security_group(vpc_id, region, project, environment)
    if not sg_id:
        print(f"{Colors.FAIL}Failed to get/create security group.{Colors.ENDC}")
        sys.exit(1)
    
    # Generate terraform.tfvars
    print(f"\n{Colors.OKBLUE}Generating terraform.tfvars...{Colors.ENDC}")
    tfvars_content = generate_tfvars(
        account_id=account_id,
        region=region,
        subnet_ids=subnet_ids,
        security_group_ids=[sg_id],
        project=project,
        environment=environment
    )
    
    # Write to file
    script_dir = Path(__file__).parent
    tf_dir = script_dir.parent
    tfvars_path = tf_dir / 'terraform.tfvars'
    
    # Backup existing tfvars if it exists
    if tfvars_path.exists():
        backup_path = tf_dir / f'terraform.tfvars.backup.{account_id}'
        tfvars_path.rename(backup_path)
        print(f"{Colors.WARNING}Backed up existing terraform.tfvars to {backup_path.name}{Colors.ENDC}")
    
    tfvars_path.write_text(tfvars_content)
    print(f"{Colors.OKGREEN}✓ Generated: {tfvars_path}{Colors.ENDC}")
    
    print(f"\n{Colors.HEADER}{Colors.BOLD}")
    print("=" * 60)
    print("Configuration Complete!")
    print("=" * 60)
    print(f"{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Account ID: {account_id}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Region: {region}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}VPC: {vpc_id}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Subnets: {len(subnet_ids)}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Security Group: {sg_id}{Colors.ENDC}")
    print(f"\n{Colors.OKCYAN}Ready to run: make init && make plan{Colors.ENDC}\n")


if __name__ == "__main__":
    main()
