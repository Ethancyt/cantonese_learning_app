-- Private, immutable MP3 objects. Clip metadata lives in each lesson payload/version.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('lesson-audio','lesson-audio',false,2097152,array['audio/mpeg'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['audio/mpeg'];

drop policy if exists lesson_audio_read on storage.objects;
create policy lesson_audio_read on storage.objects for select to authenticated using (
  bucket_id='lesson-audio' and (
    exists(select 1 from public.lessons l where l.id=(storage.foldername(name))[1]
      and public.my_role() in ('volunteer','admin')
      and (l.created_by=auth.uid() or public.my_role()='admin'))
    or exists(select 1 from public.published_versions p,
      jsonb_array_elements(coalesce(p.payload->'audio','[]'::jsonb)) clip
      where p.lesson_id=(storage.foldername(name))[1]
      and name=p.lesson_id || '/' || (clip->>'id') || '.mp3'
      and p.payload->>'status'='published'
      and public.journey_available(p.lesson_id)
      and (p.payload->>'availability'='available' or (p.payload->>'availableAt')::timestamptz<=now()))
  )
);
drop policy if exists lesson_audio_insert on storage.objects;
create policy lesson_audio_insert on storage.objects for insert to authenticated with check (
  bucket_id='lesson-audio' and name ~ '^[a-zA-Z0-9_-]{1,100}/[a-f0-9]{64}\.mp3$'
  and public.my_role() in ('volunteer','admin')
  and exists(select 1 from public.lessons l where l.id=(storage.foldername(name))[1]
    and l.status not in ('published','archived')
    and (l.created_by=auth.uid() or public.my_role()='admin'))
);
-- No update/delete policy: publishing a later version cannot overwrite older audio.
