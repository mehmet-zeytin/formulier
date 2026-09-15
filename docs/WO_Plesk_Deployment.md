# Deployment WO-applicatie op Plesk

## Doel

De WO-applicatie wordt vanuit GitLab op de Plesk-server geplaatst.  
De frontend en backend worden op de server gebouwd. De backend wordt gestart via de Node.js-functionaliteit van Plesk; PM2 is niet nodig.

## Stappen

1. **Project op de server plaatsen**  
   Koppel de GitLab-repository aan Plesk of clone de repository handmatig naar de server.

2. **Frontend en backend bouwen**  
   Installeer de dependencies en voer voor beide delen een production build uit.

3. **Node.js in Plesk instellen**  
   Gebruik de backendmap als Application Root en `dist/index.js` als Application Startup File.  
   Kies Production als application mode en bij voorkeur een ondersteunde Node.js LTS-versie.

4. **Database instellen**  
   Maak in Plesk een MySQL-database en databasegebruiker aan en importeer `database/setup.sql`.

5. **Production-instellingen toevoegen**  
   Stel de benodigde environment-variabelen in, waaronder:
   - `NODE_ENV=production`
   - databasegegevens
   - `JWT_SECRET`
   - `FRONTEND_URL`

   Secrets worden niet in GitLab opgeslagen.

6. **Domein en HTTPS instellen**  
   Koppel het gewenste domein of subdomein aan de applicatie en activeer HTTPS via Plesk.

7. **Applicatie testen**  
   Herstart de Node.js-applicatie via Plesk en controleer minimaal:
   - login
   - werkorders
   - foto-upload
   - foto-weergave
   - logout

## Belangrijk

- PM2 wordt niet gebruikt; Plesk beheert het Node.js-proces.
- `backend/uploads` moet op de server schrijfbaar en blijvend beschikbaar zijn.
- Databasegegevens, `JWT_SECRET` en andere secrets worden alleen op de server ingesteld.
- Na deployment wordt een korte functionele test uitgevoerd.
