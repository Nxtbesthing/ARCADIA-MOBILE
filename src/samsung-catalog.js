const model = (storages, colors) => ({
  storages: Object.fromEntries(storages.map((storage) => [storage, colors.map((color) => typeof color === "string" ? { color, availability: "standard" } : { ...color })]))
});

const exclusive = (color, availability = "Samsung.com exclusive") => ({ color, availability });

export const samsungCatalog = {
  "Galaxy S20": model(["128GB"], ["Cosmic Gray", "Cloud Blue", "Cloud Pink", "Cloud White"]),
  "Galaxy S20+": model(["128GB", "256GB"], ["Cosmic Gray", "Cloud Blue", "Cloud White"]),
  "Galaxy S20 Ultra": model(["128GB", "256GB", "512GB"], ["Cosmic Gray", "Cloud White"]),
  "Galaxy S21": model(["128GB", "256GB"], ["Phantom Gray", "Phantom White", "Phantom Violet", "Phantom Pink"]),
  "Galaxy S21+": model(["128GB", "256GB"], ["Phantom Black", "Phantom Silver", "Phantom Violet", "Phantom Pink", "Phantom Gold", "Phantom Red"]),
  "Galaxy S21 Ultra": model(["128GB", "256GB", "512GB"], ["Phantom Black", "Phantom Silver", exclusive("Phantom Titanium"), exclusive("Phantom Navy"), exclusive("Phantom Brown")]),
  "Galaxy S22": model(["128GB", "256GB"], ["Phantom Black", "White", "Green", "Pink Gold", exclusive("Graphite"), exclusive("Cream"), exclusive("Violet")]),
  "Galaxy S22+": model(["128GB", "256GB"], ["Phantom Black", "White", "Green", "Pink Gold", exclusive("Graphite"), exclusive("Cream"), exclusive("Violet")]),
  "Galaxy S22 Ultra": model(["128GB", "256GB", "512GB", "1TB"], ["Phantom Black", "White", "Green", "Burgundy", exclusive("Graphite"), exclusive("Red"), exclusive("Sky Blue")]),
  "Galaxy S23": model(["128GB", "256GB"], ["Phantom Black", "Cream", "Green", "Lavender", exclusive("Lime"), exclusive("Graphite"), exclusive("Sky Blue")]),
  "Galaxy S23+": model(["256GB", "512GB"], ["Phantom Black", "Cream", "Green", "Lavender", exclusive("Lime"), exclusive("Graphite"), exclusive("Sky Blue")]),
  "Galaxy S23 Ultra": model(["256GB", "512GB", "1TB"], ["Phantom Black", "Cream", "Green", "Lavender", exclusive("Lime"), exclusive("Sky Blue"), exclusive("Red"), exclusive("Graphite")]),
  "Galaxy S24": model(["128GB", "256GB", "512GB"], ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow", exclusive("Jade Green"), exclusive("Sapphire Blue"), exclusive("Sandstone Orange")]),
  "Galaxy S24+": model(["256GB", "512GB"], ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow", exclusive("Jade Green"), exclusive("Sapphire Blue"), exclusive("Sandstone Orange")]),
  "Galaxy S24 Ultra": model(["256GB", "512GB", "1TB"], ["Titanium Gray", "Titanium Black", "Titanium Violet", "Titanium Yellow", exclusive("Titanium Blue"), exclusive("Titanium Green"), exclusive("Titanium Orange")]),
  "Galaxy S25": model(["128GB", "256GB", "512GB"], ["Navy", "Silver Shadow", "Icyblue", "Mint", exclusive("Blueblack"), exclusive("Coralred"), exclusive("Pinkgold")]),
  "Galaxy S25+": model(["256GB", "512GB"], ["Navy", "Silver Shadow", "Icyblue", "Mint", exclusive("Blueblack"), exclusive("Coralred"), exclusive("Pinkgold")]),
  "Galaxy S25 Ultra": model(["256GB", "512GB", "1TB"], ["Titanium Silverblue", "Titanium Black", "Titanium Whitesilver", "Titanium Gray", exclusive("Titanium Jetblack"), exclusive("Titanium Jadegreen"), exclusive("Titanium Pinkgold")]),
  "Galaxy S26": model(["128GB", "256GB", "512GB"], ["Black", "White", "Sky Blue", "Cobalt Violet"]),
  "Galaxy S26+": model(["256GB", "512GB"], ["Black", "White", "Sky Blue", "Cobalt Violet"]),
  "Galaxy S26 Ultra": model(["256GB", "512GB", "1TB"], ["Black", "White", "Sky Blue", "Cobalt Violet"]),
  "Galaxy Note20": model(["128GB", "256GB"], ["Mystic Green", "Mystic Gray", "Mystic Blue"]),
  "Galaxy Note20 Ultra": model(["128GB", "256GB", "512GB"], ["Mystic Bronze", "Mystic Black", "Mystic White"]),
  "Galaxy Z Fold2": model(["256GB"], ["Mystic Bronze", "Mystic Black"]),
  "Galaxy Z Fold3": model(["256GB", "512GB"], ["Phantom Black", "Phantom Silver", "Phantom Green"]),
  "Galaxy Z Fold4": model(["256GB", "512GB", "1TB"], ["Graygreen", "Phantom Black", "Beige", "Burgundy"]),
  "Galaxy Z Fold5": model(["256GB", "512GB", "1TB"], ["Icy Blue", "Phantom Black", "Cream", exclusive("Blue")]),
  "Galaxy Z Fold6": model(["256GB", "512GB", "1TB"], ["Silver Shadow", "Pink", "Navy", exclusive("Crafted Black"), exclusive("White")]),
  "Galaxy Z Fold7": model(["256GB", "512GB", "1TB"], ["Blue Shadow", "Silver Shadow", "Jetblack", exclusive("Mint")]),
  "Galaxy Z Fold8": model(["512GB", "1TB"], ["Lavender", "Graphite", "Cream", "Pistachio"]),
  "Galaxy Z Flip3": model(["128GB", "256GB"], ["Phantom Black", "Cream", "Green", "Lavender", exclusive("Gray"), exclusive("White", "region-specific"), exclusive("Pink", "region-specific")]),
  "Galaxy Z Flip4": model(["128GB", "256GB", "512GB"], ["Bora Purple", "Graphite", "Pink Gold", "Blue", exclusive("Yellow"), exclusive("White"), exclusive("Navy")]),
  "Galaxy Z Flip5": model(["256GB", "512GB"], ["Mint", "Graphite", "Cream", "Lavender", exclusive("Blue"), exclusive("Green"), exclusive("Gray", "region-specific")]),
  "Galaxy Z Flip6": model(["256GB", "512GB"], ["Silver Shadow", "Yellow", "Blue", "Mint", exclusive("Crafted Black"), exclusive("White"), exclusive("Peach")]),
  "Galaxy Z Flip7": model(["256GB", "512GB"], ["Blue Shadow", "Jetblack", "Coralred", exclusive("Mint")]),
  "Galaxy Z Flip8": model(["256GB", "512GB"], ["Blue", "Silver", "Pink", "Black"])
};

export const samsungModels = Object.keys(samsungCatalog);

export function getSamsungColorRecords(modelName, storage) {
  return samsungCatalog[modelName]?.storages?.[storage] || [];
}

export function getSamsungColors(modelName, storage) {
  return getSamsungColorRecords(modelName, storage).map(({ color }) => color);
}

export function isValidSamsungVariant(modelName, storage, color) {
  return getSamsungColors(modelName, storage).includes(color);
}
