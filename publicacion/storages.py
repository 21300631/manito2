from storages.backends.s3boto3 import S3Boto3Storage

class ImageStorage(S3Boto3Storage):
    bucket_name = "post-manito"
    custom_domain = f"https://post-manito.s3.amazonaws.com"