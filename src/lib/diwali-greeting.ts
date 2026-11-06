import diyaImageUrl from "@/assets/praavi-diya.png";
import logoImageUrl from "@/assets/praavi-logo.png";

export const GREETING_NAME_LIMIT = 36;
export const GREETING_CARD_WIDTH = 1080;
export const GREETING_CARD_HEIGHT = 1350;

export function sanitizeGreetingName(value: string): string {
  return Array.from(
    value
      .normalize("NFC")
      .replace(/[\p{Cc}\p{Cf}]/gu, "")
      .replace(/[^\p{L}\p{M}\p{N} .’'\-]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim(),
  )
    .slice(0, GREETING_NAME_LIMIT)
    .join("")
    .normalize("NFC");
}

export function createGreetingFilename(name: string): string {
  const safeName = sanitizeGreetingName(name)
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/gu, "")
    .replace(/[^\p{L}\p{M}\p{N}-]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");

  return `Praavi-Diwali-Wishes-${safeName || "Friend"}.png`;
}

function readPalette() {
  const styles = getComputedStyle(document.documentElement);
  return {
    black: styles.getPropertyValue("--praavi-black").trim(),
    charcoal: styles.getPropertyValue("--praavi-charcoal").trim(),
    gold: styles.getPropertyValue("--praavi-gold").trim(),
    richGold: styles.getPropertyValue("--praavi-rich-gold").trim(),
    amber: styles.getPropertyValue("--praavi-amber").trim(),
    rose: styles.getPropertyValue("--praavi-rose").trim(),
    ivory: styles.getPropertyValue("--praavi-ivory").trim(),
    muted: styles.getPropertyValue("--praavi-muted").trim(),
  };
}

function fitCenterText(
  context: CanvasRenderingContext2D,
  text: string,
  preferredSize: number,
  maxWidth: number,
  family: string,
): number {
  let size = preferredSize;
  context.font = `500 ${size}px ${family}`;
  while (context.measureText(text).width > maxWidth && size > 34) {
    size -= 2;
    context.font = `500 ${size}px ${family}`;
  }
  return size;
}

function drawOrnament(context: CanvasRenderingContext2D, centerX: number, centerY: number, color: string) {
  context.save();
  context.translate(centerX, centerY);
  context.strokeStyle = color;
  context.lineWidth = 1.4;

  [18, 30, 43].forEach((radius) => {
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.globalAlpha = radius === 30 ? 0.38 : 0.62;
    context.stroke();
  });

  for (let index = 0; index < 8; index += 1) {
    context.rotate(Math.PI / 4);
    context.globalAlpha = 0.7;
    context.beginPath();
    context.ellipse(0, -30, 8, 16, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(0, -47, 2.2, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  }
  context.restore();
  context.globalAlpha = 1;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/u);
  let line = "";
  let lineNumber = 0;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      context.fillText(line, centerX, startY + lineNumber * lineHeight);
      lineNumber += 1;
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) context.fillText(line, centerX, startY + lineNumber * lineHeight);
}

export async function renderGreetingCard(canvas: HTMLCanvasElement, name: string): Promise<void> {
  canvas.width = GREETING_CARD_WIDTH;
  canvas.height = GREETING_CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Greeting canvas is unavailable");

  const palette = readPalette();
  const serif = '"Cormorant Garamond", "Noto Serif Devanagari", Georgia, serif';
  const sans = '"DM Sans", "Noto Serif Devanagari", sans-serif';
  await Promise.all([
    document.fonts.load(`500 78px ${serif}`),
    document.fonts.load(`400 27px ${sans}`),
    document.fonts.ready,
  ]);

  const image = new Image();
  image.src = diyaImageUrl;
  const logo = new Image();
  logo.src = logoImageUrl;
  await Promise.all([image.decode(), logo.decode()]);

  const background = context.createLinearGradient(0, 0, GREETING_CARD_WIDTH, GREETING_CARD_HEIGHT);
  background.addColorStop(0, palette.black || "#080808");
  background.addColorStop(0.56, palette.charcoal || "#15120f");
  background.addColorStop(1, palette.black || "#080808");
  context.fillStyle = background;
  context.fillRect(0, 0, GREETING_CARD_WIDTH, GREETING_CARD_HEIGHT);

  const glow = context.createRadialGradient(540, 585, 26, 540, 585, 430);
  glow.addColorStop(0, "oklch(0.78 0.15 79 / 0.14)");
  glow.addColorStop(0.52, "oklch(0.66 0.12 69 / 0.06)");
  glow.addColorStop(1, "oklch(0.5 0.1 69 / 0)");
  context.fillStyle = glow;
  context.fillRect(70, 100, 940, 900);

  for (let index = 0; index < 250; index += 1) {
    const x = 54 + ((index * 137) % 972);
    const y = 48 + ((index * 223) % 1254);
    const radius = index % 9 === 0 ? 1.6 : 0.7;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = palette.gold || "#d6b46a";
    context.globalAlpha = index % 9 === 0 ? 0.18 : 0.055;
    context.fill();
  }
  context.globalAlpha = 1;

  context.strokeStyle = palette.gold || "#d6b46a";
  context.lineWidth = 1.2;
  context.globalAlpha = 0.42;
  context.strokeRect(34, 34, 1012, 1282);
  context.globalAlpha = 0.16;
  context.strokeRect(44, 44, 992, 1262);
  context.globalAlpha = 1;

  const corners = [
    [55, 55, 1, 1],
    [1025, 55, -1, 1],
    [55, 1295, 1, -1],
    [1025, 1295, -1, -1],
  ];
  context.strokeStyle = palette.richGold || "#f4c76a";
  context.lineWidth = 2;
  context.globalAlpha = 0.65;
  for (const [x, y, horizontal, vertical] of corners) {
    if (x === undefined || y === undefined || horizontal === undefined || vertical === undefined) continue;
    context.beginPath();
    context.moveTo(x, y + vertical * 27);
    context.lineTo(x, y);
    context.lineTo(x + horizontal * 27, y);
    context.stroke();
  }
  context.globalAlpha = 1;

  context.textAlign = "center";
  context.textBaseline = "middle";
  const logoWidth = 250;
  const logoHeight = logoWidth * logo.naturalHeight / logo.naturalWidth;
  context.drawImage(logo, (GREETING_CARD_WIDTH - logoWidth) / 2, 100 - logoHeight / 2, logoWidth, logoHeight);

  context.strokeStyle = palette.gold || "#d6b46a";
  context.globalAlpha = 0.45;
  context.beginPath();
  context.moveTo(472, 165);
  context.lineTo(608, 165);
  context.stroke();
  context.globalAlpha = 1;

  context.fillStyle = palette.muted || "#b8aa8c";
  context.font = `400 17px ${sans}`;
  context.fillText("C E L E B R A T I N G   T H E   F E S T I V A L   O F   L I G H T S", 540, 205);
  drawOrnament(context, 540, 272, palette.gold || "#d6b46a");

  context.fillStyle = palette.richGold || "#f4c76a";
  context.shadowColor = palette.amber || "#ff9f43";
  context.shadowBlur = 26;
  context.font = `500 87px ${serif}`;
  context.fillText("Happy Diwali", 540, 372);
  context.shadowBlur = 0;

  context.fillStyle = palette.muted || "#b8aa8c";
  context.font = `400 23px ${sans}`;
  context.fillText("Warm Diwali wishes to", 540, 445);

  const nameSize = fitCenterText(context, name, 62, 865, `500 ${62}px ${serif}`.replace("500 62px", "500 $SIZEpx"));
  context.font = `500 ${nameSize}px ${serif}`;
  context.fillStyle = palette.ivory || "#fff5e6";
  context.shadowColor = palette.gold || "#d6b46a";
  context.shadowBlur = 18;
  context.fillText(name, 540, 512);
  context.shadowBlur = 0;

  context.save();
  context.shadowColor = palette.amber || "#ff9f43";
  context.shadowBlur = 45;
  context.drawImage(image, 350, 536, 380, 380);
  context.restore();

  context.fillStyle = palette.ivory || "#fff5e6";
  context.globalAlpha = 0.91;
  context.font = `400 25px ${sans}`;
  drawWrappedText(
    context,
    "May this Diwali bring happiness to your home, prosperity to your endeavors, and new opportunities to your journey.",
    540,
    954,
    830,
    36,
  );

  context.globalAlpha = 0.8;
  context.font = `400 22px ${serif}`;
  context.fillStyle = palette.gold || "#d6b46a";
  drawWrappedText(context, "Here's to brighter beginnings and greater achievements together.", 540, 1040, 830, 32);
  context.globalAlpha = 1;

  context.fillStyle = palette.ivory || "#fff5e6";
  context.font = `400 22px ${serif}`;
  context.fillText("With warm regards", 540, 1101);
  context.fillStyle = palette.richGold || "#f4c76a";
  context.font = `500 28px ${serif}`;
  context.fillText("Team Praavi Consultants", 540, 1138);

  context.strokeStyle = palette.gold || "#d6b46a";
  context.globalAlpha = 0.34;
  context.beginPath();
  context.moveTo(294, 1192);
  context.lineTo(786, 1192);
  context.stroke();
  context.globalAlpha = 1;
  context.fillStyle = palette.muted || "#b8aa8c";
  context.font = `400 14px ${sans}`;
  context.fillText("Digital Marketing   ·   Web Development   ·   Creative Solutions", 540, 1232);
  context.fillStyle = palette.gold || "#d6b46a";
  context.font = `400 13px ${sans}`;
  context.fillText("PRAAVI CONSULTANTS", 540, 1265);
}
