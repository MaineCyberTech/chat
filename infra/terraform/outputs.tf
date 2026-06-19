output "droplet_id" {
  description = "Droplet ID"
  value       = digitalocean_droplet.chat.id
}

output "droplet_ip" {
  description = "Droplet public IPv4 address"
  value       = digitalocean_droplet.chat.ipv4_address
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${local.domain_names.frontend}"
}

output "api_url" {
  description = "API URL"
  value       = "https://${local.domain_names.api}"
}

output "domain" {
  description = "Registered domain"
  value       = var.domain
}
