terraform {
  required_version = ">= 1.10.0"

  # Configure via -backend-config in CI, or uncomment with static values:
  # backend "s3" {
  #   bucket   = "chat-terraform-state"
  #   key      = "infra/terraform.tfstate"
  #   endpoint = "https://nyc3.digitaloceanspaces.com"
  #   region   = "us-east-1"
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  # }
  #
  # Usage with partial config:
  #   terraform init -backend-config="bucket=chat-terraform-state-${ENVIRONMENT}"
  #
  # Env vars required:
  #   AWS_ACCESS_KEY_ID=<DO Spaces access key>
  #   AWS_SECRET_ACCESS_KEY=<DO Spaces secret key>

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.47"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}
