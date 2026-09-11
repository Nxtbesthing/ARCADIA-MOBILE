const same = (colors, storages) => Object.fromEntries(storages.map((storage) => [storage, [...colors]]));

export const iphoneCatalog = {
  "iPhone XR": { storages: same(["Black", "White", "Blue", "Yellow", "Coral", "(PRODUCT)RED"], ["64GB", "128GB", "256GB"]) },
  "iPhone 11": { storages: same(["Black", "Green", "Yellow", "Purple", "White", "(PRODUCT)RED"], ["64GB", "128GB", "256GB"]) },
  "iPhone 11 Pro": { storages: same(["Gold", "Space Gray", "Silver", "Midnight Green"], ["64GB", "256GB", "512GB"]) },
  "iPhone 11 Pro Max": { storages: same(["Gold", "Space Gray", "Silver", "Midnight Green"], ["64GB", "256GB", "512GB"]) },
  "iPhone SE (2nd generation)": { storages: same(["Black", "White", "(PRODUCT)RED"], ["64GB", "128GB", "256GB"]) },
  "iPhone 12 mini": { storages: same(["Black", "White", "Red", "Green", "Blue", "Purple"], ["64GB", "128GB", "256GB"]) },
  "iPhone 12": { storages: same(["Black", "White", "Red", "Green", "Blue", "Purple"], ["64GB", "128GB", "256GB"]) },
  "iPhone 12 Pro": { storages: same(["Graphite", "Gold", "Silver", "Pacific Blue"], ["128GB", "256GB", "512GB"]) },
  "iPhone 12 Pro Max": { storages: same(["Graphite", "Gold", "Silver", "Pacific Blue"], ["128GB", "256GB", "512GB"]) },
  "iPhone SE (3rd generation)": { storages: same(["Midnight", "Starlight", "(PRODUCT)RED"], ["64GB", "128GB", "256GB"]) },
  "iPhone 13 mini": { storages: same(["Midnight", "Starlight", "Blue", "Pink", "Green", "(PRODUCT)RED"], ["128GB", "256GB", "512GB"]) },
  "iPhone 13": { storages: same(["Midnight", "Starlight", "Blue", "Pink", "Green", "(PRODUCT)RED"], ["128GB", "256GB", "512GB"]) },
  "iPhone 13 Pro": { storages: same(["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"], ["128GB", "256GB", "512GB", "1TB"]) },
  "iPhone 13 Pro Max": { storages: same(["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"], ["128GB", "256GB", "512GB", "1TB"]) },
  "iPhone 14": { storages: same(["Midnight", "Starlight", "Blue", "Purple", "Yellow", "(PRODUCT)RED"], ["128GB", "256GB", "512GB"]) },
  "iPhone 14 Plus": { storages: same(["Midnight", "Starlight", "Blue", "Purple", "Yellow", "(PRODUCT)RED"], ["128GB", "256GB", "512GB"]) },
  "iPhone 14 Pro": { storages: same(["Space Black", "Silver", "Gold", "Deep Purple"], ["128GB", "256GB", "512GB", "1TB"]) },
  "iPhone 14 Pro Max": { storages: same(["Space Black", "Silver", "Gold", "Deep Purple"], ["128GB", "256GB", "512GB", "1TB"]) },
  "iPhone 15": { storages: same(["Black", "Blue", "Green", "Yellow", "Pink"], ["128GB", "256GB", "512GB"]) },
  "iPhone 15 Plus": { storages: same(["Black", "Blue", "Green", "Yellow", "Pink"], ["128GB", "256GB", "512GB"]) },
  "iPhone 15 Pro": { storages: same(["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"], ["128GB", "256GB", "512GB", "1TB"]) },
  "iPhone 15 Pro Max": { storages: same(["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"], ["256GB", "512GB", "1TB"]) },
  "iPhone 16": { storages: same(["Black", "White", "Pink", "Teal", "Ultramarine"], ["128GB", "256GB", "512GB"]) },
  "iPhone 16 Plus": { storages: same(["Black", "White", "Pink", "Teal", "Ultramarine"], ["128GB", "256GB", "512GB"]) },
  "iPhone 16 Pro": { storages: same(["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"], ["128GB", "256GB", "512GB", "1TB"]) },
  "iPhone 16 Pro Max": { storages: same(["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"], ["256GB", "512GB", "1TB"]) },
  "iPhone 16e": { storages: same(["Black", "White"], ["128GB", "256GB", "512GB"]) },
  "iPhone 17": { storages: same(["Black", "White", "Mist Blue", "Sage", "Lavender"], ["256GB", "512GB"]) },
  "iPhone Air": { storages: same(["Space Black", "Cloud White", "Light Gold", "Sky Blue"], ["256GB", "512GB", "1TB"]) },
  "iPhone 17 Pro": { storages: same(["Silver", "Cosmic Orange", "Deep Blue"], ["256GB", "512GB", "1TB"]) },
  "iPhone 17 Pro Max": { storages: same(["Silver", "Cosmic Orange", "Deep Blue"], ["256GB", "512GB", "1TB", "2TB"]) },
  "iPhone 17e": { storages: same(["Black", "White"], ["256GB", "512GB"]) }
};

export const iphoneModels = Object.keys(iphoneCatalog);

export function getIphoneColors(model, storage) {
  return iphoneCatalog[model]?.storages?.[storage] || [];
}

export function isValidIphoneVariant(model, storage, color) {
  return getIphoneColors(model, storage).includes(color);
}
