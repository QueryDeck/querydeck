SELECT
 n.nspname,
 c.relname,
 f.attrelid,
 c.oid,
 f.attnum AS number,
 f.attname AS name, f.attnum,
 f.attnotnull AS notnull,
 pg_catalog.format_type(f.atttypid,f.atttypmod) AS type,
 CASE WHEN p.contype = 'p' THEN 't' ELSE 'f' END AS primarykey,
 CASE WHEN p.contype = 'u' THEN 't' ELSE 'f' END AS uniquekey,
 CASE WHEN p.contype = 'u' THEN indexp.relname END AS uindex,
 CASE WHEN p.contype = 'f' THEN g.relname END AS foreignkey,
 CASE WHEN p.contype = 'f' THEN p.confkey END AS foreignkey_fieldnum,
 CASE WHEN p.contype = 'f' THEN (SELECT attname FROM pg_attribute WHERE attrelid = p.confrelid AND attnum = p.confkey[1]) END AS foreignkey_fieldname,
 CASE WHEN p.contype = 'f' THEN nn.nspname END AS foreignkey_schema,
 CASE WHEN p.contype = 'f' THEN p.conkey END AS foreignkey_connnum,
 CASE WHEN f.atthasdef = 't' THEN pg_get_expr(d.adbin, d.adrelid) END AS default
 FROM
 pg_attribute f JOIN pg_class c ON c.oid = f.attrelid
 JOIN pg_type t ON t.oid = f.atttypid
 LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = f.attnum
 LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
 LEFT JOIN pg_constraint p ON p.conrelid = c.oid AND f.attnum = ANY (p.conkey)
 LEFT JOIN pg_class AS g ON p.confrelid = g.oid LEFT JOIN pg_namespace as nn ON g.relnamespace = nn.oid
 LEFT JOIN pg_index AS indexc ON c.oid = indexc.indrelid AND string_to_array(indkey::text, ' ')::int2[] @> array[f.attnum]
 LEFT JOIN pg_class AS indexp ON indexp.oid = indexc.indexrelid
 WHERE
 c.relkind = 'r'::char
 AND f.attnum > 0 
 AND (n.nspowner != 10 or n.nspname = 'public')
 ORDER BY c.oid DESC;