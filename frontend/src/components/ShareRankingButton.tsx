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

  context.textAlign = "center";
  context.fillStyle = "#60a5fa";
  context.font = "700 28px Arial";
  context.fillText("QUINIELA MUNDIAL 2026", 540, 60);
  context.fillStyle = "#f8fafc";
  context.font = "700 52px Arial";
  context.fillText(title, 540, 122);
  context.fillStyle = "#94a3b8";
  context.font = "24px Arial";
  context.fillText(new Date().toLocaleString(), 540, 164);

  const tableX = 50;
  const tableWidth = 980;
  const headerY = 205;
  const headerHeight = 58;
  const availableRowsHeight = 1035;
  const rowHeight = Math.min(60, Math.floor(availableRowsHeight / Math.max(standings.length, 1)));
  const columns = {
    position: tableX + 28,
    player: tableX + 100,
    points: tableX + 670,
    exact: tableX + 790,
    winners: tableX + 915
  };

  context.fillStyle = "#1d4ed8";
  roundedRect(context, tableX, headerY, tableWidth, headerHeight, 18);
  context.fill();
  context.fillStyle = "#dbeafe";
  context.font = "700 21px Arial";
  context.textAlign = "left";
  context.fillText("#", columns.position, headerY + 37);
  context.fillText("JUGADOR", columns.player, headerY + 37);
  context.textAlign = "center";
  context.fillText("PTS", columns.points, headerY + 37);
  context.fillText("EXACTOS", columns.exact, headerY + 37);
  context.fillText("GANADORES", columns.winners, headerY + 37);

  standings.forEach((standing, index) => {
    const y = headerY + headerHeight + 10 + index * rowHeight;
    context.fillStyle = index === 0
      ? "rgba(250, 204, 21, 0.20)"
      : index % 2 === 0 ? "rgba(15, 23, 42, 0.72)" : "rgba(30, 41, 59, 0.72)";
    roundedRect(context, tableX, y, tableWidth, rowHeight - 6, 13);
    context.fill();

    const fontSize = Math.max(20, Math.min(27, rowHeight - 24));
    context.font = `700 ${fontSize}px Arial`;
    context.fillStyle = index === 0 ? "#fde047" : "#f8fafc";
    context.textAlign = "left";
    context.fillText(`${index + 1}`, columns.position, y + rowHeight / 2 + fontSize / 3 - 3);
    context.fillText(fitText(context, standing.name, 500), columns.player, y + rowHeight / 2 + fontSize / 3 - 3);
    context.textAlign = "center";
    context.fillText(`${standing.totalPoints}`, columns.points, y + rowHeight / 2 + fontSize / 3 - 3);
    context.fillText(`${standing.exactScores}`, columns.exact, y + rowHeight / 2 + fontSize / 3 - 3);
    context.fillText(`${standing.winnerHits}`, columns.winners, y + rowHeight / 2 + fontSize / 3 - 3);
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
