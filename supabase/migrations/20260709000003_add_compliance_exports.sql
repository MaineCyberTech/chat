-- Compliance exports table for storing generated export records with CSV content
CREATE TABLE IF NOT EXISTS public.compliance_exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('messages', 'audit_logs', 'channels', 'users')),
  date_from   TIMESTAMPTZ NOT NULL,
  date_to     TIMESTAMPTZ NOT NULL,
  row_count   INTEGER NOT NULL DEFAULT 0,
  csv_content TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_msg   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.compliance_exports ENABLE ROW LEVEL SECURITY;

-- Admins can view compliance exports
CREATE POLICY compliance_exports_select ON public.compliance_exports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_compliance_exports_created ON public.compliance_exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_exports_status ON public.compliance_exports(status);
