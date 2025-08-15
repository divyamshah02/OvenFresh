import os
import boto3
import base64
from botocore.exceptions import ClientError


def base64_to_text(b64_text):
    # Decode the Base64 string back to bytes, then to text
    return base64.b64decode(b64_text.encode()).decode()


def upload_file_to_s3(uploaded_file, folder="uploads"):
    """
    Uploads a file to AWS S3, renaming it if a file with the same name exists.
    
    Args:
        uploaded_file: Django UploadedFile object
        folder: S3 folder path (default: "uploads")
    
    Returns:
        str: Public URL of the uploaded file
    """
    try:
        # AWS S3 configuration
        region_name = 'eu-north-1'
        bucket_name = 'ovenfresh2025'
        
        if not bucket_name:
            raise ValueError("AWS_STORAGE_BUCKET_NAME not configured in settings")
        
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=base64_to_text('QUtJQTNIT1lCSjM1REczNVVYQUY='),
            aws_secret_access_key=base64_to_text('bjdZQ1QzODNVV1hoRksvOXFBL2t1T3F0d0tSRnJlQTgxcG1mYmdZVA=='),
            region_name=region_name
        )
        
        # Prepare file name and S3 key
        base_name, extension = os.path.splitext(uploaded_file.name)
        file_name = uploaded_file.name
        s3_key = f"{folder}/{file_name}"
        counter = 1

        # Check if file exists and rename if necessary
        while True:
            try:
                s3_client.head_object(Bucket=bucket_name, Key=s3_key)
                # If file exists, update the filename
                file_name = f"{base_name}({counter}){extension}"
                s3_key = f"{folder}/{file_name}"
                counter += 1
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    break  # File does not exist, proceed with upload
                else:
                    raise e

        # Upload file
        s3_client.upload_fileobj(
            uploaded_file, 
            bucket_name, 
            s3_key,
            ExtraArgs={'ContentType': uploaded_file.content_type}
        )

        # Generate file URL
        file_url = f"https://{bucket_name}.s3.{region_name}.amazonaws.com/{s3_key}"

        return file_url
        
    except Exception as e:
        raise Exception(f"Failed to upload file to S3: {str(e)}")


def delete_file_from_s3(file_url):
    """
    Deletes a file from S3 using its URL.
    
    Args:
        file_url: Full S3 URL of the file to delete
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Extract bucket name and key from URL
        bucket_name = 'sankievents'
        region_name = 'eu-north-1'
        
        # Parse S3 key from URL
        url_parts = file_url.split(f"{bucket_name}.s3.{region_name}.amazonaws.com/")
        if len(url_parts) != 2:
            return False
        
        s3_key = url_parts[1]
        
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=base64_to_text('QUtJQTVJSk9YQlFVVEVFNU9NSkI='),
            aws_secret_access_key=base64_to_text('TlIwblU5T0oyQ0lkQm1nRkFXMEk4RTRiT01na3NEVXVPQnJJTU5iNQ=='),
            region_name=region_name
        )
        
        s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
        return True
        
    except Exception as e:
        print(f"Failed to delete file from S3: {str(e)}")
        return False
