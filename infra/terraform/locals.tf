locals {
  domain_names = var.environment == "production" ? {
    frontend = "chat.mainecybertech.com"
    api      = "chat-api.mainecybertech.com"
  } : {
    frontend = "chat.mainecybertech.us"
    api      = "chat-api.mainecybertech.us"
  }
}
