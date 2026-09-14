-- Checa se as tabelas public.products e public.orders existem.
-- Se não houver nenhuma delas, o esquema precisa rodar o schema.sql.

select tablename
from pg_tables
where schemaname = 'public'
order by tablename;
