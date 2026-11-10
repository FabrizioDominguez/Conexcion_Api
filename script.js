const API_ENDPOINTS = {
  quote: "https://dummyjson.com/quotes/random",
  dog: "https://dog.ceo/api/breeds/image/random",
  cat: "https://cataas.com/cat?json=true",
  fact: "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en",
};

const sections = {
  quote: { result: document.querySelector("#quote-result"), button: document.querySelector("#quote-button"), load: fetchQuote },
  dog: { result: document.querySelector("#dog-result"), button: document.querySelector("#dog-button"), load: fetchDog },
  cat: { result: document.querySelector("#cat-result"), button: document.querySelector("#cat-button"), load: fetchCat },
  fact: { result: document.querySelector("#fact-result"), button: document.querySelector("#fact-button"), load: fetchFact },
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`La solicitud respondió con el estado ${response.status}.`);
  return response.json();
}

async function fetchQuote() {
  const data = await fetchJson(API_ENDPOINTS.quote);
  if (!data.quote || !data.author) throw new Error("La API no devolvió una cita completa.");
  return `<p class="quote-text">“${escapeHtml(data.quote)}”</p><p class="quote-author">— ${escapeHtml(data.author)}</p>`;
}

async function fetchDog() {
  const data = await fetchJson(API_ENDPOINTS.dog);
  if (!data.message) throw new Error("La API no devolvió la imagen del perro.");
  return imageMarkup(data.message, "Un perro", "No se pudo cargar la imagen del perro.");
}

async function fetchCat() {
  const data = await fetchJson(API_ENDPOINTS.cat);
  if (!data.id) throw new Error("La API no devolvió el identificador del gato.");
  const imageUrl = `https://cataas.com/cat/${encodeURIComponent(data.id)}`;
  return imageMarkup(imageUrl, "Un gato", "No se pudo cargar la imagen del gato.");
}

async function fetchFact() {
  const data = await fetchJson(API_ENDPOINTS.fact);
  if (!data.text) throw new Error("La API no devolvió un dato curioso.");
  return `<p class="fact-text">${escapeHtml(data.text)}</p>`;
}

function imageMarkup(url, alt, failureMessage) {
  const safeUrl = escapeHtml(url);
  return `<img class="result-image" src="${safeUrl}" alt="${alt}" loading="lazy" data-image-error="${failureMessage}">`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

async function loadSection(section) {
  section.button.disabled = true;
  section.result.setAttribute("aria-busy", "true");
  section.result.innerHTML = '<p class="loading">Cargando…</p>';
  try {
    section.result.innerHTML = await section.load();
    const image = section.result.querySelector("img");
    if (image) image.addEventListener("error", () => {
      section.result.innerHTML = `<p class="error-message">${image.dataset.imageError} Puedes volver a intentarlo.</p>`;
    }, { once: true });
  } catch (error) {
    console.error(error);
    section.result.innerHTML = '<p class="error-message">No se pudo obtener el contenido. Comprueba tu conexión e inténtalo de nuevo.</p>';
  } finally {
    section.button.disabled = false;
    section.result.setAttribute("aria-busy", "false");
  }
}

for (const section of Object.values(sections)) {
  section.button.addEventListener("click", () => loadSection(section));
}

// Las consultas iniciales se ejecutan de forma independiente: un fallo no bloquea las demás.
void Promise.allSettled(Object.values(sections).map(loadSection));
