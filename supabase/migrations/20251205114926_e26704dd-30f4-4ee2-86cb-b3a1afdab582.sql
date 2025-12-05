-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a secure function for system notifications (can be called by triggers/functions)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'info',
  _link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (_user_id, _title, _message, _type, _link)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

-- Grant execute permission only to authenticated users (will be called via other secured functions)
REVOKE ALL ON FUNCTION public.create_notification FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- Create restrictive insert policy - only admins can directly insert
CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));