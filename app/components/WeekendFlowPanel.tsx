import { BarChart3, Megaphone, PlaySquare } from "lucide-react";

type WeekendFlowPanelProps = {
  stacks: string[];
};

const weekendTracks = [
  {
    title: "Investimentos",
    description: "Revisar carteira, patrimônio e próximos aportes.",
    icon: BarChart3,
    href: "#finance",
    tone: "investment"
  },
  {
    title: "YouTube",
    description: "Planejar pauta, roteiro ou gravação curta.",
    icon: PlaySquare,
    href: "#saturday",
    tone: "youtube"
  },
  {
    title: "Marketing digital",
    description: "Testar ideia de conteúdo, distribuição ou posicionamento.",
    icon: Megaphone,
    href: "#saturday",
    tone: "marketing"
  }
] as const;

export default function WeekendFlowPanel({ stacks }: WeekendFlowPanelProps) {
  const stackText = stacks.length ? stacks.slice(0, 3).join(", ") : "Frontend, Backend e carreira internacional";

  return (
    <section className="weekendFlow" aria-labelledby="weekend-flow-title">
      <div className="weekendFlowHeader">
        <div>
          <p className="eyebrow">modo opcional</p>
          <h2 id="weekend-flow-title">Fim de semana sem cobrança</h2>
        </div>
        <span>{stackText}</span>
      </div>

      <div className="weekendFlowGrid">
        {weekendTracks.map((track) => {
          const Icon = track.icon;

          return (
            <a className={`weekendTrack ${track.tone}`} href={track.href} key={track.title}>
              <span>
                <Icon size={18} aria-hidden />
              </span>
              <strong>{track.title}</strong>
              <small>{track.description}</small>
            </a>
          );
        })}
      </div>
    </section>
  );
}
