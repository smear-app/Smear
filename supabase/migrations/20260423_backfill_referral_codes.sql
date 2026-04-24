-- Derive referral_code from username for all existing profiles.
-- Going forward, new registrations set referral_code = upper(username) explicitly.
update public.profiles
set referral_code = upper(username)
where username is not null;
