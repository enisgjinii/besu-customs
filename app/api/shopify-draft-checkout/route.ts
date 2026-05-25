import { NextRequest, NextResponse } from "next/server";

type DraftCheckoutRequest = {
  productId?: string;
  productTitle?: string;
  printingMethod?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  teamName?: string;
  deliveryNotes?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: {
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clean = (value: unknown) => String(value || "").trim();

const toSafeMoney = (value: number) => {
  const rounded = Math.max(0, Math.round(value * 100) / 100);
  return rounded.toFixed(2);
};

export async function POST(request: NextRequest) {
  try {
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";

    if (!storeDomain || !adminToken) {
      return NextResponse.json(
        {
          error:
            "Missing Shopify Admin credentials. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as DraftCheckoutRequest;

    const quantity = Math.max(1, Math.floor(parseNumber(body.quantity, 1)));
    const unitPrice = parseNumber(body.unitPrice, 0);
    const totalPrice = parseNumber(body.totalPrice, unitPrice * quantity);

    const productTitle = clean(body.productTitle) || "Custom Configurator Item";
    const printingMethod = clean(body.printingMethod) || "custom";
    const productId = clean(body.productId);

    const lineTitle = `${productTitle} (${printingMethod})`;

    const noteParts = [
      productId ? `Configurator Product ID: ${productId}` : "",
      clean(body.teamName) ? `Team: ${clean(body.teamName)}` : "",
      clean(body.deliveryNotes) ? `Notes: ${clean(body.deliveryNotes)}` : "",
      clean(body.customer?.firstName) || clean(body.customer?.lastName)
        ? `Customer: ${clean(body.customer?.firstName)} ${clean(body.customer?.lastName)}`.trim()
        : "",
      clean(body.customer?.email) ? `Email: ${clean(body.customer?.email)}` : "",
      clean(body.customer?.phone) ? `Phone: ${clean(body.customer?.phone)}` : "",
      clean(body.shippingAddress?.street)
        ? `Address: ${clean(body.shippingAddress?.street)} ${clean(body.shippingAddress?.street2)}, ${clean(body.shippingAddress?.city)}, ${clean(body.shippingAddress?.state)} ${clean(body.shippingAddress?.zip)}`.replace(
            /\s+,/g,
            ",",
          )
        : "",
    ].filter(Boolean);

    const draftPayload: Record<string, unknown> = {
      draft_order: {
        line_items: [
          {
            title: lineTitle,
            custom: true,
            quantity,
            original_unit_price: toSafeMoney(unitPrice),
          },
        ],
        tags: "configurator,independent-checkout",
        note: noteParts.join(" | "),
        note_attributes: [
          { name: "configurator_total", value: toSafeMoney(totalPrice) },
          { name: "configurator_unit_price", value: toSafeMoney(unitPrice) },
          { name: "configurator_quantity", value: String(quantity) },
        ],
      },
    };

    const email = clean(body.customer?.email);
    if (email) {
      (draftPayload.draft_order as Record<string, unknown>).email = email;
    }

    const street = clean(body.shippingAddress?.street);
    if (street) {
      (draftPayload.draft_order as Record<string, unknown>).shipping_address = {
        address1: street,
        address2: clean(body.shippingAddress?.street2),
        city: clean(body.shippingAddress?.city),
        province: clean(body.shippingAddress?.state),
        zip: clean(body.shippingAddress?.zip),
        country_code: "US",
        first_name: clean(body.customer?.firstName),
        last_name: clean(body.customer?.lastName),
        phone: clean(body.customer?.phone),
      };
    }

    const response = await fetch(
      `https://${storeDomain}/admin/api/${apiVersion}/draft_orders.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": adminToken,
        },
        body: JSON.stringify(draftPayload),
      },
    );

    const responseBody = await response.text();
    let parsedResponse: Record<string, unknown> = {};
    try {
      parsedResponse = responseBody ? (JSON.parse(responseBody) as Record<string, unknown>) : {};
    } catch {
      parsedResponse = { raw: responseBody };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to create Shopify draft checkout.",
          status: response.status,
          details: parsedResponse,
        },
        { status: 502 },
      );
    }

    const draftOrder = (parsedResponse.draft_order || {}) as Record<string, unknown>;
    const checkoutUrl =
      (draftOrder.invoice_url as string | undefined) ||
      (draftOrder.invoiceUrl as string | undefined) ||
      "";

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          error: "Draft order was created but no checkout URL was returned.",
          details: parsedResponse,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      checkoutUrl,
      draftOrderId: draftOrder.id,
      draftOrderName: draftOrder.name,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error creating draft checkout.",
      },
      { status: 500 },
    );
  }
}
