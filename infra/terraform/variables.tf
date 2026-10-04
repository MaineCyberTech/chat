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

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for DNS records"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone:DNS:Edit permission"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "Email address for DigitalOcean monitoring alerts (CPU/memory/disk)"
  type        = string
  default     = "ops@mainecybertech.us"
}

variable "ci_public_key" {
  description = "CI SSH public key to add to droplet authorized_keys"
  type        = string
  default     = ""
}

variable "ci_ssh_key_fingerprint" {
  description = "CI SSH key fingerprint (md5)"
  type        = string
  default     = ""
}

variable "ssh_allowed_ips" {
  description = "Comma-separated list of CIDR blocks allowed to access SSH (port 22). Required; must be restricted to trusted operator ranges."
  type        = string

  validation {
    condition = alltrue([
      for cidr in split(",", var.ssh_allowed_ips) :
      trimspace(cidr) != "" && !contains(["0.0.0.0/0", "::/0"], trimspace(cidr))
    ])
    error_message = "ssh_allowed_ips is required and must list trusted operator CIDRs; 0.0.0.0/0 and ::/0 are not allowed."
  }
}
