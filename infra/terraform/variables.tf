variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Deployment environment (development | production)"
  type        = string

  validation {
    condition     = contains(["development", "production"], var.environment)
    error_message = "Environment must be 'development' or 'production'."
  }
}

variable "region" {
  description = "DigitalOcean region for droplet"
  type        = string
  default     = "nyc3"
}

variable "droplet_size" {
  description = "Droplet size slug"
  type        = string
  default     = "s-1vcpu-512mb-10gb"
}

variable "domain" {
  description = "Base domain for the environment"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key content to register with DigitalOcean"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for DNS records"
  type        = string
}
