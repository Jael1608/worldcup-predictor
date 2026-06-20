import { Standing } from "../types";
import { useUserDateTime } from "../hooks/useUserDateTime";

const fitText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (context.measureText(text).width <= maxWidth) return text;
  let shortened = text;
  while (shortened.length > 1 && context.measureText(`${shortened}...`).width > maxWidth) shortened = shortened.slice(0, -1);
  return `${shortened}...`;
};

const createRankingImage = async (standings: Standing[], title: string, formattedNow: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 350 + standings.length * 78;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, 1080, canvas.height);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(1, "#173b73");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#60a5fa";
  context.font = "700 34px Arial";
  context.fillText("QUINIELA MUNDIAL 2026", 64, 76);
  context.fillStyle = "#f8fafc";
  context.font = "700 56px Arial";
  context.fillText(title, 64, 148);
  context.fillStyle = "#94a3b8";
  context.font = "28px Arial";
  context.fillText(formattedNow, 64, 198);

  const columns = {
    name: 74,
    points: 690,
    exact: 835,
    winners: 990
  };
  context.fillStyle = "#93c5fd";
  context.font = "700 22px Arial";
  context.textAlign = "left";
  context.fillText("JUGADOR", columns.name, 260);
  context.textAlign = "center";
  context.fillText("PTS", columns.points, 260);
  context.fillText("EXACTOS", columns.exact, 260);
  context.fillText("GANADORES", columns.winners, 260);

  context.strokeStyle = "#3b82f6";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(64, 278);
  context.lineTo(1016, 278);
  context.stroke();

  standings.forEach((standing, index) => {
    const y = 330 + index * 78;
    context.fillStyle = index === 0 ? "#facc15" : "#f8fafc";
    context.font = "700 30px Arial";
    context.textAlign = "left";
    context.fillText(`${index + 1}. ${fitText(context, standing.name, 500)}`, columns.name, y);
    context.textAlign = "center";
    context.fillText(`${standing.totalPoints}`, columns.points, y);
    context.fillText(`${standing.exactScores}`, columns.exact, y);
    context.fillText(`${standing.winnerHits}`, columns.winners, y);

    context.strokeStyle = "#30415d";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(64, y + 25);
    context.lineTo(1016, y + 25);
    context.stroke();
  });

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen")), "image/png")
  );
};

export const ShareRankingButton = ({ standings, title }: { standings: Standing[]; title: string }) => {
  const { formatDateTime } = useUserDateTime();
  const share = async () => {
    const blob = await createRankingImage(standings, title, formatDateTime(new Date()));
    const file = new File([blob], "ranking-quiniela-mundial-2026.png", { type: "image/png" });
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
  return <button className="button-secondary" onClick={() => void share()}>Compartir imagen por WhatsApp</button>;
};
