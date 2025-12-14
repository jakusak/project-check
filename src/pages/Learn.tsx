import { learnItems } from "../data/portfolio-data";

export function Learn() {
  // Sort items by order
  const sortedItems = [...learnItems].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="section-padding border-b border-border">
        <div className="container-narrow">
          <h1>Learn</h1>
          <p className="text-lg text-muted-foreground mt-4">
            Notes on building, operating, and learning from failed attempts.
          </p>
        </div>
      </section>

      {/* Items */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="space-y-12">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="border-b border-border pb-12 last:border-0"
              >
                <h3 className="mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                {item.date && (
                  <div className="text-sm text-muted-foreground mt-4">
                    {item.date}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
