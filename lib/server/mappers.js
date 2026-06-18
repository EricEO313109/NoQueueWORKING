export function toUuid(id) {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return crypto.randomUUID();
}

export function entryToRow(deviceId, e) {
  return {
    id: toUuid(e.id),
    device_id: deviceId,
    entry_date: e.date,
    meal: e.meal,
    name: e.name,
    barcode: e.barcode || null,
    grams: e.grams,
    calories: e.calories,
    protein: e.protein,
    carbs: e.carbs,
    fat: e.fat,
    fiber: e.fiber,
    sodium: e.sodium,
    sugars: e.sugars,
    image_url: e.imageUrl || null,
    logged_at: e.loggedAt ? new Date(e.loggedAt).toISOString() : new Date().toISOString(),
  };
}

export function entryFromRow(row) {
  return {
    id: row.id,
    date: row.entry_date,
    meal: row.meal,
    name: row.name,
    barcode: row.barcode,
    grams: row.grams,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber,
    sodium: row.sodium,
    sugars: row.sugars,
    imageUrl: row.image_url,
    loggedAt: new Date(row.logged_at).getTime(),
  };
}

