import { journeyPhases } from "../data/portfolio-data";

export function Journey() {
  // Sort phases by order
  const sortedPhases = [...journeyPhases].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="section-padding border-b border-border">
        <div className="container-narrow">
          <h1>Journey</h1>
          <p className="text-lg text-muted-foreground mt-4">
            Key phases of professional development.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="space-y-16">
            {sortedPhases.map((phase, index) => (
              <div
                key={phase.id}
                className="relative border-l-2 border-border pl-8 pb-8"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-0 -ml-[9px] w-4 h-4 rounded-full bg-foreground" />

                {/* Period */}
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  {phase.period}
                </div>

                {/* Title */}
                <h3 className="mb-3">{phase.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
