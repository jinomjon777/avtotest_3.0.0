#!/usr/bin/env python3
"""src/integrations/supabase/types.ts ni MIGRATSIYALARDAN yaratadi (Supabase gen types formatida).

  sh supabase/tests/run.sh /dev/null      # bo'sh bazaga barcha migratsiyalarni qo'llaydi (DB: fresh)
  python3 scripts/gen-db-types.py         # types.ts ni yozadi

Faqat brauzerga ochiq narsalar kiritiladi: public sxemadagi jadvallar va authenticated/anon
chaqira oladigan funksiyalar. Docker yoki Supabase CLI talab qilinmaydi.
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src/integrations/supabase/types.ts")
DB = os.environ.get("TYPES_DB", "fresh")

def q(sql):
    r = subprocess.run(["su", "postgres", "-c", f"psql -d {DB} -At -c \"{sql}\""], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr)
    return json.loads(r.stdout.strip() or "null")

enums = q("SELECT coalesce(json_object_agg(t.typname, (SELECT json_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid)), '{}') FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typtype='e'")
cols = q("""SELECT json_agg(json_build_object('t',c.table_name,'c',c.column_name,'type',c.data_type,'udt',c.udt_name,'null',c.is_nullable='YES','def',c.column_default IS NOT NULL OR c.is_identity='YES' OR c.is_generated='ALWAYS') ORDER BY c.table_name,c.column_name) FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name WHERE c.table_schema='public' AND t.table_type='BASE TABLE'""")
funcs = q("""SELECT coalesce(json_agg(json_build_object('n',p.proname,'args',coalesce(p.proargnames,'{}'),'types',(SELECT json_agg(format_type(x,NULL)) FROM unnest(p.proargtypes) x),'ndef',p.pronargdefaults,'ret',format_type(p.prorettype,NULL),'set',p.proretset) ORDER BY p.proname),'[]') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' AND (has_function_privilege('authenticated',p.oid,'EXECUTE') OR has_function_privilege('anon',p.oid,'EXECUTE')) AND p.prorettype <> 'trigger'::regtype AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid=p.oid AND d.deptype='e') AND p.proname NOT LIKE '\\_\\_%'""")

def ts_type(pg):
    pg = pg.strip()
    if pg.endswith("[]"):
        return ts_type(pg[:-2]) + "[]"
    if pg.startswith("_"):
        return ts_type(pg[1:]) + "[]"
    base = pg.split("(")[0].strip()
    if base in enums or base.replace("public.", "") in enums:
        return f'Database["public"]["Enums"]["{base.replace("public.", "")}"]'
    if base in ("integer","bigint","smallint","numeric","real","double precision","int4","int8","int2","float4","float8"):
        return "number"
    if base in ("boolean","bool"):
        return "boolean"
    if base in ("json","jsonb"):
        return "Json"
    return "string"

def col_type(c):
    if c["type"] == "ARRAY":
        return ts_type(c["udt"])
    if c["type"] == "USER-DEFINED":
        return ts_type(c["udt"])
    return ts_type(c["type"])

tables = {}
for c in cols or []:
    tables.setdefault(c["t"], []).append(c)

out = ["// AVTOMATIK YARATILGAN: python3 scripts/gen-db-types.py (migratsiyalardan). Qo'lda o'zgartirmang.",
       "export type Json =\n  | string\n  | number\n  | boolean\n  | null\n  | { [key: string]: Json | undefined }\n  | Json[]\n",
       "export type Database = {\n  __InternalSupabase: {\n    PostgrestVersion: \"12\"\n  }\n  public: {\n    Tables: {"]
for t in sorted(tables):
    out.append(f"      {t}: {{")
    for kind in ("Row", "Insert", "Update"):
        out.append(f"        {kind}: {{")
        for c in tables[t]:
            ty = col_type(c) + (" | null" if c["null"] else "")
            opt = "" if kind == "Row" else ("?" if (kind == "Update" or c["null"] or c["def"]) else "")
            out.append(f"          {c['c']}{opt}: {ty}")
        out.append("        }")
    out.append("        Relationships: []\n      }")
out.append("    }\n    Views: {\n      [_ in never]: never\n    }\n    Functions: {")
seen = set()
for f in funcs:
    if f["n"] in seen:
        continue
    seen.add(f["n"])
    names, types, ndef = f["args"], f["types"] or [], f["ndef"] or 0
    out.append(f"      {f['n']}: {{")
    if types:
        out.append("        Args: {")
        for i, (nm, ty) in enumerate(zip(names, types)):
            opt = "?" if i >= len(types) - ndef else ""
            out.append(f"          {nm}{opt}: {ts_type(ty)}")
        out.append("        }")
    else:
        out.append("        Args: never")
    ret = "undefined" if f["ret"] == "void" else ts_type(f["ret"])
    out.append(f"        Returns: {ret}{'[]' if f['set'] else ''}\n      }}")
out.append("    }\n    Enums: {")
for e, labels in sorted(enums.items()):
    out.append(f"      {e}: " + " | ".join(json.dumps(l) for l in labels))
out.append("    }\n    CompositeTypes: {\n      [_ in never]: never\n    }\n  }\n}\n")

helpers = open(OUT).read()
start = helpers.index("type DatabaseWithoutInternals")
open(OUT, "w").write("\n".join(out) + "\n" + helpers[start:])
print(f"types.ts: {len(tables)} jadval, {len(seen)} funksiya")
