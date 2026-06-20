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
  canvas.height = 1920;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(0.55, "#102849");
  gradient.addColorStop(1, "#173b73");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#60a5fa";
  context.font = "700 30px Arial";
  context.textAlign = "center";
  context.fillText("QUINIELA MUNDIAL 2026", 540, 78);
  context.fillStyle = "#f8fafc";
  context.font = "700 58px Arial";
  context.fillText(title, 540, 150);
  context.fillStyle = "#94a3b8";
  context.font = "26px Arial";
  context.fillText(new Date().toLocaleString(), 540, 200);

  const top = standings.slice(0, 3);
  const podium = [
    { standing: top[1], place: "2", x: 100, y: 430, width: 280, height: 250, color: "#cbd5e1", background: "#334155" },
    { standing: top[0], place: "1", x: 400, y: 320, width: 280, height: 360, color: "#fde047", background: "#713f12" },
    { standing: top[2], place: "3", x: 700, y: 500, width: 280, height: 180, color: "#fdba74", background: "#7c2d12" }
  ];

  context.fillStyle = "#bfdbfe";
  context.font = "700 28px Arial";
  context.fillText("PODIO TOP 3", 540, 268);
  podium.forEach(({ standing, place, x, y, width, height, color, background }) => {
    if (!standing) return;
    context.fillStyle = background;
    roundedRect(context, x, y, width, height, 28);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = color;
    context.font = "700 58px Arial";
    context.fillText(place, x + width / 2, y + 78);
    context.fillStyle = "#f8fafc";
    context.font = "700 30px Arial";
    context.fillText(fitText(context, standing.name, width - 32), x + width / 2, y + 130);
    context.fillStyle = "#e2e8f0";
    context.font = "700 27px Arial";
    context.fillText(`${standing.totalPoints} puntos`, x + width / 2, y + 174);
  });

  const last = standings[standings.length - 1];
  const lastPlayers = last ? standings.filter((standing) => standing.totalPoints === last.totalPoints) : [];
  context.fillStyle = "#163827";
  roundedRect(context, 64, 730, 952, 150, 28);
  context.fill();
  context.strokeStyle = "#84cc16";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#bef264";
  context.font = "700 26px Arial";
  context.fillText("EL PASTO DEL GRUPO", 540, 778);
  context.fillStyle = "#f8fafc";
  context.font = "700 34px Arial";
  context.fillText(fitText(context, lastPlayers.map((standing) => standing.name).join(", ") || "-", 850), 540, 824);
  context.fillStyle = "#d9f99d";
  context.font = "24px Arial";
  context.fillText(last ? `${last.totalPoints} puntos` : "Sin datos", 540, 858);

  context.fillStyle = "#f8fafc";
  context.font = "700 38px Arial";
  context.fillText("TABLA COMPLETA", 540, 960);

  const columns = standings.length > 10 ? 2 : 1;
  const rowsPerColumn = Math.ceil(standings.length / columns);
  const columnWidth = columns === 2 ? 456 : 952;
  const columnGap = 40;
  const startX = columns === 2 ? 64 : 64;
  const startY = 1010;
  const rowHeight = Math.min(72, Math.floor(790 / Math.max(rowsPerColumn, 1)));

  standings.forEach((standing, index) => {
    const column = Math.floor(index / rowsPerColumn);
    const row = index % rowsPerColumn;
    const x = startX + column * (columnWidth + columnGap);
    const y = startY + row * rowHeight;
    context.fillStyle = index === 0 ? "rgba(250, 204, 21, 0.18)" : "rgba(15, 23, 42, 0.62)";
    roundedRect(context, x, y, columnWidth, rowHeight - 8, 16);
    context.fill();
    context.fillStyle = index === 0 ? "#fde047" : "#f8fafc";
    context.font = "700 26px Arial";
    context.textAlign = "left";
    context.fillText(`${index + 1}.`, x + 18, y + rowHeight / 2 + 5);
    context.fillText(fitText(context, standing.name, columnWidth - 190), x + 70, y + rowHeight / 2 + 5);
    context.textAlign = "right";
    context.fillText(`${standing.totalPoints} pts`, x + columnWidth - 18, y + rowHeight / 2 + 5);
  });

  context.textAlign = "center";
  context.fillStyle = "#93c5fd";
  context.font = "700 24px Arial";
  context.fillText("Hecho para compartir en historias de WhatsApp", 540, 1870);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen")), "image/png")
  );
};

export const ShareRankingButton = ({ standings, title }: { standings: Standing[]; title: string }) => {
  const share = async () => {
    const blob = await createRankingImage(standings, title);
    const file = new File([blob], "ranking-quiniela-mundial-2026-historia.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Ranking Quiniela Mundial 2026", text: title, files: [file] });
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
    window.open(`https://wa.me/?text=${encodeURIComponent(`Ranking Quiniela Mundial 2026 - ${title}. Adjunta la imagen descargada.`)}`, "_blank");
  };
  return <button className="button-secondary" onClick={() => void share()}>Compartir historia por WhatsApp</button>;
};
