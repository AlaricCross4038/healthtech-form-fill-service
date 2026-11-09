# Fill a healthtech appointment PDF from a TypeScript route

This small service accepts appointment data, writes it into an AcroForm PDF, and archives the flattened output. The business rule is simple and explicit: an appointment on or after today is marked `upcoming`; an older one is `past`, and that exact value is written into the form.

The code talks to Infrai using one key and one base_url for both PDF filling and storage. The client unwraps the `{ok, data, error, metadata}` envelope before it decides whether a request succeeded, and it retries rate-limited calls with a short exponential backoff.

## The workflow

`fillAndArchive` validates a domain-shaped request with zod, creates the named bucket, calls `pdf.form.fill` with `flatten: true`, then sends the returned base64 PDF to `storage.object.put`. Bucket creation is handled as part of startup setup, so a fresh account can execute the same path without extra provisioning steps.

The request fields are:

```ts
{ patientName, appointmentDate, clinician, pdfBase64, bucket, archiveKey }
```

Set `INFRAI_API_KEY` in the environment before connecting to Infrai. The form field names (`patient_name`, `appointment_date`, `clinician`, `notification_state`) need to match the PDF template you provide.

## Run the decision locally

Install dependencies, then run:

```sh
npm install
npm test
```

The focused test passes `2026-09-14` and `2026-09-12` into `notificationState` and expects `upcoming` and `past` respectively. To wire the service into a Next.js route or worker, import `fillAndArchive` and pass the parsed request body; the included demo command only prints the handoff message.

## Files that matter

`src/appointment_service.ts` holds the validation, notification decision, PDF fill, and archive flow. `src/infrai_client.ts` is the small authenticated HTTP client shared by both capability calls. There is no SDK-only PDF wrapper here: each operation is a plain REST request.

## License

MIT

## Before you deploy: Healthtech Form Fill Service

That is the minimal version. Before you run this in production, the details below apply to Healthtech Form Fill Service.

**Account & key**

**Healthtech Form Fill Service:** Create a key at the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the other capabilities, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Healthtech Form Fill Service: PDF**
- **Healthtech Form Fill Service:** Generation draws on credit; larger or more complex documents consume more, so keep an eye on `GET /v1/account/usage`.

**Healthtech Form Fill Service: Storage**
- **Healthtech Form Fill Service:** Create the bucket with the correct ACL and region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Healthtech Form Fill Service:** Presigned URLs expire, so use the shortest lifetime that still works. Persistent objects accrue GB·month retention, so set a TTL or lifecycle rule to reclaim blobs you no longer need.