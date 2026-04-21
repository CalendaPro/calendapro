-- Dashboard layout preferences per user
alter table profiles
  add column if not exists pro_layout    varchar(20) default 'modern',
  add column if not exists client_layout varchar(20) default 'modern';

comment on column profiles.pro_layout    is 'Pro dashboard layout: modern|pro|minimalist|compact|dark-pro';
comment on column profiles.client_layout is 'Client dashboard layout: modern|pro|minimalist|compact|dark';
