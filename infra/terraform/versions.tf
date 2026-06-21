terraform {
  required_version = ">= 1.10.0"

  # Uncomment and configure for remote state storage:
  # backend "s3" {
  #   bucket         = "chat-terraform-state"
  #   key            = "infra/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  # }
  #
  # For DigitalOcean Spaces (S3-compatible):
  # backend "s3" {
  #   bucket   = "chat-terraform-state"
  #   key      = "infra/terraform.tfstate"
  #   endpoint = "https://nyc3.digitaloceanspaces.com"
  #   region   = "us-east-1"
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  # }
  #
  # Then configure with env vars:
  #   AWS_ACCESS_KEY_ID=<DO Spaces key>
  #   AWS_SECRET_ACCESS_KEY=<DO Spaces secret>

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
