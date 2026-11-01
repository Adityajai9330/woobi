/* WooBi — Colour Coordination Assistant
   Pure vanilla JavaScript. No dependencies, no network requests. */
(() => {
  "use strict";

  const COLOURS = [
    { name: "Terracotta", hex: "#C4633F" },
    { name: "Saffron", hex: "#D9A441" },
    { name: "Amber", hex: "#B8863F" },
    { name: "Olive", hex: "#77794B" },
    { name: "Sage", hex: "#9BAA8C" },
    { name: "Forest", hex: "#355345" },
    { name: "Lagoon", hex: "#3F7C7B" },
    { name: "Sky", hex: "#A7BED3" },
    { name: "Cobalt", hex: "#375C9A" },
    { name: "Lavender", hex: "#A99BC1" },
    { name: "Plum", hex: "#6B3F5B" },
    { name: "Rose", hex: "#C88A93" },
    { name: "Cherry", hex: "#A73545" },
    { name: "Chocolate", hex: "#6B4A3A" },
    { name: "Oat", hex: "#D8C8B0" },
    { name: "Charcoal", hex: "#3A3835" }
  ];

  const INK_COLOUR = { name: "Ink", hex: "#2D2824" };

  const PRODUCTS = [
    {
      id: "amara",
      name: "Amara Wrap Dress",
      price: 189,
      colour: "Terracotta",
      hex: "#C4633F",
      category: "Dresses",
      tag: "New in",
      icon: "g-dress"
    },
    {
      id: "vale",
      name: "Vale Tailored Blazer",
      price: 245,
      colour: "Olive",
      hex: "#77794B",
      category: "Tailoring",
      tag: "Bestseller",
      icon: "g-blazer"
    },
    {
      id: "lune",
      name: "Lune Ribbed Knit",
      price: 128,
      colour: "Oat",
      hex: "#D8C8B0",
      category: "Knitwear",
      tag: "New in",
      icon: "g-knit"
    },
    {
      id: "sable",
      name: "Sable Wide-Leg Trouser",
      price: 155,
      colour: "Charcoal",
      hex: "#3A3835",
      category: "Tailoring",
      tag: "",
      icon: "g-trousers"
    }
  ];

  const OUTFITS = [
    {
      id: "gallery",
      title: "The Gallery Lunch",
      occasion: "Weekend",
      layout: "gallery",
      note: "One confident colour, softened with warm neutrals and a small flash of contrast.",
      pieces: [
        { icon: "g-dress", role: "selected", label: "Wrap dress", place: "dress" },
        { icon: "g-tote", role: "neutral", label: "Leather tote", place: "tote" },
        { icon: "g-loafer", role: "tonal", label: "Leather loafers", place: "loafer" },
        { icon: "g-scarf", role: "complement", label: "Silk scarf", place: "scarf" }
      ]
    },
    {
      id: "studio",
      title: "Nine to Five",
      occasion: "Work",
      layout: "tailored",
      note: "A tailored colour block, grounded by a tonal trouser and a quiet neutral carry.",
      pieces: [
        { icon: "g-blazer", role: "selected", label: "Tailored blazer", place: "blazer" },
        { icon: "g-trousers", role: "tonal", label: "Wide-leg trousers", place: "trousers" },
        { icon: "g-loafer", role: "ink", label: "Leather loafers", place: "loafer" },
        { icon: "g-tote", role: "neutral", label: "Structured tote", place: "tote" }
      ]
    },
    {
      id: "weekend",
      title: "Weekend, Unhurried",
      occasion: "Off duty",
      layout: "weekend",
      note: "An easy knit in your shade, with an analogous trouser and a bright carry to finish.",
      pieces: [
        { icon: "g-knit", role: "selected", label: "Ribbed knit", place: "knit" },
        { icon: "g-trousers", role: "analogous", label: "Relaxed trousers", place: "trousers" },
        { icon: "g-sneaker", role: "neutral", label: "Leather sneakers", place: "sneaker" },
        { icon: "g-tote", role: "complement", label: "Canvas tote", place: "tote" }
      ]
    }
  ];

  const state = {
    selected: COLOURS[0],
    palette: [],
    cart: new Map(),
    savedLooks: new Set(),
    wishlist: new Set(),
    lastFocus: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* Colour maths ------------------------------------------------------- */
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function normaliseHex(value) {
    let hex = String(value || "").trim().replace("#", "");
    if (/^[0-9a-f]{3}$/i.test(hex)) {
      hex = hex.split("").map((char) => char + char).join("");
    }
    if (!/^[0-9a-f]{6}$/i.test(hex)) return "#C4633F";
    return "#" + hex.toUpperCase();
  }

  function hexToRgb(hex) {
    const clean = normaliseHex(hex).slice(1);
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
    return ("#" + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;
    let r;
    let g;
    let b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const hk = h / 360;
      r = hueToRgb(p, q, hk + 1 / 3);
      g = hueToRgb(p, q, hk);
      b = hueToRgb(p, q, hk - 1 / 3);
    }
    return rgbToHex(r * 255, g * 255, b * 255);
  }

  function hexToHsl(hex) {
    const rgb = hexToRgb(hex);
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  function mixHex(a, b, amount) {
    const first = hexToRgb(a);
    const second = hexToRgb(b);
    const t = clamp(amount, 0, 1);
    return rgbToHex(
      first.r + (second.r - first.r) * t,
      first.g + (second.g - first.g) * t,
      first.b + (second.b - first.b) * t
    );
  }

  function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function luminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const channel = (value) => {
      const v = value / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  function readableInk(hex) {
    const light = "#FFF9F0";
    const dark = "#241F1B";
    const bg = luminance(hex);
    const lightRatio = (Math.max(luminance(light), bg) + 0.05) / (Math.min(luminance(light), bg) + 0.05);
    const darkRatio = (Math.max(luminance(dark), bg) + 0.05) / (Math.min(luminance(dark), bg) + 0.05);
    return lightRatio >= darkRatio ? light : dark;
  }

  function curatedColour(hex) {
    const target = normaliseHex(hex);
    return COLOURS.find((colour) => colour.hex.toUpperCase() === target) || null;
  }

  function colourName(hex) {
    const curated = curatedColour(hex);
    if (curated) return curated.name;
    const { h, s, l } = hexToHsl(hex);
    let base;
    if (s < 14) {
      if (l > 88) base = "Chalk";
      else if (l > 72) base = "Oat";
      else if (l > 53) base = "Taupe";
      else if (l > 31) base = "Umber";
      else base = "Ink";
      return base;
    }
    const ranges = [
      [12, "Cherry"], [28, "Terracotta"], [45, "Amber"], [60, "Saffron"],
      [82, "Olive"], [112, "Fern"], [150, "Eucalyptus"], [205, "Lagoon"],
      [225, "Denim"], [250, "Cobalt"], [275, "Iris"], [300, "Violet"],
      [330, "Plum"], [350, "Rose"], [361, "Cherry"]
    ];
    base = ranges.find(([limit]) => h < limit)?.[1] || "Rose";
    if (l > 78) return "Pale " + base;
    if (l < 30 && s > 18) return "Deep " + base;
    return base;
  }

  function buildPalette(selectedHex, selectedName) {
    const { h, s, l } = hexToHsl(selectedHex);
    const saturationBase = s < 16 ? 30 : s;

    const complementHue = h + 180;
    const complementLight = l > 68 ? 47 : l < 35 ? 62 : 51;
    const complement = hslToHex(
      complementHue,
      clamp(saturationBase * 0.8, 27, 64),
      complementLight
    );

    const analogous = hslToHex(
      h + 32,
      clamp(saturationBase * 0.72, 23, 58),
      clamp(l + (l > 62 ? -4 : 9), 44, 72)
    );

    const tonal = hslToHex(
      h,
      clamp(saturationBase, 12, 85),
      l > 55 ? clamp(l - 22, 28, 72) : clamp(l + 22, 38, 86)
    );

    const neutral = hslToHex((h + 20) % 360, 9, 83);

    return [
      { key: "selected", role: "Your pick", name: selectedName || colourName(selectedHex), hex: normaliseHex(selectedHex) },
      { key: "complement", role: "Complementary", name: colourName(complement), hex: complement },
      { key: "analogous", role: "Analogous", name: colourName(analogous), hex: analogous },
      { key: "tonal", role: "Tonal", name: colourName(tonal), hex: tonal },
      { key: "neutral", role: "Neutral", name: colourName(neutral), hex: neutral }
    ];
  }

  function paletteItem(key) {
    if (key === "ink") return INK_COLOUR;
    return state.palette.find((entry) => entry.key === key) || state.palette[0];
  }

  /* Colour selection --------------------------------------------------- */
  function renderSwatches() {
    const grid = $("#swatchGrid");
    grid.innerHTML = COLOURS.map((colour) => `
      <button class="swatch" type="button" data-hex="${colour.hex}" data-name="${colour.name}" aria-pressed="false" title="${colour.name}">
        <span class="swatch__chip" style="--swatch:${colour.hex}"></span>
        <span class="swatch__name">${colour.name}</span>
      </button>
    `).join("");
  }

  function renderWheel() {
    const dots = $("#wheelDots");
    dots.innerHTML = "";
    const count = COLOURS.length;
    COLOURS.forEach((colour, index) => {
      const angle = ((-90 + (360 / count) * index) * Math.PI) / 180;
      const x = 50 + 41.5 * Math.cos(angle);
      const y = 50 + 41.5 * Math.sin(angle);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wheel-dot";
      button.style.setProperty("--dot", colour.hex);
      button.style.left = `${x}%`;
      button.style.top = `${y}%`;
      button.dataset.hex = colour.hex;
      button.dataset.name = colour.name;
      button.title = colour.name;
      button.setAttribute("aria-label", `Select ${colour.name}`);
      button.setAttribute("aria-pressed", "false");
      dots.appendChild(button);
    });
  }

  function renderMenuSwatches() {
    const wrap = $("#menuSwatches");
    wrap.innerHTML = COLOURS.slice(0, 12).map((colour) =>
      `<span style="--dot:${colour.hex}" title="${colour.name}"></span>`
    ).join("");
  }

  function selectColour(hex, name) {
    const clean = normaliseHex(hex);
    const curated = curatedColour(clean);
    state.selected = {
      hex: clean,
      name: name || curated?.name || colourName(clean)
    };
    state.palette = buildPalette(clean, state.selected.name);

    const root = document.documentElement;
    root.style.setProperty("--sel", clean);
    root.style.setProperty("--sel-ink", readableInk(clean));
    root.style.setProperty("--sel-wash", rgba(clean, 0.12));

    $("#currentName").textContent = state.selected.name;
    $("#currentHex").textContent = clean;
    $("#wheelName").textContent = state.selected.name;
    $("#wheelHex").textContent = clean;
    $("#wheelCenter").setAttribute("aria-label", `Selected colour: ${state.selected.name}. Open the Colour Studio.`);
    $("#customColour").value = clean.toLowerCase();
    $("#outfitColourName").textContent = state.selected.name;

    $$(".swatch").forEach((swatch) => {
      swatch.setAttribute("aria-pressed", String(normaliseHex(swatch.dataset.hex) === clean));
    });
    $$(".wheel-dot").forEach((dot) => {
      dot.setAttribute("aria-pressed", String(normaliseHex(dot.dataset.hex) === clean));
    });

    renderPalette();
    renderOutfits();
  }

  function renderPalette() {
    const grid = $("#paletteGrid");
    grid.innerHTML = state.palette.map((entry) => `
      <button class="palette-card${entry.key === "selected" ? " is-current" : ""}" type="button"
        data-hex="${entry.hex}" data-name="${entry.name}" aria-pressed="${entry.key === "selected"}"
        aria-label="${entry.role}: ${entry.name}, ${entry.hex}. Select this colour.">
        <span class="palette-card__swatch" style="--chip:${entry.hex}">
          <span class="palette-card__tag">Selected</span>
        </span>
        <span class="palette-card__meta">
          <span class="palette-card__role">${entry.role}</span>
          <span class="palette-card__name">${entry.name}</span>
          <span class="palette-card__hex">${entry.hex}</span>
        </span>
      </button>
    `).join("");

    const selected = paletteItem("selected");
    const complement = paletteItem("complement");
    const analogous = paletteItem("analogous");
    const tonal = paletteItem("tonal");
    const neutral = paletteItem("neutral");

    const bridgeNames = [analogous, tonal]
      .map((entry) => entry.name)
      .filter((name, index, names) =>
        name !== selected.name &&
        name !== complement.name &&
        name !== neutral.name &&
        names.indexOf(name) === index
      )
      .slice(0, 2);

    const bridgeCopy = bridgeNames.length === 1
      ? `, and use ${bridgeNames[0]} to bridge the two`
      : bridgeNames.length > 1
        ? `, and use ${bridgeNames[0]} or ${bridgeNames[1]} to bridge the two`
        : "";

    const baseCopy = neutral.name === selected.name
      ? "Keep the base close to your pick"
      : `Let ${neutral.name} carry the quiet base`;

    $("#paletteNote").textContent =
      `${selected.name} finds its contrast in ${complement.name}. ${baseCopy}${bridgeCopy}.`;

    $("#ratio60").style.background = selected.hex;
    $("#ratio30").style.background = analogous.hex;
    $("#ratio10").style.background = complement.hex;
    $("#ratioCopy").innerHTML =
      `Lead with <strong>${selected.name}</strong>, support with <strong>${analogous.name}</strong>, then add a small flash of <strong>${complement.name}</strong>.`;
  }

  /* Outfit rendering --------------------------------------------------- */
  function pieceParade(colour) {
    const ink = readableInk(colour.hex);
    return {
      line: ink === "#FFF9F0" ? "rgba(255, 249, 240, 0.26)" : "rgba(36, 31, 27, 0.18)",
      detail: ink === "#FFF9F0" ? "rgba(255, 249, 240, 0.38)" : "rgba(36, 31, 27, 0.24)",
      detailFill: ink === "#FFF9F0" ? "rgba(255, 249, 240, 0.12)" : "rgba(36, 31, 27, 0.08)"
    };
  }

  function garmentSvg(icon, colour) {
    const t = pieceParade(colour);
    return `<svg viewBox="0 0 200 240" aria-hidden="true" style="--garment:${colour.hex};--line:${t.line};--detail:${t.detail};--detail-fill:${t.detailFill}"><use href="#${icon}"></use></svg>`;
  }

  function renderOutfits() {
    const grid = $("#outfitGrid");
    grid.innerHTML = OUTFITS.map((outfit, index) => {
      const pieces = outfit.pieces.map((piece) => {
        const colour = paletteItem(piece.role);
        return { ...piece, colour };
      });
      const label = pieces.map((piece) => `${piece.colour.name} ${piece.label.toLowerCase()}`).join(", ");
      const pieceMarkup = pieces.map((piece) => `
        <div class="flatlay__piece piece--${piece.place}">${garmentSvg(piece.icon, piece.colour)}</div>
      `).join("");
      const list = pieces.map((piece) => `
        <li><i style="--dot:${piece.colour.hex}"></i><span>${piece.colour.name} ${piece.label.toLowerCase()}</span></li>
      `).join("");
      const saved = state.savedLooks.has(outfit.id);

      return `
        <article class="outfit-card">
          <div class="outfit-card__visual flatlay flatlay--${outfit.layout}" role="img" aria-label="Flat lay: ${label}">
            <span class="outfit-card__index">0${index + 1}</span>
            <span class="outfit-card__occasion">${outfit.occasion}</span>
            <span class="flatlay__halo"></span>
            ${pieceMarkup}
          </div>
          <div class="outfit-card__body">
            <h4>${outfit.title}</h4>
            <p class="outfit-card__note">${outfit.note}</p>
            <ul class="outfit-pieces">${list}</ul>
            <button class="save-look" type="button" data-look="${outfit.id}" aria-pressed="${saved}">
              <svg aria-hidden="true"><use href="#i-heart"></use></svg>
              <span>${saved ? "Saved to moodboard" : "Save this look"}</span>
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  /* Products ----------------------------------------------------------- */
  const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const formatPrice = (value) => priceFormatter.format(value);

  function productWash(product) {
    return mixHex(product.hex, "#F1E7D8", 0.84);
  }

  function renderProducts() {
    const grid = $("#productGrid");
    grid.innerHTML = PRODUCTS.map((product) => {
      const wished = state.wishlist.has(product.id);
      return `
        <article class="product-card" id="product-${product.id}" data-product-card="${product.id}">
          <div class="product-card__visual" style="--wash:${productWash(product)}">
            ${product.tag ? `<span class="product-card__tag">${product.tag}</span>` : ""}
            <button class="wishlist" type="button" data-wishlist="${product.id}" aria-pressed="${wished}" aria-label="${wished ? "Remove" : "Save"} ${product.name} ${wished ? "from" : "to"} wishlist">
              <svg aria-hidden="true"><use href="#i-heart"></use></svg>
            </button>
            <div class="product-card__art">${garmentSvg(product.icon, product)}</div>
            <button class="quick-add" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">
              Add to bag <svg aria-hidden="true"><use href="#i-plus"></use></svg>
            </button>
          </div>
          <div class="product-card__info">
            <div>
              <h3>${product.name}</h3>
              <p>${product.colour} · ${product.category}</p>
            </div>
            <span class="product-card__price">${formatPrice(product.price)}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function toggleWishlist(id) {
    const product = PRODUCTS.find((item) => item.id === id);
    if (!product) return;
    if (state.wishlist.has(id)) {
      state.wishlist.delete(id);
      showToast(`${product.name} removed from your wishlist.`);
    } else {
      state.wishlist.add(id);
      showToast(`${product.name} saved to your wishlist.`);
    }
    $$(`[data-wishlist="${id}"]`).forEach((button) => {
      const wished = state.wishlist.has(id);
      button.setAttribute("aria-pressed", String(wished));
      button.setAttribute("aria-label", `${wished ? "Remove" : "Save"} ${product.name} ${wished ? "from" : "to"} wishlist`);
    });
  }

  /* Shopping bag ------------------------------------------------------- */
  const SHIPPING_THRESHOLD = 150;

  function cartTotals() {
    let count = 0;
    let subtotal = 0;
    state.cart.forEach((quantity, id) => {
      const product = PRODUCTS.find((item) => item.id === id);
      if (!product) return;
      count += quantity;
      subtotal += product.price * quantity;
    });
    return { count, subtotal };
  }

  function renderBag() {
    const { count, subtotal } = cartTotals();
    $("#bagCount").textContent = String(count);
    $("#bagDrawerCount").textContent = `(${count})`;
    $("#bagSubtotal").textContent = formatPrice(subtotal);

    const remaining = Math.max(0, SHIPPING_THRESHOLD - subtotal);
    const progress = Math.min(100, (subtotal / SHIPPING_THRESHOLD) * 100);
    $("#bagShipping").innerHTML = `
      <span>${remaining > 0 ? `You’re ${formatPrice(remaining)} away from complimentary shipping.` : "You’ve unlocked complimentary shipping."}</span>
      <div class="shipping-track"><span style="width:${progress}%"></span></div>
    `;

    const items = $("#bagItems");
    if (count === 0) {
      items.innerHTML = `
        <div class="bag-empty">
          <svg aria-hidden="true"><use href="#i-bag"></use></svg>
          <h3>Your bag is quiet.</h3>
          <p>Find a piece that speaks to your palette. The studio can help.</p>
          <button class="button button--outline button--small" type="button" data-explore>Explore the edit</button>
        </div>
      `;
      $("#checkoutButton").disabled = true;
      return;
    }

    items.innerHTML = Array.from(state.cart.entries()).map(([id, quantity]) => {
      const product = PRODUCTS.find((item) => item.id === id);
      if (!product) return "";
      return `
        <div class="bag-item" data-id="${product.id}">
          <div class="bag-item__visual" style="--wash:${productWash(product)}">${garmentSvg(product.icon, product)}</div>
          <div class="bag-item__body">
            <div class="bag-item__top">
              <span class="bag-item__name">${product.name}</span>
              <span class="bag-item__price">${formatPrice(product.price * quantity)}</span>
            </div>
            <span class="bag-item__meta">${product.colour} · ${product.category}</span>
            <div class="bag-item__controls">
              <div class="qty-control" aria-label="Quantity for ${product.name}">
                <button type="button" data-cart-action="minus" aria-label="Decrease quantity">
                  <svg aria-hidden="true"><use href="#i-minus"></use></svg>
                </button>
                <span>${quantity}</span>
                <button type="button" data-cart-action="plus" aria-label="Increase quantity">
                  <svg aria-hidden="true"><use href="#i-plus"></use></svg>
                </button>
              </div>
              <button class="bag-remove" type="button" data-cart-action="remove">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
    $("#checkoutButton").disabled = false;
  }

  function addToBag(id) {
    const product = PRODUCTS.find((item) => item.id === id);
    if (!product) return;
    state.cart.set(id, (state.cart.get(id) || 0) + 1);
    renderBag();
    const countEl = $("#bagCount");
    countEl.classList.add("is-bumped");
    window.setTimeout(() => countEl.classList.remove("is-bumped"), 280);
    showToast(`${product.name} added to your bag.`);
    openBag();
  }

  function updateCartItem(id, action) {
    if (!state.cart.has(id)) return;
    if (action === "remove") {
      state.cart.delete(id);
    } else {
      const current = state.cart.get(id);
      const next = action === "plus" ? current + 1 : current - 1;
      if (next <= 0) state.cart.delete(id);
      else state.cart.set(id, next);
    }
    renderBag();
  }

  /* Toast + clipboard -------------------------------------------------- */
  let toastTimer;
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch (error) { /* no-op */ }
    area.remove();
  }

  async function copyText(text, message) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
    } catch (error) {
      fallbackCopy(text);
    }
    showToast(message);
  }

  function copyPalette() {
    const lines = state.palette.map((entry) =>
      `${entry.role}: ${entry.name} ${entry.hex}`
    );
    copyText(`WooBi palette — ${state.selected.name}\n${lines.join("\n")}`, "Palette copied — five shades ready to share.");
  }

  /* Drawers and overlays ---------------------------------------------- */
  const searchOverlay = $("#searchOverlay");
  const bagDrawer = $("#bagDrawer");
  const menuDrawer = $("#menuDrawer");
  const drawerScrim = $("#drawerScrim");

  function syncScrollLock() {
    const locked =
      !searchOverlay.hidden ||
      bagDrawer.classList.contains("is-open") ||
      menuDrawer.classList.contains("is-open");
    document.body.classList.toggle("no-scroll", locked);
  }

  function updateScrim() {
    const visible =
      bagDrawer.classList.contains("is-open") ||
      menuDrawer.classList.contains("is-open");
    drawerScrim.classList.toggle("is-visible", visible);
    syncScrollLock();
  }

  function openBag() {
    if (!searchOverlay.hidden) closeSearch(false);
    if (menuDrawer.classList.contains("is-open")) closeMenu(false);
    state.lastFocus = document.activeElement;
    bagDrawer.classList.add("is-open");
    bagDrawer.setAttribute("aria-hidden", "false");
    updateScrim();
    window.setTimeout(() => $("#bagClose").focus(), 50);
  }

  function closeBag(restoreFocus = true) {
    bagDrawer.classList.remove("is-open");
    bagDrawer.setAttribute("aria-hidden", "true");
    updateScrim();
    if (restoreFocus && state.lastFocus) state.lastFocus.focus();
  }

  function openMenu() {
    if (!searchOverlay.hidden) closeSearch(false);
    if (bagDrawer.classList.contains("is-open")) closeBag(false);
    state.lastFocus = document.activeElement;
    menuDrawer.classList.add("is-open");
    menuDrawer.setAttribute("aria-hidden", "false");
    $("#menuToggle").setAttribute("aria-expanded", "true");
    updateScrim();
    window.setTimeout(() => $("#menuClose").focus(), 50);
  }

  function closeMenu(restoreFocus = true) {
    menuDrawer.classList.remove("is-open");
    menuDrawer.setAttribute("aria-hidden", "true");
    $("#menuToggle").setAttribute("aria-expanded", "false");
    updateScrim();
    if (restoreFocus && state.lastFocus) state.lastFocus.focus();
  }

  function openSearch() {
    if (bagDrawer.classList.contains("is-open")) closeBag(false);
    if (menuDrawer.classList.contains("is-open")) closeMenu(false);
    state.lastFocus = document.activeElement;
    searchOverlay.hidden = false;
    syncScrollLock();
    renderSearchResults("");
    window.setTimeout(() => $("#searchInput").focus(), 50);
  }

  function closeSearch(restoreFocus = true) {
    if (searchOverlay.hidden) return;
    searchOverlay.hidden = true;
    syncScrollLock();
    if (restoreFocus && state.lastFocus) state.lastFocus.focus();
  }

  function activeDialog() {
    if (!searchOverlay.hidden) return searchOverlay;
    if (bagDrawer.classList.contains("is-open")) return bagDrawer;
    if (menuDrawer.classList.contains("is-open")) return menuDrawer;
    return null;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!searchOverlay.hidden) closeSearch();
      else if (bagDrawer.classList.contains("is-open")) closeBag();
      else if (menuDrawer.classList.contains("is-open")) closeMenu();
    }
    if (event.key !== "Tab") return;
    const dialog = activeDialog();
    if (!dialog) return;
    const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', dialog)
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* Search ------------------------------------------------------------- */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function matchingProducts(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter((product) =>
      [product.name, product.colour, product.category, product.tag]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  function renderSearchResults(query) {
    const container = $("#searchResults");
    const q = query.trim();
    if (!q) {
      const popular = ["Wrap dress", "Blazer", "Knit", "Olive", "Tailoring"];
      container.innerHTML = `
        <p class="search-results__label">Popular searches</p>
        <div class="search-suggestions">
          ${popular.map((term) => `<button class="search-suggestion" type="button" data-search-term="${term}">${term}</button>`).join("")}
        </div>
      `;
      return;
    }
    const results = matchingProducts(q);
    if (!results.length) {
      container.innerHTML = `<p class="search-empty">No pieces match “${escapeHtml(q)}”. Try “dress”, “blazer” or a colour like “olive”.</p>`;
      return;
    }
    container.innerHTML = `
      <p class="search-results__label">${results.length} ${results.length === 1 ? "piece" : "pieces"} found</p>
      <div class="search-result-list">
        ${results.map((product) => `
          <button class="search-result" type="button" data-result-id="${product.id}">
            <span class="search-result__swatch" style="--dot:${product.hex}"></span>
            <span class="search-result__text">
              <span class="search-result__name">${product.name}</span>
              <span class="search-result__meta">${product.colour} · ${product.category}</span>
            </span>
            <span class="search-result__price">${formatPrice(product.price)}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  function openProduct(id) {
    const card = document.getElementById(`product-${id}`);
    if (!card) return;
    window.setTimeout(() => {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("is-highlighted");
      window.setTimeout(() => card.classList.remove("is-highlighted"), 1800);
    }, 80);
  }

  /* Events ------------------------------------------------------------- */
  function bindEvents() {
    $("#swatchGrid").addEventListener("click", (event) => {
      const swatch = event.target.closest(".swatch");
      if (!swatch) return;
      selectColour(swatch.dataset.hex, swatch.dataset.name);
    });

    $("#wheelDots").addEventListener("click", (event) => {
      const dot = event.target.closest(".wheel-dot");
      if (!dot) return;
      selectColour(dot.dataset.hex, dot.dataset.name);
    });

    $("#paletteGrid").addEventListener("click", (event) => {
      const card = event.target.closest(".palette-card");
      if (!card) return;
      selectColour(card.dataset.hex, card.dataset.name);
    });

    $("#wheelCenter").addEventListener("click", () => {
      $("#colour-studio").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#customColour").addEventListener("input", (event) => {
      selectColour(event.target.value);
    });

    $("#copyHex").addEventListener("click", () => {
      copyText(state.selected.hex, `Copied ${state.selected.name} — ${state.selected.hex}.`);
    });
    $("#copyPalette").addEventListener("click", copyPalette);

    $("#outfitGrid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-look]");
      if (!button) return;
      const id = button.dataset.look;
      const outfit = OUTFITS.find((item) => item.id === id);
      if (!outfit) return;
      if (state.savedLooks.has(id)) {
        state.savedLooks.delete(id);
        showToast(`${outfit.title} removed from your moodboard.`);
      } else {
        state.savedLooks.add(id);
        showToast(`${outfit.title} saved to your moodboard.`);
      }
      const saved = state.savedLooks.has(id);
      button.setAttribute("aria-pressed", String(saved));
      button.querySelector("span").textContent = saved ? "Saved to moodboard" : "Save this look";
    });

    $("#productGrid").addEventListener("click", (event) => {
      const add = event.target.closest("[data-add]");
      if (add) {
        addToBag(add.dataset.add);
        return;
      }
      const wish = event.target.closest("[data-wishlist]");
      if (wish) toggleWishlist(wish.dataset.wishlist);
    });

    $("#bagToggle").addEventListener("click", openBag);
    $("#bagClose").addEventListener("click", () => closeBag());
    $("#menuToggle").addEventListener("click", openMenu);
    $("#menuClose").addEventListener("click", () => closeMenu());
    $("#searchToggle").addEventListener("click", openSearch);
    $("#searchClose").addEventListener("click", () => closeSearch());
    drawerScrim.addEventListener("click", () => {
      if (bagDrawer.classList.contains("is-open")) closeBag();
      if (menuDrawer.classList.contains("is-open")) closeMenu();
    });

    $$(".menu-nav a").forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });

    $("#bagItems").addEventListener("click", (event) => {
      const explore = event.target.closest("[data-explore]");
      if (explore) {
        closeBag(false);
        $("#edit").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const actionButton = event.target.closest("[data-cart-action]");
      if (!actionButton) return;
      const row = actionButton.closest("[data-id]");
      if (!row) return;
      updateCartItem(row.dataset.id, actionButton.dataset.cartAction);
    });

    $("#checkoutButton").addEventListener("click", () => {
      if (!state.cart.size) return;
      showToast("Checkout is a preview in this WooBi concept — no payment is taken.");
    });

    $("#searchInput").addEventListener("input", (event) => {
      renderSearchResults(event.target.value);
    });

    $("#searchForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const query = $("#searchInput").value;
      const results = matchingProducts(query);
      if (results.length) {
        closeSearch(false);
        openProduct(results[0].id);
      } else {
        renderSearchResults(query);
      }
    });

    $("#searchResults").addEventListener("click", (event) => {
      const suggestion = event.target.closest("[data-search-term]");
      if (suggestion) {
        const input = $("#searchInput");
        input.value = suggestion.dataset.searchTerm;
        renderSearchResults(input.value);
        input.focus();
        return;
      }
      const result = event.target.closest("[data-result-id]");
      if (!result) return;
      const id = result.dataset.resultId;
      closeSearch(false);
      openProduct(id);
    });

    $("#newsletterForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#newsletterEmail");
      const message = $("#newsletterMessage");
      const email = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      message.classList.remove("is-success");
      if (!valid) {
        input.setAttribute("aria-invalid", "true");
        message.textContent = "Please enter a valid email address.";
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      message.textContent = "You’re on the list. A little colour is on its way.";
      message.classList.add("is-success");
      event.target.reset();
    });

    const header = $("#siteHeader");
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const navLinks = $$(".main-nav a");
    const sectionIds = ["colour-studio", "outfits", "edit", "journal"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if ("IntersectionObserver" in window) {
      const visible = new Set();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        const active = sectionIds.find((id) => visible.has(id)) || null;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${active}`);
        });
      }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });
      sections.forEach((section) => observer.observe(section));
    }
  }

  function init() {
    renderSwatches();
    renderWheel();
    renderMenuSwatches();
    renderProducts();
    selectColour(state.selected.hex, state.selected.name);
    renderBag();
    bindEvents();
  }

  init();
})();
