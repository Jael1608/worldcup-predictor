import { Standing } from "../types";

const createRankingImage = async (standings: Standing[], title: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 300 + standings.length * 78;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, 1080, canvas.height);
  gradient.addColorStop(0, "#07111f"); gradient.addColorStop(1, "#173b73");
  context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#60a5fa"; context.font = "700 34px Arial"; context.fillText("QUINIELA MUNDIAL 2026", 64, 76);
  context.fillStyle = "#f8fafc"; context.font = "700 56px Arial"; context.fillText(title, 64, 148);
  context.fillStyle = "#94a3b8"; context.font = "28px Arial"; context.fillText(new Date().toLocaleString(), 64, 198);
  standings.forEach((standing, index) => {
    const y = 270 + index * 78;
    context.fillStyle = index === 0 ? "#facc15" : "#f8fafc";
    context.font = "700 32px Arial"; context.fillText(`${index + 1}. ${standing.name}`, 74, y);
    context.textAlign = "right"; context.fillText(`${standing.totalPoints} pts`, 1000, y); context.textAlign = "left";
    context.strokeStyle = "#30415d"; context.beginPath(); context.moveTo(64, y + 25); context.lineTo(1016, y + 25); context.stroke();
  });
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen")), "image/png"));
};

export const ShareRankingButton = ({ standings, title }: { standings: Standing[]; title: string }) => {
  const share = async () => {
    const blob = await createRankingImage(standings, title);
    const file = new File([blob], "ranking-quiniela-mundial-2026.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Ranking Quiniela Mundial 2026", text: title, files: [file] });
      return;
    }
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = file.name; anchor.click(); URL.revokeObjectURL(url);
    window.open(`https://wa.me/?text=${encodeURIComponent(`Ranking Quiniela Mundial 2026 - ${title}. Adjunta la imagen descargada.`)}`, "_blank");
  };
  return <button className="button-secondary" onClick={() => void share()}>Compartir imagen por WhatsApp</button>;
};
