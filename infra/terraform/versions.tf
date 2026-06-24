terraform {
  required_version = ">= 1.10.0"

  backend "s3" {
    bucket                      = "chat-terraform-state"
    key                         = "infra/terraform.tfstate"
    endpoints = {
      s3 = "https://nyc3.digitaloceanspaces.com"
    }
    region                      = "us-east-1"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    encrypt                     = true
  }

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