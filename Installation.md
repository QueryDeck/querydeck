# Running QueryDeck Locally

> **Important**: This guide is for running a local instance of QueryDeck and is not intended for development purposes.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Git](https://git-scm.com/downloads)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [AWS Account](https://aws.amazon.com/account/) (required for KMS encryption)

## Installation Steps

### 1. Clone the Repository


```bash
git clone --depth 1 https://github.com/QueryDeck/querydeck.git
cd querydeck
```

### 2. Pull Docker Images

```bash
docker pull querydeckio/querydeck:backend-latest
docker pull querydeckio/querydeck:frontend-latest
```

### 3. Configure Environment Variables

Copy the example environment files:
```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Edit the backend environment file (`backend/.env`) and update these required variables:

```
pg_querydeck_url=<your-postgres-connection-string>
AWS_KMS_KEY_ARN=<your-aws-kms-key-arn>
AWS_REGION=<your-aws-region>
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
```

#### Database Configuration Details

The `pg_querydeck_url` variable requires a PostgreSQL connection string in the following format:
```
postgresql://username:password@hostname:5432/dbname
```

> **Note**: Ensure your PostgreSQL instance is accessible from the Docker container network.

#### AWS KMS Configuration

QueryDeck uses AWS KMS (Key Management Service) for encrypting sensitive information such as:
- Database credentials
- API keys
- Other secure fields

**Required AWS Setup Steps:**

- Create a KMS key in your AWS account
- Note the ARN (Amazon Resource Name) of the key
- Create an IAM user with KMS permissions
- Generate access keys for the IAM user

**Minimum Required IAM Permissions:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt"
            ],
            "Resource": "arn:aws:kms:region:account-id:key/key-id"
        }
    ]
}
```

**Helpful AWS Documentation:**
- [Creating KMS Keys](https://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html)
- [Managing KMS Key Permissions](https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html)
- [Getting the Key ARN](https://docs.aws.amazon.com/kms/latest/developerguide/viewing-keys.html)

### 4. Start the Application

Launch QueryDeck using Docker Compose:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

> **Note**: The `-d` flag runs containers in the background. Remove it if you want to see the logs in your terminal.

Once started, access QueryDeck at: `http://localhost:5051`

## Troubleshooting

Common issues and solutions:

**Port Conflicts**
   - Ensure ports 5051 (frontend) and 5052 (backend) are available
   - Modify the ports in your environment files if needed

**AWS KMS Issues**
   - Verify AWS credentials are correct
   - Confirm IAM user has proper KMS permissions
   - Check if the KMS key ARN is correct

**Database Connection Issues**
   - Verify PostgreSQL connection string format
   - Ensure database is accessible from Docker network
   - Check if database credentials are correct

## Support & Resources

- [QueryDeck GitHub Repository](https://github.com/QueryDeck/querydeck)
- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

For additional support, please [contact us](mailto:kabir@querydeck.io) directly via email.
