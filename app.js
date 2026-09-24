/*
 * Name: Pin Hung Chiang | Date: September 24, 2026
 * Program: Metric and imperial unit converter.
 * Input: Users choose a conversion category and direction, then enter one number or a comma/newline-separated list.
 * Processing: The form validates every value and passes numbers to a higher-order conversion function.
 * Output: The page displays each converted number with its original value and the appropriate unit labels.
 * Invalid input shows a clear message without displaying a partial conversion result.
 */

// Conversion functions: the outer function selects and returns an arrow function.
function createConverter(fromUnit, toUnit) {
  const conversions = {
    kg: { lb: value => value * 2.2046226218 },
    lb: { kg: value => value / 2.2046226218 },
    km: { mi: value => value / 1.609344 },
    mi: { km: value => value * 1.609344 },
    c: { f: value => value * 9 / 5 + 32 },
    f: { c: value => (value - 32) * 5 / 9 }
  };

  if (fromUnit === toUnit && Object.hasOwn(conversions, fromUnit)) {
    return input => Array.isArray(input) ? input.map(value => value) : input;
  }

  const convertOne = conversions[fromUnit]?.[toUnit];
  if (!convertOne) throw new Error("Unsupported unit conversion.");
  return input => Array.isArray(input) ? input.map(convertOne) : convertOne(input);
}

const categories = {
  weight: { title: "Weight", description: "Convert between kilograms and pounds.", units: [["kg", "Kilograms (kg)"], ["lb", "Pounds (lb)"]] },
  distance: { title: "Distance", description: "Convert between kilometres and miles.", units: [["km", "Kilometres (km)"], ["mi", "Miles (mi)"]] },
  temperature: { title: "Temperature", description: "Convert between Celsius and Fahrenheit.", units: [["c", "Celsius (°C)"], ["f", "Fahrenheit (°F)"]] }
};
const symbols = { kg: "kg", lb: "lb", km: "km", mi: "mi", c: "°C", f: "°F" };

const tabs = [...document.querySelectorAll(".category-tab")];
const form = document.getElementById("converter-form");
const fromSelect = document.getElementById("from-unit");
const toSelect = document.getElementById("to-unit");
const input = document.getElementById("input-values");
const error = document.getElementById("input-error");
const results = document.getElementById("results");
const count = document.getElementById("result-count");

function clearResults() {
  error.textContent = "";
  error.classList.add("hidden");
  input.setAttribute("aria-invalid", "false");
  results.textContent = "Enter a value above to see its conversion.";
  count.textContent = "";
}

// Tab and unit controls: each category offers both conversion directions.
function selectCategory(categoryName) {
  const category = categories[categoryName];
  document.getElementById("category-title").textContent = category.title;
  document.getElementById("category-description").textContent = category.description;
  for (const select of [fromSelect, toSelect]) {
    select.replaceChildren(...category.units.map(([value, label]) => new Option(label, value)));
  }
  toSelect.selectedIndex = 1;
  tabs.forEach(tab => {
    const active = tab.dataset.category === categoryName;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    tab.classList.toggle("border-teal-300", active);
    tab.classList.toggle("text-teal-200", active);
    tab.classList.toggle("border-transparent", !active);
    tab.classList.toggle("text-slate-400", !active);
  });
  document.getElementById("converter-panel").setAttribute("aria-labelledby", `tab-${categoryName}`);
  input.value = "";
  clearResults();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectCategory(tab.dataset.category));
  tab.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
      (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    selectCategory(tabs[nextIndex].dataset.category);
  });
});

document.getElementById("swap-units").addEventListener("click", () => {
  [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
  clearResults();
});
fromSelect.addEventListener("change", () => { toSelect.value = [...toSelect.options].find(option => option.value !== fromSelect.value).value; clearResults(); });
toSelect.addEventListener("change", () => { fromSelect.value = [...fromSelect.options].find(option => option.value !== toSelect.value).value; clearResults(); });
input.addEventListener("input", clearResults);

// Input validation and output: convert only after all entered values are valid.
function showError(message) {
  error.textContent = message;
  error.classList.remove("hidden");
  input.setAttribute("aria-invalid", "true");
  results.textContent = "Correct the input above to see results.";
  count.textContent = "";
}

function formatNumber(value) {
  const rounded = Math.abs(value) < 0.0000005 ? 0 : value;
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 6 }).format(rounded);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  clearResults();
  const raw = input.value.trim();
  if (!raw) return showError("Enter at least one number to convert.");

  const pieces = raw.split(/[,\n]/).map(piece => piece.trim());
  if (pieces.some(piece => !piece || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(piece))) {
    return showError("Use valid numbers separated by commas or new lines, such as 10, -2.5, 30.");
  }
  const numbers = pieces.map(Number);
  if (numbers.some(value => !Number.isFinite(value))) return showError("One of the numbers is too large to convert.");

  const convert = createConverter(fromSelect.value, toSelect.value);
  const converted = convert(numbers.length === 1 ? numbers[0] : numbers);
  const outputs = Array.isArray(converted) ? converted : [converted];
  if (outputs.some(value => !Number.isFinite(value))) return showError("A result is too large to display.");

  const list = document.createElement("ol");
  list.className = "divide-y divide-slate-700";
  outputs.forEach((value, index) => {
    const item = document.createElement("li");
    item.className = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0";
    const original = document.createElement("span");
    original.className = "text-slate-400";
    original.textContent = `${formatNumber(numbers[index])} ${symbols[fromSelect.value]}`;
    const result = document.createElement("strong");
    result.className = "text-lg font-semibold text-teal-200";
    result.textContent = `${formatNumber(value)} ${symbols[toSelect.value]}`;
    item.append(original, result);
    list.append(item);
  });
  results.replaceChildren(list);
  count.textContent = `${numbers.length} ${numbers.length === 1 ? "value" : "values"}`;
});

selectCategory("weight");
