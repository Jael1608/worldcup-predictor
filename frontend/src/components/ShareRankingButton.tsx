import { Standing } from "../types";

const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const fitText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (context.measureText(text).width <= maxWidth) return text;
  let shortened = text;
  while (shortened.length > 1 && context.measureText(`${shortened}...`).width > maxWidth) shortened = shortened.slice(0, -1);
  return `${shortened}...`;
};

const createRankingImage = async (standings: Standing[], title: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(1, "#173b73");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(96, 165, 250, 0.10)";
  context.beginPath();
  context.arc(920, 80, 280, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(37, 99, 235, 0.12)";
  context.beginPath();
  context.arc(80, 1290, 320, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "#60a5fa";
  context.font = "700 25px Arial";
  context.fillText("QUINIELA MUNDIAL 2026", 540, 48);
  context.fillStyle = "#f8fafc";
  context.font = "700 50px Arial";
  context.fillText(title, 540, 103);
  context.fillStyle = "#94a3b8";
  context.font = "22px Arial";
  context.fillText(new Date().toLocaleString(), 540, 140);

  const tableX = 34;
  const tableWidth = 1012;
  const headerY = 170;
  const headerHeight = 64;
  const rowsStart = headerY + headerHeight + 12;
  const bottomMargin = 28;
  const availableRowsHeight = canvas.height - rowsStart - bottomMargin;
  const rowHeight = Math.floor(availableRowsHeight / Math.max(standings.length, 1));
  const columns = {
    position: tableX + 30,
    player: tableX + 105,
    points: tableX + 625,
    exact: tableX + 755,
    winners: tableX + 905
  };

  const headerGradient = context.createLinearGradient(tableX, headerY, tableX + tableWidth, headerY);
  headerGradient.addColorStop(0, "#1d4ed8");
  headerGradient.addColorStop(1, "#2563eb");
  context.fillStyle = headerGradient;
  roundedRect(context, tableX, headerY, tableWidth, headerHeight, 18);
  context.fill();
  context.fillStyle = "#dbeafe";
  context.font = "700 20px Arial";
  context.textAlign = "left";
  context.fillText("#", columns.position, headerY + 41);
  context.fillText("JUGADOR", columns.player, headerY + 41);
  context.textAlign = "center";
  context.fillText("PUNTOS", columns.points, headerY + 41);
  context.fillText("EXACTOS", columns.exact, headerY + 41);
  context.fillText("GANADORES", columns.winners, headerY + 41);

  standings.forEach((standing, index) => {
    const y = rowsStart + index * rowHeight;
    const rowGradient = context.createLinearGradient(tableX, y, tableX + tableWidth, y);
    if (index === 0) {
      rowGradient.addColorStop(0, "rgba(113, 63, 18, 0.92)");
      rowGradient.addColorStop(1, "rgba(250, 204, 21, 0.16)");
    } else if (index === 1) {
      rowGradient.addColorStop(0, "rgba(51, 65, 85, 0.96)");
      rowGradient.addColorStop(1, "rgba(203, 213, 225, 0.10)");
    } else if (index === 2) {
      rowGradient.addColorStop(0, "rgba(124, 45, 18, 0.85)");
      rowGradient.addColorStop(1, "rgba(251, 146, 60, 0.10)");
    } else {
      rowGradient.addColorStop(0, index % 2 === 0 ? "rgba(15, 23, 42, 0.90)" : "rgba(30, 41, 59, 0.88)");
      rowGradient.addColorStop(1, "rgba(30, 64, 175, 0.12)");
    }
    context.fillStyle = rowGradient;
    roundedRect(context, tableX, y, tableWidth, rowHeight - 7, 16);
    context.fill();

    if (index < 3) {
      context.fillStyle = ["#fde047", "#e2e8f0", "#fdba74"][index];
      roundedRect(context, tableX + 16, y + 14, 48, rowHeight - 35, 13);
      context.fill();
    }

    const fontSize = Math.max(20, Math.min(32, rowHeight - 28));
    const baseline = y + (rowHeight - 7) / 2 + fontSize / 3;
    context.font = `700 ${fontSize}px Arial`;
    context.fillStyle = index < 3 ? "#07111f" : "#bfdbfe";
    context.textAlign = "left";
    context.fillText(`${index + 1}`, columns.position, baseline);
    context.fillStyle = "#f8fafc";
    context.fillText(fitText(context, standing.name, 455), columns.player, baseline);
    context.textAlign = "center";
    context.fillStyle = index === 0 ? "#fde047" : "#dbeafe";
    context.fillText(`${standing.totalPoints}`, columns.points, baseline);
    context.fillStyle = "#f8fafc";
    context.fillText(`${standing.exactScores}`, columns.exact, baseline);
    context.fillText(`${standing.winnerHits}`, columns.winners, baseline);
  });

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen")), "image/png")
  );
};

export const ShareRankingButton = ({ standings, title }: { standings: Standing[]; title: string }) => {
  const share = async () => {
    const blob = await createRankingImage(standings, title);
    const file = new File([blob], "tabla-quiniela-mundial-2026.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Tabla Quiniela Mundial 2026", text: title, files: [file] });
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
    window.open(`https://wa.me/?text=${encodeURIComponent(`Tabla Quiniela Mundial 2026 - ${title}. Adjunta la imagen descargada.`)}`, "_blank");
  };
  return <button className="button-secondary" onClick={() => void share()}>Compartir tabla por WhatsApp</button>;
};
