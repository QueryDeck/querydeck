CREATE EXTENSION if not exists pgcrypto;
CREATE EXTENSION if not exists citext;


create table users (
    user_id text primary key default gen_random_uuid(),
    name text,
    email citext not null unique,
    email_verified boolean default false,
    api_project boolean default false,
    preference jsonb  ,
    tour text default '',
    passhash text,
    jwt_lookup_token text,
    -- {profile: {}, token: {}}
    github_ob jsonb,
    created_at int default extract(epoch from now())::int
);

create table apps (
    app_id text primary key default gen_random_uuid(),
    name text not null,
    cors text[],   -- cors domains 
    api_app boolean default false,  -- if app is created for api's
    created_by text not null references users(user_id),
    created_at int default extract(epoch from now())::int
);

create table custom_domains(
    custom_domain_id text primary key default gen_random_uuid(),
    app_id text not null references apps(app_id),
    domain citext not null unique,
    created_at int default extract(epoch from now())::int
);

create table git_deployment (
    git_deployment_id text primary key default gen_random_uuid(),
    app_id text not null unique references apps(app_id),
    github_repo_name text unique,
    github_details jsonb,
    created_at int default extract(epoch from now())::int
);

create table subdomain_gen (
    name citext primary key,
    auto boolean default false,
    app_id text unique references apps(app_id),
    created_at int default extract(epoch from now())::int
);

create table db_types (
    db_type_id citext primary key default gen_random_uuid(),
    name text not null
);

insert into db_types (name) values ('Postgres');
insert into db_types (name) values ('MySQL');

create table databases (
    db_id text primary key default gen_random_uuid(),
    app_id text not null references apps(app_id),
    alias_name text  default '',  --make it not null
    auto_gen boolean default false , -- is auto generated or users created database
    name text not null,
    db_type citext not null references db_types(db_type_id),  
    host citext not null,
    username citext not null,
  --  unique(app_id, db_type, host, name, username),
    password text,
    port_num smallint not null,
    manual_introspection boolean default false,
    created_at int default extract(epoch from now())::int
);

create table schema_defs (
    db_id text not null UNIQUE references databases(db_id),
    custom_columns jsonb[],
    last_sync_success_time int,
    last_sync_attempt_time int,
    sync_error jsonb,
    enum_tables jsonb,
    last_sync int default 0,
    def json
);

create table display_types (
    display_type_id  text primary key default gen_random_uuid(),
    name citext not null,
    created_at int default extract(epoch from now())::int
);

insert into display_types(name) values ('time series'), ('pie'), ('bar chart'), ('line chart');

create table queries (
    query_id text primary key default gen_random_uuid(),
    db_id text not null references databases(db_id),
    name citext not null,
    query_json json,
    query_text json,
    query_view_data json,
    query_val_param_map json,
    created_at int default extract(epoch from now())::int, 
    display_type_id citext references display_types(display_type_id),
    result_data jsonb,
    auth_required boolean default false,
    raw_query boolean default false,
    public_link boolean default false
);

create table api_queries (
    query_id text primary key default gen_random_uuid(),
    db_id text not null references databases(db_id),
    -- app_id only for constraint
    app_id text not null references apps(app_id),
    route citext not null,
    method citext not null CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
    unique(app_id, method, route),
    name citext not null,
    query_json json,
    query_text json,
    query_view_data json,
    query_val_param_map json,
    created_at int default extract(epoch from now())::int, 
    display_type_id citext references display_types(display_type_id),
    result_data jsonb,
    auth_required boolean default false,
    docs jsonb,
    deployed boolean default false,
    raw_query boolean default false,
    public_link boolean default false
);

create table dashboards (
    dashboard_id text primary key default gen_random_uuid(),
    app_id text not null references apps(app_id),
    name citext not null,
    public_link boolean default false,
    password text ,
    link_hash text default gen_random_uuid(),
    query_json_arr jsonb [] ,  
    created_at int default extract(epoch from now())::int
);


CREATE TYPE verification_type AS ENUM ('account_verify', 'forgot_password');

create table user_verification (
    _id  text primary key default gen_random_uuid(),
    type verification_type not null , 
    token text not null,
    user_id text not null references users(user_id) ,
    created_at int default extract(epoch from now())::int
);

create table contact_us  (
    s_no  SERIAL PRIMARY KEY,
    name text not null,
    email text not null,
    question text not null,
    how_you_know_us text  ,
    company  text  ,
    created_at int default extract(epoch from now())::int
);


create table query_metrics (
    query_metric_id text primary key default gen_random_uuid(),
    query_id text not null references queries(query_id),
    ip_address text,
    request_body jsonb,
    request_query jsonb,
    db_error jsonb,
    response_code smallint,
    created_at int default extract(epoch from now())::int
);

create table api_query_metrics (
    query_metric_id text primary key default gen_random_uuid(),
    query_id text not null references api_queries(query_id),
    exec_time int not null,
    ip_address text,
    db_error jsonb,
    response_code smallint,
    created_at int default extract(epoch from now())::int
);

create table enum_options (
    name text,
    enum_id text primary key default gen_random_uuid(),
    query_id text not null references queries(query_id)
    enum_def jsonb not null,
    created_at int default extract(epoch from now())::int
);

create table rawtabs (
    rawtab_id text primary key default gen_random_uuid(),
    app_id text not null unique references apps(app_id),
    rawtabs jsonb ,
    tab_order text[],
    created_at int default extract(epoch from now())::int
)

create table query_run_history ( -- raw query run history
    name text default '',
    query_run_history_id text primary key default gen_random_uuid(),
    query text not null,
    exec_time int not null,
    db_id text not null references databases(db_id),
    query_result jsonb,
    json_view boolean default false,
    created_at int default extract(epoch from now())::int
)

create table auth_details (
    auth_detail_id text primary key default gen_random_uuid(),
    app_id text not null unique references apps(app_id),
    client_id text,
    jwt_type text,
    client_secret_encrypted text not null,
    redirect_url text,
    session_key_values jsonb,
    token_header text default 'authorization',
    user_id_session_key text default 'user_id',
    user_id_column_id text,
    role_session_key text default 'user_role',
    created_at int default extract(epoch from now())::int
);

create table role_types (
    role_type_id text primary key default gen_random_uuid(),
    name text not null,
    description text,
    created_at int default extract(epoch from now())::int
);
insert into role_types (name, description) values ('Admin', 'Full access to all tables'), ('Custom', 'Custom defined access');

create table roles (
    role_id text primary key default gen_random_uuid(),
    auth_detail_id text not null references auth_details(auth_detail_id),
    name citext not null,
    role_value citext not null,
    unique(auth_detail_id, role_value),
    role_type_id text not null references role_types(role_type_id),
    custom_permissions jsonb,
    created_at int default extract(epoch from now())::int
);

create table kms_keys (
    kms_key_id text primary key default gen_random_uuid(),
    cipher_text_encrypted text not null,
    arn text not null,
    created_at int default extract(epoch from now())::int
);