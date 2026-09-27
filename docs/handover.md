# Running the shop from the admin

Status: Current

Last updated: 2026-09-27

---

## Who this is for

You run the shop. Everything here is done at `admin.truelux.com`, and nothing here
needs a developer.

The admin shows and changes what the API holds. It never works anything out for
itself: every price, total, stock figure and "what can happen next" to an order
comes from the backend. If a number looks wrong here, it is wrong in the shop.

---

## Before you open the shop

Do these once, in this order.

### 1. Get a staff account

Staff accounts are created by the superuser in the backend's `/django-admin/` (or,
on a development machine, with `make seed-staff`). There is no sign-up and no
password reset in the admin.

Anyone with a staff account can do **everything**: cancel orders, change stock,
delete products and read every customer's address and phone number. Give accounts
only to people you would trust with the whole shop. Removing someone's staff rights
takes effect within 15 minutes, when their current sign-in token expires.

### 2. Fill in the lists products are built from

A product needs a brand and a category, and each of its variants needs a size. Set
these up first, in the sidebar under **Catalogue**:

- **Brands** — name, logo, and whether the brand is active. An inactive brand's
  products are hidden from the storefront.
- **Categories** — top-level categories (Face, Lips) and, one level down, their
  children (Foundation under Face).
- **Sizes** — every size you sell: 30 ml, 5 g.
- **Shades** — every colour you sell, with its hex colour. A variant may have none.
- **Skin types** — Normal, Dry, Oily and so on. Customers shop by them, and each
  product's **Details** tab lists the ones it suits, with its skin feel and key
  ingredients.

The _sort order_ number controls the order things appear in; smaller comes first.

### 3. Add your products

**Products → New product**, fill in the details and **Create product**. You land on
the **Variants** tab:

1. **Add variant** for each size-and-shade combination you sell, with its SKU and
   stock. Leave _Price override_ blank to use the base price. Press the save icon on
   each row.
2. On **Images**, upload photos (JPEG, PNG or WebP, up to 5 MB — see the limit
   below). The first becomes the primary image; write alt text for each.
3. On **Details**, switch on **Published** and **Save details**.

A product cannot be published without at least one variant; the admin says so on
the Published switch.

---

## Day-to-day

### Working the order queue

Orders are cash on delivery. The dashboard and the **Orders** list check for new
orders every minute while they are open, and again when you come back to the tab, so
there is no need to reload. The dashboard's **Awaiting action** card shows pending
and confirmed orders together; select it to open that queue.

For each order:

1. **Pending** — call the customer on the number shown, then **Confirm order**.
2. **Confirmed** — pack it and hand it to the courier, then **Mark as shipped**.
3. **Shipped** — once the courier has delivered and collected the cash, **Mark as
   delivered**.

Only the buttons that make sense for the order's current status appear. **Cancel
order** is available while an order is pending or confirmed; it asks you to confirm
and puts the items back into stock. A shipped order cannot be cancelled here.

### Watching stock

The dashboard lists up to ten variants with five or fewer left, lowest first.
Select one to open its product on the Variants tab and change the stock. The
**Products** list can also be filtered to **Low stock**.

### Shipping fees and free shipping

**Settings → Shipping** holds the two delivery fees (inside the Kathmandu valley,
and everywhere else) and an optional free-shipping threshold: switch on **Free
shipping** and enter the smallest order subtotal that ships free. **Save settings**
applies to the next order placed; orders already placed keep the fee they were
charged. The storefront's free-shipping banner catches up on its next refresh.

### Removing things

- A **product** that has ever been ordered cannot be deleted. The admin offers
  **Unpublish instead**, which hides it from the storefront and keeps the order
  history intact.
- A **variant** that has been ordered cannot be deleted either; set its stock to 0.
- A **brand, category, shade or size** that is still in use cannot be deleted. The
  message says how many products or variants use it. Move them first, or for a
  brand, switch it to inactive.
- A **skin type** can always be deleted; it is simply removed from every product
  that listed it. The confirmation says how many that is.

---

## Limits to know

- **Photos over 4.5 MB fail on the live site** even though the API accepts up to
  5 MB, because of the hosting platform's upload limit. Resize large photos before
  uploading.
- **You are signed out after 7 days**, or sooner if your session is ended from the
  backend. The login page says "Your session ended" when that happens.
- **Two tabs signing in again at the same moment** can bounce one of them to the
  login page. Reload it; you are still signed in.

---

## When something is wrong and this document does not cover it

Error screens show a reference (a number, or "ref …" in a message). Send that
reference, the time, and what you clicked to whoever runs the backend; it finds the
exact request in the logs.
