import os
import subprocess
from datetime import datetime
import boto3
from botocore.exceptions import NoCredentialsError
import base64


def base64_to_text(b64_text):
    return base64.b64decode(b64_text.encode()).decode()

# Configuration
AWS_ACCESS_KEY = base64_to_text('QUtJQTNIT1lCSjM1REczNVVYQUY=')
AWS_SECRET_KEY = base64_to_text('bjdZQ1QzODNVV1hoRksvOXFBL2t1T3F0d0tSRnJlQTgxcG1mYmdZVA==')
S3_BUCKET_NAME = 'ovenfresh2025'
AWS_REGION = 'eu-north-1'

S3_BACKUP_FOLDER = "backups/"
LOCAL_BACKUP_FOLDER = "backups/"
MAX_BACKUPS = 3

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)


def upload_to_s3(file_path, bucket_name, s3_folder):
    file_name = os.path.basename(file_path)
    s3_key = f"{s3_folder}{file_name}"

    try:
        s3_client.upload_file(file_path, bucket_name, s3_key)
        print(f"Uploaded {file_name} to S3 bucket {bucket_name}/{s3_folder}")
    except NoCredentialsError:
        print("AWS credentials are incorrect or missing.")
    except Exception as e:
        print(f"Error uploading to S3: {e}")

os.makedirs(LOCAL_BACKUP_FOLDER, exist_ok=True)

def create_backup():
    timestamp = datetime.now().strftime("%d_%m_%Y_%H_%M")
    backup_file_name = f"backup_{timestamp}.json"
    backup_file_path = os.path.join(LOCAL_BACKUP_FOLDER, backup_file_name)
    
    try:
        # Run the Django dumpdata command
        subprocess.run(
            f"python ovenfresh_ecommerce/manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 > {backup_file_path}",
            shell=True,
            check=True,
        )
        print(f"Backup created: {backup_file_path}")
        return backup_file_path
    except subprocess.CalledProcessError as e:
        print(f"Error creating backup: {e}")
        return None

def cleanup_s3(bucket_name, s3_folder, max_files):
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=s3_folder)
        if "Contents" in response:
            files = sorted(response["Contents"], key=lambda x: x["LastModified"])
            while len(files) > max_files:
                file_to_delete = files.pop(0)
                s3_client.delete_object(Bucket=bucket_name, Key=file_to_delete["Key"])
                print(f"Deleted old backup from S3: {file_to_delete['Key']}")
    except Exception as e:
        print(f"Error cleaning up S3 backups: {e}")

def main():
    # Step 1: Create a backup
    backup_file = create_backup()
    if not backup_file:
        return

    # Step 2: Upload to S3
    upload_to_s3(backup_file, S3_BUCKET_NAME, S3_BACKUP_FOLDER)

    # Step 3: Clean up old backups in S3
    cleanup_s3(S3_BUCKET_NAME, S3_BACKUP_FOLDER, MAX_BACKUPS)

    # Optional: Delete local backup file after uploading
    if os.path.exists(backup_file):
        os.remove(backup_file)
        print(f"Deleted local backup file: {backup_file}")

if __name__ == "__main__":
    main()
