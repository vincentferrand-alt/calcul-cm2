// Créatures originales (SVG). Dans cette première version : l'œuf mascotte.
export function eggSVG({ a = "#ffd75e", b = "#ffb703", spot = "#3aa6b9", uid = "egg" } = {}) {
  return `
<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Un œuf">
  <defs>
    <radialGradient id="${uid}-g" cx="35%" cy="30%" r="80%">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </radialGradient>
  </defs>
  <ellipse cx="100" cy="236" rx="62" ry="10" fill="#000" opacity=".18"/>
  <path d="M100 18C150 18 176 100 176 152C176 202 142 228 100 228C58 228 24 202 24 152C24 100 50 18 100 18Z" fill="url(#${uid}-g)"/>
  <circle cx="70" cy="150" r="13" fill="${spot}" opacity=".85"/>
  <circle cx="128" cy="120" r="9" fill="${spot}" opacity=".85"/>
  <circle cx="122" cy="176" r="15" fill="${spot}" opacity=".85"/>
  <circle cx="86" cy="96" r="6" fill="${spot}" opacity=".85"/>
  <ellipse cx="72" cy="68" rx="12" ry="22" transform="rotate(25 72 68)" fill="#fff" opacity=".55"/>
</svg>`;
}
