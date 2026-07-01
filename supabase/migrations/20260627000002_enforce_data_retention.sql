-- Enforce data retention policies via scheduled purge functions

-- Purge audit logs older than 90 days
CREATE OR REPLACE FUNCTION public.purge_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Purge read notifications older than 30 days
CREATE OR REPLACE FUNCTION public.purge_old_notifications()
RETURNs void AS $$
BEGIN
  DELETE FROM public.notifications WHERE read = true AND created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Purge consent logs older than 1 year
CREATE OR REPLACE FUNCTION public.purge_old_consent_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.consent_logs WHERE created_at < now() - interval '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
