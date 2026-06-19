resource "digitalocean_ssh_key" "chat" {
  name       = "chat-${var.environment}"
  public_key = var.ssh_public_key
}

resource "digitalocean_droplet" "chat" {
  image    = "debian-12-x64"
  name     = "chat-${var.environment}"
  region   = var.region
  size     = var.droplet_size
  ssh_keys = [digitalocean_ssh_key.chat.id]

  user_data = templatefile("${path.module}/templates/cloud-init.yaml.tftpl", {
    domain          = var.domain
    environment     = var.environment
    frontend_domain = local.domain_names.frontend
    api_domain      = local.domain_names.api
  })
}

resource "digitalocean_firewall" "chat" {
  name = "chat-${var.environment}"

  droplet_ids = [digitalocean_droplet.chat.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }
}

# DNS records via Cloudflare
resource "cloudflare_dns_record" "frontend" {
  zone_id = var.cloudflare_zone_id
  name    = split(".", local.domain_names.frontend)[0]
  content = digitalocean_droplet.chat.ipv4_address
  type    = "A"
  ttl     = 3600
  proxied = false
}

resource "cloudflare_dns_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = split(".", local.domain_names.api)[0]
  content = digitalocean_droplet.chat.ipv4_address
  type    = "A"
  ttl     = 3600
  proxied = false
}
