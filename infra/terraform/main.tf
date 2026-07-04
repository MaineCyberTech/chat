provider "digitalocean" {
  token = var.do_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "cloudflare_ip_ranges" "ipv4" {}
data "cloudflare_ip_ranges" "ipv6" {}

resource "digitalocean_droplet" "chat" {
  image      = "ubuntu-24-04-x64"
  name       = "chat-${var.environment}"
  region     = var.region
  size       = var.droplet_size
  tags       = ["chat-${var.environment}"]
  monitoring = true
  ssh_keys   = var.ci_ssh_key_fingerprint != "" ? [var.ci_ssh_key_fingerprint] : []

  lifecycle {
    ignore_changes  = [user_data]
  }

  user_data = templatefile("${path.module}/templates/cloud-init.yaml.tftpl", {
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
    source_addresses = var.ssh_allowed_ips != "" ? split(",", var.ssh_allowed_ips) : ["0.0.0.0/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = data.cloudflare_ip_ranges.ipv4.ipv4_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = data.cloudflare_ip_ranges.ipv4.ipv4_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = data.cloudflare_ip_ranges.ipv6.ipv6_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = data.cloudflare_ip_ranges.ipv6.ipv6_cidrs
  }

  # LiveKit WebRTC media ports (UDP)
  inbound_rule {
    protocol         = "udp"
    port_range       = "7882-7892"
    source_addresses = ["0.0.0.0/0"]
  }

  # LiveKit TURN server port (UDP)
  inbound_rule {
    protocol         = "udp"
    port_range       = "3478"
    source_addresses = ["0.0.0.0/0"]
  }

  # LiveKit TURN TLS port (TCP)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "5349"
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

# Monitoring alerts (only create when alert_email is configured)
resource "digitalocean_monitor_alert" "cpu_high" {
  count = var.alert_email != "" ? 1 : 0
  type    = "v1/insights/droplet/cpu"
  value   = "80"
  compare = "GreaterThan"
  window  = "5m"
  alerts {
    email = [var.alert_email]
  }
  entities = [digitalocean_droplet.chat.id]
  description = "CPU usage > 80% on chat-${var.environment}"
  enabled = true
}

resource "digitalocean_monitor_alert" "memory_high" {
  count = var.alert_email != "" ? 1 : 0
  type    = "v1/insights/droplet/memory_utilization_percent"
  value   = "80"
  compare = "GreaterThan"
  window  = "5m"
  alerts {
    email = [var.alert_email]
  }
  entities = [digitalocean_droplet.chat.id]
  description = "Memory usage > 80% on chat-${var.environment}"
  enabled = true
}

resource "digitalocean_monitor_alert" "disk_full" {
  count = var.alert_email != "" ? 1 : 0
  type    = "v1/insights/droplet/disk_utilization_percent"
  value   = "90"
  compare = "GreaterThan"
  window  = "5m"
  alerts {
    email = [var.alert_email]
  }
  entities = [digitalocean_droplet.chat.id]
  description = "Disk usage > 90% on chat-${var.environment}"
  enabled = true
}

# DNS records via Cloudflare
resource "cloudflare_dns_record" "frontend" {
  zone_id = var.cloudflare_zone_id
  name    = split(".", local.domain_names.frontend)[0]
  content = digitalocean_droplet.chat.ipv4_address
  type    = "A"
  ttl     = 1
  proxied = true
}

# Monitoring alerts
resource "digitalocean_monitor_alert" "cpu_high" {
  count      = var.alert_email != "" ? 1 : 0
  alerts {
    email = [var.alert_email]
  }
  window     = "5m"
  type       = "v1/insights/droplet/cpu"
  value      = "80"
  compare    = "GreaterThan"
  entities   = [digitalocean_droplet.chat.id]
  enabled    = true
  description = "CPU > 80% for 5 minutes on ${digitalocean_droplet.chat.name}"
}

resource "digitalocean_monitor_alert" "memory_high" {
  count      = var.alert_email != "" ? 1 : 0
  alerts {
    email = [var.alert_email]
  }
  window     = "5m"
  type       = "v1/insights/droplet/memory_utilization_percent"
  value      = "80"
  compare    = "GreaterThan"
  entities   = [digitalocean_droplet.chat.id]
  enabled    = true
  description = "Memory > 80% for 5 minutes on ${digitalocean_droplet.chat.name}"
}

resource "digitalocean_monitor_alert" "disk_full" {
  count      = var.alert_email != "" ? 1 : 0
  alerts {
    email = [var.alert_email]
  }
  window     = "5m"
  type       = "v1/insights/droplet/disk_utilization_percent"
  value      = "90"
  compare    = "GreaterThan"
  entities   = [digitalocean_droplet.chat.id]
  enabled    = true
  description = "Disk > 90% for 5 minutes on ${digitalocean_droplet.chat.name}"
}

resource "cloudflare_dns_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = split(".", local.domain_names.api)[0]
  content = digitalocean_droplet.chat.ipv4_address
  type    = "A"
  ttl     = 1
  proxied = true
}