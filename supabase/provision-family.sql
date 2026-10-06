-- Execute uma vez, depois de schema.sql e de criar os dois usuários no Auth.
-- Substitua os três campos abaixo SOMENTE no editor SQL do seu projeto.
-- Não publique o PIN nem salve a versão preenchida no GitHub.
do $$
declare
  father uuid := 'SUBSTITUA_PELO_UUID_DO_PAI';
  mother uuid := 'SUBSTITUA_PELO_UUID_DA_MAE';
  family_pin text := 'ESCOLHA_UM_PIN_PRIVADO';
  family uuid;
begin
  if father=mother then raise exception 'Use dois usuários diferentes'; end if;
  if family_pin !~ '^[0-9]{6,12}$' then raise exception 'Escolha de 6 a 12 dígitos'; end if;
  if (select count(*) from auth.users where id in (father,mother))<>2 then
    raise exception 'Crie primeiro os dois usuários no Authentication';
  end if;
  if exists(select 1 from mission_private.members where user_id in (father,mother)) then
    raise exception 'Usuário já vinculado: não recrie a família';
  end if;
  insert into mission_private.families(name,pin_hash)
    values('Missão do Bentinho',extensions.crypt(family_pin,extensions.gen_salt('bf')))
    returning id into family;
  insert into mission_private.members(user_id,family_id) values(father,family),(mother,family);
end $$;
