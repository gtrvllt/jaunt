-- Permet à un membre de mettre à jour SA propre participation (confirmer,
-- démarrer, avancer). Jusqu'ici `participation` n'avait aucune policy update
-- côté client → le flow invitation → confirmer → démarrer ne persistait pas.
-- Le trigger enforce_jaunt_access() garde toujours le dépassement freemium.
create policy "users update own participation"
  on participation for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
