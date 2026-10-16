locals {
  domain_names = var.environment == "production" ? {
    frontend = "chat.mainecybertech.com"
    api      = "chat-api.mainecybertech.com"
    # Dedicated object-storage host. Presigned S3 URLs are signed over the Host
    # header and path, so this must map 1:1 to MinIO with no path prefix.
    storage = "chat-storage.mainecybertech.com"
    } : {
    frontend = "chat.mainecybertech.us"
    api      = "chat-api.mainecybertech.us"
    storage  = "chat-storage.mainecybertech.us"
  }
}
