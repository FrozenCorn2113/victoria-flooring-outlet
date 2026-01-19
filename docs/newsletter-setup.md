# Newsletter subscription setup

This project stores newsletter subscribers in Postgres and can also push them to MailerLite.
It also supports automated weekly sneak peek campaigns using the Harbinger/weekly_deals data.

## Database

Run the schema SQL in `lib/newsletter/db-schema.sql` against the same Postgres instance
used by chat. The code expects the following environment variables:

- `POSTGRES_HOST`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE` (optional, defaults to `postgres`)

If you plan to send weekly sneak peek emails, also run the schema in
`lib/products/db-schema.sql` to create `vendor_products`, `vendor_product_images`,
and `weekly_deals`.

## MailerLite (optional)

To sync subscribers to MailerLite, set:

- `MAILERLITE_API_KEY`
- `MAILERLITE_GROUP_ID` (optional, to add subscribers directly to a group)

For automated weekly sends, also set:

- `MAILERLITE_FROM_NAME` (default: Victoria Flooring Outlet)
- `MAILERLITE_FROM_EMAIL` (default: hello@victoriaflooringoutlet.ca)
- `SITE_URL` (default: https://victoriaflooringoutlet.ca)
- `CRON_SECRET` (required to secure cron endpoints)

If `MAILERLITE_API_KEY` is not set, subscriptions are stored only in the database.

## Weekly sneak peek automation

The weekly sneak peek cron uses `/api/cron/send-weekly-sneak`. It pulls the next
scheduled entry from `weekly_deals` and sends it via MailerLite every Sunday at
9:00 AM PT (UTC schedule in `vercel.json`).

## Source tracking

The subscription API accepts an optional `source` string. The homepage preview
form uses `next_week_preview`, and the shared component defaults to
`general_email_subscription`.
