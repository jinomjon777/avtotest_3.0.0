-- public sxemasidan tashqaridagi production obyektlari (pg_dump -n public ularni olmaydi)
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
INSERT INTO storage.buckets (id, name, public) VALUES ('cheklar', 'cheklar', true), ('receipts', 'receipts', true)
  ON CONFLICT (id) DO NOTHING;
CREATE POLICY cheklar_public_read  ON storage.objects FOR SELECT USING (bucket_id = 'cheklar');
CREATE POLICY cheklar_admin_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cheklar' AND public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY cheklar_admin_update ON storage.objects FOR UPDATE USING (bucket_id = 'cheklar' AND public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY cheklar_admin_delete ON storage.objects FOR DELETE USING (bucket_id = 'cheklar' AND public.has_role(auth.uid(), 'admin'::text));
CREATE POLICY receipts_public_read ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
